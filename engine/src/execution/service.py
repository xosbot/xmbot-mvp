from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from decimal import Decimal

from ..broker.base import Broker, BrokerCapabilityNotSupported
from ..core.types import BrokerOrderSnapshot, Order, OrderStatus, Signal
from ..db.financial_models import OrderIntentStatus
from .client_order_id import generate_client_order_id
from .exceptions import (
    BrokerOrderRejectedError,
    BrokerSubmissionUnknownError,
    FinancialStateUncertainError,
)
from .repository import ExecutionRepository

log = logging.getLogger("xmbot.execution")


@dataclass(frozen=True)
class ExecutionOutcome:
    intent_id: str
    client_order_id: str
    status: OrderIntentStatus
    broker_order_id: str | None = None
    filled_price: Decimal | None = None
    filled_quantity: Decimal = Decimal("0")
    duplicate_prevented: bool = False


class ExecutionService:
    def __init__(
        self,
        broker: Broker,
        repository: ExecutionRepository,
        health_provider: Callable[[str], str] | None = None,
        pnl_callback: Callable[[str, float, str], Awaitable[None]] | None = None,
    ) -> None:
        self.broker = broker
        self.repository = repository
        self._health_provider = health_provider
        self._pnl_callback = pnl_callback

    async def execute(
        self,
        signal: Signal,
        *,
        volume: float,
        approval_required: bool = True,
        broker_account_id: str | None = None,
    ) -> ExecutionOutcome:
        correlation_id = str(signal.metadata.get("correlation_id") or uuid.uuid4())
        if self.broker.name == "mt5" and broker_account_id is None:
            raise FinancialStateUncertainError(
                "MT5 execution requires an explicit active BrokerAccount; legacy mapping is forbidden"
            )
        client_order_id = generate_client_order_id(
            signal.user_id, signal.id, signal.action.value, self.broker.name
        )
        intent = self.repository.prepare_intent(
            signal=signal,
            client_order_id=client_order_id,
            broker=self.broker.name,
            volume=Decimal(str(volume)),
            risk_amount=Decimal(str(signal.risk_amount * volume)),
            risk_percent=Decimal(str(signal.risk_percent)),
            correlation_id=correlation_id,
            approval_required=approval_required,
            broker_account_id=broker_account_id,
        )

        if intent.status != OrderIntentStatus.CREATED:
            return await self._resolve_existing(intent.id, client_order_id, signal.market)

        if not self.broker.supports_idempotent_execution:
            raise FinancialStateUncertainError(
                f"{self.broker.name} is not approved for live idempotent execution"
            )
        if self._health_provider and self._health_provider(signal.user_id) != "HEALTHY":
            raise FinancialStateUncertainError(
                f"Reconciliation is not HEALTHY for user {signal.user_id}; no order submitted"
            )

        if not self.repository.claim_for_submission(intent.id):
            return await self._resolve_existing(intent.id, client_order_id, signal.market)

        order = Order(
            id=intent.id,
            signal_id=signal.id,
            action=signal.action,
            market=signal.market,
            volume=volume,
            price=signal.entry_price,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            broker=self.broker.name,
            user_id=signal.user_id,
            status=OrderStatus.PENDING,
            client_order_id=client_order_id,
        )
        try:
            result = await self.broker.place_order(order)
        except (TimeoutError, ConnectionError) as error:
            self.repository.record_unknown(intent.id, str(error))
            return await self._recover_unknown(intent.id, client_order_id, signal.market)

        if not result.success:
            self.repository.record_rejection(intent.id, result.error or "Broker rejected order")
            raise BrokerOrderRejectedError(result.error or "Broker rejected order")

        snapshot = await self._snapshot_from_result(order, result)
        executions = await self.broker.get_executions(
            broker_order_id=snapshot.broker_order_id,
            client_order_id=client_order_id,
            symbol=signal.market,
        )
        self.repository.record_snapshot(intent.id, self.broker.name, snapshot, executions)
        await self._record_authoritative_pnl(signal.user_id)
        return self._outcome(intent.id, client_order_id)

    async def _resolve_existing(
        self, intent_id: str, client_order_id: str, symbol: str
    ) -> ExecutionOutcome:
        intent = self.repository.get_intent(client_order_id)
        if intent is None:
            raise BrokerSubmissionUnknownError("Durable intent disappeared")
        if intent.status == OrderIntentStatus.FILLED:
            outcome = self._outcome(intent_id, client_order_id)
            return ExecutionOutcome(**{**outcome.__dict__, "duplicate_prevented": True})
        if intent.status == OrderIntentStatus.SUBMITTING:
            # Another worker owns the atomic submission claim. Waiting is only
            # an optimization; correctness comes from never resubmitting this
            # state and from the database claim/unique client ID.
            for _ in range(100):
                await asyncio.sleep(0.01)
                refreshed = self.repository.get_intent(client_order_id)
                if refreshed and refreshed.status != OrderIntentStatus.SUBMITTING:
                    return await self._resolve_existing(intent_id, client_order_id, symbol)
            raise BrokerSubmissionUnknownError("Submission owner has not recorded an outcome")
        if intent.status in {
            OrderIntentStatus.SUBMITTED,
            OrderIntentStatus.ACKNOWLEDGED,
            OrderIntentStatus.PARTIALLY_FILLED,
            OrderIntentStatus.SUBMISSION_UNKNOWN,
        }:
            return await self._recover_unknown(intent_id, client_order_id, symbol)
        raise BrokerSubmissionUnknownError(
            f"Intent {intent_id} is {intent.status}; automatic retry is disabled"
        )

    async def _recover_unknown(
        self, intent_id: str, client_order_id: str, symbol: str
    ) -> ExecutionOutcome:
        try:
            snapshot = await self.broker.get_order_by_client_id(client_order_id, symbol)
        except BrokerCapabilityNotSupported as error:
            raise BrokerSubmissionUnknownError(str(error)) from error
        if snapshot is None:
            raise BrokerSubmissionUnknownError(
                "Broker order absence is not proven; submission remains uncertain"
            )
        executions = await self.broker.get_executions(
            broker_order_id=snapshot.broker_order_id,
            client_order_id=client_order_id,
            symbol=symbol,
        )
        self.repository.record_snapshot(intent_id, self.broker.name, snapshot, executions)
        intent = self.repository.get_intent(client_order_id)
        if intent:
            await self._record_authoritative_pnl(intent.user_id)
        outcome = self._outcome(intent_id, client_order_id)
        return ExecutionOutcome(**{**outcome.__dict__, "duplicate_prevented": True})

    async def _snapshot_from_result(self, order: Order, result) -> BrokerOrderSnapshot:
        broker_order_id = result.broker_order_id or result.order_id
        existing = await self.broker.get_order_by_client_id(order.client_order_id or order.id, order.market)
        if existing:
            return existing
        return BrokerOrderSnapshot(
            broker_order_id=broker_order_id,
            client_order_id=order.client_order_id or order.id,
            symbol=order.market,
            side=order.action,
            order_type=order.order_type,
            status="FILLED" if result.filled_volume else "ACKNOWLEDGED",
            requested_quantity=Decimal(str(order.volume)),
            filled_quantity=Decimal(str(result.filled_volume or 0)),
            average_fill_price=(
                Decimal(str(result.filled_price)) if result.filled_price is not None else None
            ),
            raw_response={"normalized_from_order_result": True},
        )

    def _outcome(self, intent_id: str, client_order_id: str) -> ExecutionOutcome:
        stored = self.repository.outcome(client_order_id)
        if stored is None:
            raise BrokerSubmissionUnknownError("Execution outcome was not durably stored")
        intent, broker_order = stored
        return ExecutionOutcome(
            intent_id=intent_id,
            client_order_id=client_order_id,
            status=intent.status,
            broker_order_id=broker_order.broker_order_id if broker_order else None,
            filled_price=broker_order.average_fill_price if broker_order else None,
            filled_quantity=broker_order.filled_quantity if broker_order else Decimal("0"),
        )

    async def _record_authoritative_pnl(self, user_id: str) -> None:
        if not self._pnl_callback:
            return
        for execution_id, pnl in self.repository.pending_risk_contributions(user_id):
            await self._pnl_callback(user_id, float(pnl), execution_id)
            self.repository.mark_risk_accounted(execution_id)
