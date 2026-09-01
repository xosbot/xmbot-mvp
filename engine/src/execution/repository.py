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
    FinancialPosition,
    LedgerEvent,
    OrderIntent,
    OrderIntentStatus,
    PositionStatus,
    SignalStatus,
    TradingSignal,
)
from .exceptions import BrokerAccountMismatchError
from .position_reconstruction import reconstruct_position_from_deals
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
        broker_account_id: str | None = None,
    ) -> OrderIntent:
        """Transaction A: commit all pre-submission state or commit nothing."""
        account_id = broker_account_id or self._legacy_account_id(signal.user_id, broker)
        try:
            with self._session_factory.begin() as session:
                existing = session.scalar(
                    select(OrderIntent).where(OrderIntent.client_order_id == client_order_id)
                )
                if existing:
                    session.expunge(existing)
                    return existing

                account = session.get(BrokerAccount, account_id)
                if broker_account_id and (
                    account is None
                    or account.user_id != signal.user_id
                    or account.broker != broker
                    or account.status != "ACTIVE"
                ):
                    raise BrokerAccountMismatchError(
                        "Broker account is missing, inactive, wrong-broker, or owned by another user"
                    )
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
    ) -> list[BrokerExecution]:
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

            added_fills: list[BrokerExecution] = []
            for fill in executions:
                exists = session.scalar(
                    select(Execution.id).where(
                        Execution.broker_order_id == broker_order.id,
                        Execution.broker_execution_id == fill.broker_execution_id,
                    )
                )
                if exists:
                    continue
                execution = Execution(
                        broker_order_id=broker_order.id,
                        broker_account_id=intent.broker_account_id,
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
                        gross_profit=fill.gross_profit,
                        swap=fill.swap,
                        position_id=fill.position_id,
                        entry_type=fill.entry_type,
                        magic=fill.magic,
                        comment=fill.comment,
                        execution_time=fill.timestamp,
                        raw_response=fill.raw_response,
                    )
                session.add(execution)
                session.flush()
                self._reconstruct_position(session, intent, fill.position_id)
                added_fills.append(fill)
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
            return added_fills

    @staticmethod
    def _reconstruct_position(
        session: Session, intent: OrderIntent, position_id: str | None
    ) -> None:
        """Transactionally derive the position view from all durable broker deals."""
        if not position_id:
            return
        deals = list(
            session.scalars(
                select(Execution)
                .where(
                    Execution.broker_account_id == intent.broker_account_id,
                    Execution.position_id == position_id,
                )
                .order_by(Execution.execution_time, Execution.broker_execution_id)
            )
        )
        position = session.scalar(
            select(FinancialPosition).where(
                FinancialPosition.broker_account_id == intent.broker_account_id,
                FinancialPosition.broker_position_id == position_id,
            )
        )
        reconstruction = reconstruct_position_from_deals(deals, position_id=position_id)
        if reconstruction.status == PositionStatus.RECONCILIATION_REQUIRED:
            if position:
                position.status = PositionStatus.RECONCILIATION_REQUIRED
            return
        first_entry = next((item for item in deals if item.entry_type == "IN"), None)
        if first_entry is None:
            return
        if position is None:
            position = FinancialPosition(
                user_id=intent.user_id,
                broker_account_id=intent.broker_account_id,
                strategy_id=intent.strategy_id,
                signal_id=intent.signal_id,
                symbol=first_entry.symbol,
                side=first_entry.side,
                quantity=reconstruction.entry_quantity,
                current_quantity=reconstruction.remaining_quantity,
                average_entry_price=reconstruction.average_entry_price,
                stop_loss=intent.stop_loss,
                take_profit=intent.take_profit,
                broker_position_id=position_id,
                status=reconstruction.status,
                opened_at=reconstruction.opened_at or first_entry.execution_time,
            )
            session.add(position)
        position.quantity = reconstruction.entry_quantity
        position.current_quantity = reconstruction.remaining_quantity
        position.average_entry_price = reconstruction.average_entry_price
        position.gross_realized_pnl = reconstruction.gross_realized_pnl
        position.commission = reconstruction.commission
        position.swap = reconstruction.swap
        position.fees = reconstruction.fees
        position.realized_pnl = reconstruction.net_realized_pnl
        position.status = reconstruction.status
        position.closed_at = reconstruction.closed_at

    def pending_risk_contributions(self, user_id: str) -> list[tuple[str, Decimal]]:
        with self._session_factory() as session:
            return list(
                session.execute(
                    select(Execution.id, Execution.realized_pnl).where(
                        Execution.user_id == user_id,
                        Execution.entry_type.in_(["OUT", "OUT_BY"]),
                        Execution.realized_pnl.is_not(None),
                        Execution.risk_accounted_at.is_(None),
                    )
                )
            )

    def mark_risk_accounted(self, execution_id: str) -> None:
        with self._session_factory.begin() as session:
            session.execute(
                update(Execution)
                .where(
                    Execution.id == execution_id,
                    Execution.risk_accounted_at.is_(None),
                )
                .values(risk_accounted_at=datetime.now(UTC))
            )

    def ingest_reconciled_execution(
        self, broker_account_id: str, fill: BrokerExecution
    ) -> tuple[str, str] | None:
        """Persist a missed deal by position ownership; never associate by symbol alone."""
        if not fill.position_id:
            return None
        with self._session_factory.begin() as session:
            existing = session.scalar(
                select(Execution).where(
                    Execution.broker_account_id == broker_account_id,
                    Execution.broker_execution_id == fill.broker_execution_id,
                )
            )
            if existing:
                return existing.user_id, existing.id
            position = session.scalar(
                select(FinancialPosition).where(
                    FinancialPosition.broker_account_id == broker_account_id,
                    FinancialPosition.broker_position_id == fill.position_id,
                )
            )
            if position is None:
                return None
            intent = session.scalar(
                select(OrderIntent).where(OrderIntent.signal_id == position.signal_id)
            )
            if intent is None:
                return None
            broker_order = session.scalar(
                select(BrokerOrder)
                .where(BrokerOrder.order_intent_id == intent.id)
                .order_by(BrokerOrder.created_at)
            )
            if broker_order is None:
                return None
            execution = Execution(
                broker_order_id=broker_order.id,
                broker_account_id=broker_account_id,
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
                gross_profit=fill.gross_profit,
                swap=fill.swap,
                position_id=fill.position_id,
                entry_type=fill.entry_type,
                magic=fill.magic,
                comment=fill.comment,
                execution_time=fill.timestamp,
                raw_response=fill.raw_response,
            )
            session.add(execution)
            session.flush()
            self._reconstruct_position(session, intent, fill.position_id)
            session.add(
                self._event(
                    intent,
                    "MISSED_BROKER_EXECUTION_INGESTED",
                    broker_order_id=broker_order.id,
                    payload={"broker_execution_id": fill.broker_execution_id},
                )
            )
            return intent.user_id, execution.id

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
    if normalized == "REJECTED":
        return OrderIntentStatus.REJECTED
    if normalized in {"CANCELLED", "EXPIRED"}:
        return OrderIntentStatus.CANCELLED
    if normalized == "UNKNOWN":
        return OrderIntentStatus.RECONCILIATION_REQUIRED
    return OrderIntentStatus.ACKNOWLEDGED


def user_id_hash(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:20]
