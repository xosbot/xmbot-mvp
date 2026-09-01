from __future__ import annotations

import logging
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from ..broker.base import Broker, BrokerCapabilityNotSupported
from ..core.types import Position
from ..db.financial_models import (
    BrokerAccount,
    BrokerOrder,
    Execution,
    FinancialPosition,
    LedgerEvent,
    OrderIntent,
    OrderIntentStatus,
    PositionStatus,
    ReconciliationCursor,
    ReconciliationIssue,
)
from ..execution.repository import ExecutionRepository
from .models import (
    MismatchType,
    ReconciliationHealth,
    ReconciliationMismatch,
    ReconciliationSeverity,
)

log = logging.getLogger("xmbot.reconciliation")


class ReconciliationService:
    def __init__(
        self,
        broker: Broker,
        session_factory: sessionmaker[Session],
        *,
        pnl_callback: Callable[[str, float, str], Awaitable[None]] | None = None,
        alert_callback: Callable[[str], Awaitable[None]] | None = None,
    ) -> None:
        self.broker = broker
        self._session_factory = session_factory
        self._pnl_callback = pnl_callback
        self._alert_callback = alert_callback
        self._execution_repository = ExecutionRepository(session_factory)
        self._health: dict[str, ReconciliationHealth] = {}

    def health_for_user(self, user_id: str) -> ReconciliationHealth:
        with self._session_factory() as session:
            open_issues = list(
                session.scalars(
                    select(ReconciliationIssue).where(
                        ReconciliationIssue.user_id == user_id,
                        ReconciliationIssue.status == "OPEN",
                    )
                )
            )
        if any(item.severity == ReconciliationSeverity.CRITICAL.value for item in open_issues):
            return ReconciliationHealth.UNSAFE
        if open_issues:
            return ReconciliationHealth.DEGRADED
        default = (
            ReconciliationHealth.HEALTHY
            if self.broker.name == "paper"
            else ReconciliationHealth.UNSAFE
        )
        return self._health.get(user_id, default)

    async def startup_reconcile(self) -> ReconciliationHealth:
        with self._session_factory() as session:
            accounts = list(
                session.scalars(
                    select(BrokerAccount).where(
                        BrokerAccount.broker == self.broker.name,
                        BrokerAccount.status == "ACTIVE",
                    )
                )
            )
        if not accounts:
            # Paper can start before its first synthetic account is created.
            return (
                ReconciliationHealth.HEALTHY
                if self.broker.name == "paper"
                else ReconciliationHealth.UNSAFE
            )
        results = [await self.reconcile_account(account.id, account.user_id) for account in accounts]
        if ReconciliationHealth.UNSAFE in results:
            return ReconciliationHealth.UNSAFE
        if ReconciliationHealth.DEGRADED in results:
            return ReconciliationHealth.DEGRADED
        return ReconciliationHealth.HEALTHY

    async def reconcile_all(self) -> ReconciliationHealth:
        return await self.startup_reconcile()

    async def reconcile_account(
        self, broker_account_id: str, user_id: str
    ) -> ReconciliationHealth:
        correlation_id = str(uuid.uuid4())
        self._ledger(
            "BROKER_RECONCILIATION_STARTED",
            user_id,
            broker_account_id,
            correlation_id,
            {},
        )
        if not await self.broker.is_connected():
            mismatch = self._mismatch(
                MismatchType.BROKER_UNAVAILABLE,
                ReconciliationSeverity.CRITICAL,
                user_id,
                broker_account_id,
            )
            return await self._finish(
                user_id, broker_account_id, correlation_id, [mismatch], complete_snapshot=False
            )

        try:
            broker_orders = await self.broker.get_open_orders()
            broker_positions = await self.broker.get_positions()
            account_info = await self.broker.get_account()
            with self._session_factory() as session:
                cursor = session.get(ReconciliationCursor, broker_account_id)
                history_since = (
                    cursor.last_successful_at - timedelta(minutes=5)
                    if cursor and cursor.last_successful_at
                    else datetime.now(UTC) - timedelta(days=30)
                )
            broker_executions = await self.broker.get_executions(since=history_since)
        except (BrokerCapabilityNotSupported, RuntimeError) as error:
            mismatch = self._mismatch(
                MismatchType.BROKER_UNAVAILABLE,
                ReconciliationSeverity.CRITICAL,
                user_id,
                broker_account_id,
                broker_state={"error": str(error)},
            )
            return await self._finish(
                user_id, broker_account_id, correlation_id, [mismatch], complete_snapshot=False
            )

        with self._session_factory() as session:
            account_record = session.get(BrokerAccount, broker_account_id)
        if (
            account_info
            and account_info.external_account_id
            and account_record
            and account_record.external_account_id != account_info.external_account_id
        ):
            mismatch = self._mismatch(
                MismatchType.BALANCE_MISMATCH,
                ReconciliationSeverity.CRITICAL,
                user_id,
                broker_account_id,
                internal_state={"external_account_id": account_record.external_account_id},
                broker_state={"external_account_id": account_info.external_account_id},
                recommended_action="Stop worker: connected MT5 login does not match BrokerAccount",
            )
            return await self._finish(user_id, broker_account_id, correlation_id, [mismatch])

        with self._session_factory() as session:
            internal_orders = list(
                session.scalars(
                    select(BrokerOrder)
                    .join(OrderIntent)
                    .where(OrderIntent.broker_account_id == broker_account_id)
                )
            )
            internal_positions = list(
                session.scalars(
                    select(FinancialPosition).where(
                        FinancialPosition.broker_account_id == broker_account_id,
                        FinancialPosition.status.in_(
                            [PositionStatus.OPEN, PositionStatus.PARTIALLY_CLOSED]
                        ),
                    )
                )
            )
            unknown_intents = list(
                session.scalars(
                    select(OrderIntent).where(
                        OrderIntent.broker_account_id == broker_account_id,
                        OrderIntent.status == OrderIntentStatus.SUBMISSION_UNKNOWN,
                    )
                )
            )

        mismatches: list[ReconciliationMismatch] = []
        last_deal_id: str | None = None
        for fill in broker_executions:
            last_deal_id = fill.broker_execution_id
            ingested = self._execution_repository.ingest_reconciled_execution(
                broker_account_id, fill
            )
            if ingested is None:
                with self._session_factory() as session:
                    known = session.scalar(
                        select(Execution.id).where(
                            Execution.broker_account_id == broker_account_id,
                            Execution.broker_execution_id == fill.broker_execution_id,
                        )
                    )
                if not known:
                    mismatches.append(
                        self._mismatch(
                            MismatchType.UNRECORDED_EXECUTION,
                            ReconciliationSeverity.CRITICAL,
                            user_id,
                            broker_account_id,
                            symbol=fill.symbol,
                            broker_id=fill.broker_execution_id,
                            broker_state={"position_id": fill.position_id},
                            recommended_action="Map the deal by MT5 position identifier",
                        )
                    )
        if self._pnl_callback:
            for execution_id, pnl in self._execution_repository.pending_risk_contributions(user_id):
                await self._pnl_callback(user_id, float(pnl), execution_id)
                self._execution_repository.mark_risk_accounted(execution_id)
        internal_client_ids = {item.client_order_id for item in internal_orders}
        for order in broker_orders:
            if order.client_order_id not in internal_client_ids:
                mismatches.append(
                    self._mismatch(
                        MismatchType.UNKNOWN_BROKER_ORDER,
                        ReconciliationSeverity.CRITICAL,
                        user_id,
                        broker_account_id,
                        symbol=order.symbol,
                        broker_id=order.broker_order_id,
                        broker_state=order.raw_response,
                    )
                )

        internal_position_ids = {
            item.broker_position_id: item for item in internal_positions if item.broker_position_id
        }
        broker_position_ids = {
            item.broker_position_id or item.id: item for item in broker_positions
        }
        for broker_id, position in broker_position_ids.items():
            if broker_id not in internal_position_ids:
                mismatches.append(self._unknown_position(user_id, broker_account_id, position))

        for broker_id, position in internal_position_ids.items():
            if broker_id not in broker_position_ids:
                self._mark_reconciliation_required(position.id)
                mismatches.append(
                    self._mismatch(
                        MismatchType.POSITION_DISAPPEARED,
                        ReconciliationSeverity.CRITICAL,
                        user_id,
                        broker_account_id,
                        symbol=position.symbol,
                        internal_id=position.id,
                        broker_id=broker_id,
                        internal_state={"status": position.status.value},
                        recommended_action="Retrieve and verify MT5 exit deals before finalizing P&L",
                    )
                )
            else:
                mismatches.extend(
                    self._position_mismatches(
                        user_id,
                        broker_account_id,
                        position,
                        broker_position_ids[broker_id],
                    )
                )
        for intent in unknown_intents:
            mismatches.append(
                self._mismatch(
                    MismatchType.SUBMISSION_UNKNOWN,
                    ReconciliationSeverity.CRITICAL,
                    user_id,
                    broker_account_id,
                    symbol=intent.symbol,
                    internal_id=intent.id,
                )
            )
        health = await self._finish(user_id, broker_account_id, correlation_id, mismatches)
        with self._session_factory.begin() as session:
            cursor = session.get(ReconciliationCursor, broker_account_id)
            if cursor is None:
                cursor = ReconciliationCursor(broker_account_id=broker_account_id)
                session.add(cursor)
            cursor.last_successful_at = datetime.now(UTC)
            cursor.last_deal_id = last_deal_id or cursor.last_deal_id
        return health

    async def _finish(
        self,
        user_id: str,
        broker_account_id: str,
        correlation_id: str,
        mismatches: list[ReconciliationMismatch],
        *,
        complete_snapshot: bool = True,
    ) -> ReconciliationHealth:
        now = datetime.now(UTC)
        current_ids = {item.mismatch_id for item in mismatches}
        with self._session_factory.begin() as session:
            for mismatch in mismatches:
                issue = session.get(ReconciliationIssue, mismatch.mismatch_id)
                if issue is None:
                    issue = ReconciliationIssue(
                        id=mismatch.mismatch_id,
                        broker_account_id=broker_account_id,
                        user_id=user_id,
                        mismatch_type=mismatch.type.value,
                        severity=mismatch.severity.value,
                        symbol=mismatch.symbol,
                        internal_id=mismatch.internal_id,
                        broker_id=mismatch.broker_id,
                        status="OPEN",
                        detected_at=mismatch.detected_at,
                        last_seen_at=now,
                        payload_json=mismatch.to_payload(),
                    )
                    session.add(issue)
                    session.add(
                        self._ledger_event(
                            "BROKER_RECONCILIATION_MISMATCH",
                            user_id,
                            broker_account_id,
                            correlation_id,
                            mismatch.to_payload(),
                        )
                    )
                else:
                    issue.status = "OPEN"
                    issue.last_seen_at = now
                    issue.resolved_at = None
                    issue.resolution_method = None
                    issue.payload_json = mismatch.to_payload()
            if complete_snapshot:
                unresolved = list(
                    session.scalars(
                        select(ReconciliationIssue).where(
                            ReconciliationIssue.broker_account_id == broker_account_id,
                            ReconciliationIssue.status == "OPEN",
                        )
                    )
                )
                for issue in unresolved:
                    if issue.id in current_ids:
                        continue
                    issue.status = "RESOLVED"
                    issue.resolved_at = now
                    issue.resolution_method = "successful broker reconciliation"
                    session.add(
                        self._ledger_event(
                            "BROKER_RECONCILIATION_RESOLVED",
                            user_id,
                            broker_account_id,
                            correlation_id,
                            {
                                "mismatch_id": issue.id,
                                "type": issue.mismatch_type,
                                "resolution_method": issue.resolution_method,
                            },
                        )
                    )
            open_issues = list(
                session.scalars(
                    select(ReconciliationIssue).where(
                        ReconciliationIssue.broker_account_id == broker_account_id,
                        ReconciliationIssue.status == "OPEN",
                    )
                )
            )
        if any(item.severity == ReconciliationSeverity.CRITICAL.value for item in open_issues):
            health = ReconciliationHealth.UNSAFE
        elif open_issues:
            health = ReconciliationHealth.DEGRADED
        else:
            health = ReconciliationHealth.HEALTHY
        self._health[user_id] = health
        if health == ReconciliationHealth.UNSAFE and self._alert_callback:
            await self._alert_callback(
                f"🛑 Reconciliation UNSAFE for user={user_id} account={broker_account_id}; "
                f"{len(mismatches)} mismatch(es). No new trades."
            )
        return health

    def _mark_reconciliation_required(self, position_id: str) -> None:
        with self._session_factory.begin() as session:
            position = session.get(FinancialPosition, position_id, with_for_update=True)
            if position:
                position.status = PositionStatus.RECONCILIATION_REQUIRED

    def _position_mismatches(
        self,
        user_id: str,
        account_id: str,
        internal: FinancialPosition,
        broker: Position,
    ) -> list[ReconciliationMismatch]:
        checks = (
            (MismatchType.QUANTITY_MISMATCH, internal.current_quantity, Decimal(str(broker.volume))),
            (MismatchType.ENTRY_PRICE_MISMATCH, internal.average_entry_price, Decimal(str(broker.entry_price))),
            (MismatchType.STOP_LOSS_MISMATCH, internal.stop_loss, Decimal(str(broker.stop_loss))),
            (
                MismatchType.TAKE_PROFIT_MISMATCH,
                internal.take_profit,
                Decimal(str(broker.take_profit)) if broker.take_profit is not None else None,
            ),
        )
        return [
            self._mismatch(
                mismatch_type,
                ReconciliationSeverity.WARNING,
                user_id,
                account_id,
                symbol=internal.symbol,
                internal_id=internal.id,
                broker_id=broker.broker_position_id or broker.id,
                internal_state={"value": str(expected)},
                broker_state={"value": str(actual)},
            )
            for mismatch_type, expected, actual in checks
            if expected != actual
        ]

    def _unknown_position(
        self, user_id: str, account_id: str, position: Position
    ) -> ReconciliationMismatch:
        return self._mismatch(
            MismatchType.UNKNOWN_BROKER_POSITION,
            ReconciliationSeverity.CRITICAL,
            user_id,
            account_id,
            symbol=position.symbol,
            broker_id=position.broker_position_id or position.id,
            broker_state={"quantity": position.volume, "entry_price": position.entry_price},
            recommended_action="Verify the manual MT5 position; do not adopt or close automatically",
        )

    @staticmethod
    def _mismatch(
        mismatch_type: MismatchType,
        severity: ReconciliationSeverity,
        user_id: str,
        broker_account_id: str,
        **kwargs,
    ) -> ReconciliationMismatch:
        return ReconciliationMismatch(
            type=mismatch_type,
            severity=severity,
            user_id=user_id,
            broker_account_id=broker_account_id,
            **kwargs,
        )

    def _ledger(
        self,
        event_type: str,
        user_id: str,
        broker_account_id: str,
        correlation_id: str,
        payload: dict,
    ) -> None:
        with self._session_factory.begin() as session:
            session.add(self._ledger_event(event_type, user_id, broker_account_id, correlation_id, payload))

    @staticmethod
    def _ledger_event(
        event_type: str,
        user_id: str,
        broker_account_id: str,
        correlation_id: str,
        payload: dict,
    ) -> LedgerEvent:
        return LedgerEvent(
            event_type=event_type,
            user_id=user_id,
            payload_json={"broker_account_id": broker_account_id, **payload},
            correlation_id=correlation_id,
        )
