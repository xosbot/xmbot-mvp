from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from ..core.types import BrokerExecution, BrokerOrderSnapshot, Signal
from ..db.financial_models import (
    Approval,
    ApprovalDecision,
    BrokerAccount,
    BrokerOrder,
    Execution,
    LedgerEvent,
    OrderIntent,
    OrderIntentStatus,
    SignalStatus,
    TradingSignal,
)
from .state_machine import validate_transition


class ExecutionRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    @staticmethod
    def _legacy_account_id(user_id: str, broker: str) -> str:
        digest = hashlib.sha256(f"{user_id}|{broker}".encode()).hexdigest()[:20]
        return f"legacy-{digest}"

    def prepare_intent(
        self,
        *,
        signal: Signal,
        client_order_id: str,
        broker: str,
        volume: Decimal,
        risk_amount: Decimal,
        risk_percent: Decimal,
        correlation_id: str,
        approval_required: bool,
    ) -> OrderIntent:
        """Transaction A: commit all pre-submission state or commit nothing."""
        account_id = self._legacy_account_id(signal.user_id, broker)
        try:
            with self._session_factory.begin() as session:
                existing = session.scalar(
                    select(OrderIntent).where(OrderIntent.client_order_id == client_order_id)
                )
                if existing:
                    session.expunge(existing)
                    return existing

                account = session.get(BrokerAccount, account_id)
                if account is None:
                    session.add(
                        BrokerAccount(
                            id=account_id,
                            user_id=signal.user_id,
                            broker=broker,
                            external_account_id=f"legacy:{user_id_hash(signal.user_id)}",
                        )
                    )

                if session.get(TradingSignal, signal.id) is None:
                    session.add(
                        TradingSignal(
                            id=signal.id,
                            user_id=signal.user_id,
                            strategy_id=signal.agent or None,
                            agent_name=signal.agent or "unknown",
                            symbol=signal.market,
                            market=signal.market,
                            timeframe=signal.metadata.get("timeframe"),
                            side=signal.action.value,
                            entry_price=Decimal(str(signal.entry_price)),
                            stop_loss=Decimal(str(signal.stop_loss)),
                            take_profit=(
                                Decimal(str(signal.take_profit))
                                if signal.take_profit is not None
                                else None
                            ),
                            confidence=Decimal(str(signal.confidence)),
                            status=SignalStatus.APPROVED,
                            metadata_json=signal.metadata,
                            correlation_id=correlation_id,
                        )
                    )
                    if approval_required:
                        session.add(
                            Approval(
                                signal_id=signal.id,
                                user_id=signal.user_id,
                                decision=ApprovalDecision.APPROVE,
                                approved_size_multiplier=Decimal("1"),
                                source="human_gate",
                                approved_at=datetime.now(UTC),
                                expires_at=datetime.now(UTC) + timedelta(minutes=5),
                            )
                        )

                intent = OrderIntent(
                    client_order_id=client_order_id,
                    user_id=signal.user_id,
                    signal_id=signal.id,
                    broker_account_id=account_id,
                    strategy_id=signal.agent or None,
                    symbol=signal.market,
                    side=signal.action.value,
                    order_type="market",
                    requested_quantity=volume,
                    requested_price=Decimal(str(signal.entry_price)),
                    stop_loss=Decimal(str(signal.stop_loss)),
                    take_profit=(
                        Decimal(str(signal.take_profit)) if signal.take_profit is not None else None
                    ),
                    risk_amount=risk_amount,
                    risk_percent=risk_percent,
                    status=OrderIntentStatus.CREATED,
                    correlation_id=correlation_id,
                )
                session.add(intent)
                session.flush()
                session.add(
                    LedgerEvent(
                        event_type="ORDER_INTENT_CREATED",
                        user_id=signal.user_id,
                        signal_id=signal.id,
                        order_intent_id=intent.id,
                        strategy_id=signal.agent or None,
                        symbol=signal.market,
                        payload_json={"client_order_id": client_order_id},
                        correlation_id=correlation_id,
                    )
                )
                session.flush()
                session.expunge(intent)
                return intent
        except IntegrityError:
            with self._session_factory() as session:
                existing = session.scalar(
                    select(OrderIntent).where(OrderIntent.client_order_id == client_order_id)
                )
                if existing is None:
                    raise
                session.expunge(existing)
                return existing

    def claim_for_submission(self, intent_id: str) -> bool:
        with self._session_factory.begin() as session:
            result = session.execute(
                update(OrderIntent)
                .where(
                    OrderIntent.id == intent_id,
                    OrderIntent.status == OrderIntentStatus.CREATED,
                )
                .values(status=OrderIntentStatus.SUBMITTING, updated_at=datetime.now(UTC))
            )
            return result.rowcount == 1

    def get_intent(self, client_order_id: str) -> OrderIntent | None:
        with self._session_factory() as session:
            intent = session.scalar(
                select(OrderIntent).where(OrderIntent.client_order_id == client_order_id)
            )
            if intent:
                session.expunge(intent)
            return intent

    def record_rejection(self, intent_id: str, error: str) -> None:
        self._transition_with_event(intent_id, OrderIntentStatus.REJECTED, "ORDER_REJECTED", {"error": error})

    def record_unknown(self, intent_id: str, error: str) -> None:
        self._transition_with_event(
            intent_id,
            OrderIntentStatus.SUBMISSION_UNKNOWN,
            "ORDER_SUBMISSION_UNKNOWN",
            {"error": error},
        )

    def record_snapshot(
        self,
        intent_id: str,
        broker: str,
        snapshot: BrokerOrderSnapshot,
        executions: list[BrokerExecution],
    ) -> None:
        """Transactions B/C combined for synchronous acknowledgement/fills."""
        with self._session_factory.begin() as session:
            intent = session.get(OrderIntent, intent_id, with_for_update=True)
            if intent is None:
                raise LookupError(f"OrderIntent not found: {intent_id}")
            target = status_from_snapshot(snapshot)
            validate_transition(intent.status, target)

            broker_order = session.scalar(
                select(BrokerOrder).where(
                    BrokerOrder.broker == broker,
                    BrokerOrder.broker_order_id == snapshot.broker_order_id,
                )
            )
            if broker_order is None:
                broker_order = BrokerOrder(
                    order_intent_id=intent.id,
                    broker=broker,
                    broker_order_id=snapshot.broker_order_id,
                    client_order_id=snapshot.client_order_id,
                    symbol=snapshot.symbol,
                    side=snapshot.side.value,
                    order_type=snapshot.order_type,
                    status=snapshot.status,
                    requested_quantity=snapshot.requested_quantity,
                    filled_quantity=snapshot.filled_quantity,
                    average_fill_price=snapshot.average_fill_price,
                    raw_response=snapshot.raw_response,
                )
                session.add(broker_order)
                session.flush()
                session.add(self._event(intent, "ORDER_ACKNOWLEDGED", broker_order_id=broker_order.id))
            else:
                broker_order.status = snapshot.status
                broker_order.filled_quantity = snapshot.filled_quantity
                broker_order.average_fill_price = snapshot.average_fill_price

            added = 0
            for fill in executions:
                exists = session.scalar(
                    select(Execution.id).where(
                        Execution.broker_order_id == broker_order.id,
                        Execution.broker_execution_id == fill.broker_execution_id,
                    )
                )
                if exists:
                    continue
                session.add(
                    Execution(
                        broker_order_id=broker_order.id,
                        broker_execution_id=fill.broker_execution_id,
                        broker_trade_id=fill.broker_trade_id,
                        user_id=intent.user_id,
                        symbol=fill.symbol,
                        side=fill.side.value,
                        quantity=fill.quantity,
                        price=fill.price,
                        commission=fill.commission,
                        commission_asset=fill.commission_asset,
                        fee=fill.fee,
                        realized_pnl=fill.realized_pnl,
                        execution_time=fill.timestamp,
                        raw_response=fill.raw_response,
                    )
                )
                added += 1
                session.add(
                    self._event(
                        intent,
                        "ORDER_FILLED" if target == OrderIntentStatus.FILLED else "PARTIAL_FILL",
                        broker_order_id=broker_order.id,
                        payload={"broker_execution_id": fill.broker_execution_id},
                    )
                )
            intent.status = target
            intent.updated_at = datetime.now(UTC)

    def outcome(self, client_order_id: str):
        with self._session_factory() as session:
            intent = session.scalar(
                select(OrderIntent).where(OrderIntent.client_order_id == client_order_id)
            )
            if not intent:
                return None
            broker_order = session.scalar(
                select(BrokerOrder).where(BrokerOrder.order_intent_id == intent.id)
            )
            return intent, broker_order

    def _transition_with_event(
        self, intent_id: str, target: OrderIntentStatus, event_type: str, payload: dict
    ) -> None:
        with self._session_factory.begin() as session:
            intent = session.get(OrderIntent, intent_id, with_for_update=True)
            if intent is None:
                raise LookupError(f"OrderIntent not found: {intent_id}")
            validate_transition(intent.status, target)
            intent.status = target
            intent.updated_at = datetime.now(UTC)
            session.add(self._event(intent, event_type, payload=payload))

    @staticmethod
    def _event(
        intent: OrderIntent,
        event_type: str,
        *,
        broker_order_id: str | None = None,
        payload: dict | None = None,
    ) -> LedgerEvent:
        return LedgerEvent(
            event_type=event_type,
            user_id=intent.user_id,
            signal_id=intent.signal_id,
            order_intent_id=intent.id,
            broker_order_id=broker_order_id,
            strategy_id=intent.strategy_id,
            symbol=intent.symbol,
            payload_json=payload or {},
            correlation_id=intent.correlation_id,
        )


def status_from_snapshot(snapshot: BrokerOrderSnapshot) -> OrderIntentStatus:
    normalized = snapshot.status.upper()
    if normalized == "FILLED":
        return OrderIntentStatus.FILLED
    if normalized in {"PARTIAL", "PARTIALLY_FILLED"}:
        return OrderIntentStatus.PARTIALLY_FILLED
    return OrderIntentStatus.ACKNOWLEDGED


def user_id_hash(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:20]
