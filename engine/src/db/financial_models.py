"""Durable financial lifecycle records.

The broker remains authoritative for execution/account state. These tables are
XMBot's durable record of intent, acknowledgement, fills, positions, and audit
events. Financial amounts use Decimal-backed NUMERIC columns; raw broker
payloads are retained for reconciliation and incident analysis.
"""

from __future__ import annotations

import enum
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    event,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .session import Base

MONEY = Numeric(24, 8)
QUANTITY = Numeric(24, 10)
PERCENT = Numeric(12, 6)


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(UTC)


class SignalStatus(str, enum.Enum):
    GENERATED = "GENERATED"
    RISK_REJECTED = "RISK_REJECTED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    ORDER_CREATED = "ORDER_CREATED"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class ApprovalDecision(str, enum.Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    APPROVE_REDUCED = "APPROVE_REDUCED"
    EXPIRED = "EXPIRED"


class OrderIntentStatus(str, enum.Enum):
    CREATED = "CREATED"
    SUBMITTING = "SUBMITTING"
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"
    SUBMISSION_UNKNOWN = "SUBMISSION_UNKNOWN"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"


class PositionStatus(str, enum.Enum):
    OPEN = "OPEN"
    PARTIALLY_CLOSED = "PARTIALLY_CLOSED"
    CLOSED = "CLOSED"
    LIQUIDATED = "LIQUIDATED"
    UNKNOWN = "UNKNOWN"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"


class BrokerAccount(Base):
    __tablename__ = "broker_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    broker: Mapped[str] = mapped_column(String(32), nullable=False)
    external_account_id: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("broker", "external_account_id", name="uq_broker_account_external"),
    )


class TradingSignal(Base):
    __tablename__ = "trading_signals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    strategy_id: Mapped[str | None] = mapped_column(String(64), index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    market: Mapped[str] = mapped_column(String(64), nullable=False)
    timeframe: Mapped[str | None] = mapped_column(String(16))
    side: Mapped[str] = mapped_column(String(16), nullable=False)
    entry_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    stop_loss: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    take_profit: Mapped[Decimal | None] = mapped_column(MONEY)
    confidence: Mapped[Decimal] = mapped_column(PERCENT, nullable=False)
    status: Mapped[SignalStatus] = mapped_column(
        Enum(SignalStatus, native_enum=False, length=32), default=SignalStatus.GENERATED
    )
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    approvals: Mapped[list[Approval]] = relationship(back_populates="signal")
    order_intents: Mapped[list[OrderIntent]] = relationship(back_populates="signal")


class Approval(Base):
    __tablename__ = "trade_approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    signal_id: Mapped[str] = mapped_column(ForeignKey("trading_signals.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    decision: Mapped[ApprovalDecision] = mapped_column(
        Enum(ApprovalDecision, native_enum=False, length=32), nullable=False
    )
    approved_size_multiplier: Mapped[Decimal | None] = mapped_column(PERCENT)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    telegram_message_id: Mapped[str | None] = mapped_column(String(128))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    signal: Mapped[TradingSignal] = relationship(back_populates="approvals")


class OrderIntent(Base):
    __tablename__ = "order_intents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    client_order_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    signal_id: Mapped[str] = mapped_column(ForeignKey("trading_signals.id"), nullable=False, index=True)
    broker_account_id: Mapped[str] = mapped_column(ForeignKey("broker_accounts.id"), nullable=False, index=True)
    strategy_id: Mapped[str | None] = mapped_column(String(64), index=True)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    side: Mapped[str] = mapped_column(String(16), nullable=False)
    order_type: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    requested_price: Mapped[Decimal | None] = mapped_column(MONEY)
    stop_loss: Mapped[Decimal | None] = mapped_column(MONEY)
    take_profit: Mapped[Decimal | None] = mapped_column(MONEY)
    risk_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    risk_percent: Mapped[Decimal] = mapped_column(PERCENT, nullable=False)
    status: Mapped[OrderIntentStatus] = mapped_column(
        Enum(OrderIntentStatus, native_enum=False, length=32), default=OrderIntentStatus.CREATED
    )
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    signal: Mapped[TradingSignal] = relationship(back_populates="order_intents")
    broker_orders: Mapped[list[BrokerOrder]] = relationship(back_populates="order_intent")


class BrokerOrder(Base):
    __tablename__ = "broker_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    order_intent_id: Mapped[str] = mapped_column(ForeignKey("order_intents.id"), nullable=False, index=True)
    broker: Mapped[str] = mapped_column(String(32), nullable=False)
    broker_order_id: Mapped[str] = mapped_column(String(128), nullable=False)
    client_order_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    side: Mapped[str] = mapped_column(String(16), nullable=False)
    order_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    filled_quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False, default=Decimal("0"))
    average_fill_price: Mapped[Decimal | None] = mapped_column(MONEY)
    raw_response: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    order_intent: Mapped[OrderIntent] = relationship(back_populates="broker_orders")
    executions: Mapped[list[Execution]] = relationship(back_populates="broker_order")

    __table_args__ = (
        UniqueConstraint("broker", "broker_order_id", name="uq_broker_order_external"),
    )


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    broker_order_id: Mapped[str] = mapped_column(ForeignKey("broker_orders.id"), nullable=False, index=True)
    broker_account_id: Mapped[str | None] = mapped_column(
        ForeignKey("broker_accounts.id"), nullable=True, index=True
    )
    broker_execution_id: Mapped[str] = mapped_column(String(128), nullable=False)
    broker_trade_id: Mapped[str | None] = mapped_column(String(128))
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    side: Mapped[str] = mapped_column(String(16), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    commission: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=Decimal("0"))
    commission_asset: Mapped[str | None] = mapped_column(String(32))
    fee: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=Decimal("0"))
    realized_pnl: Mapped[Decimal | None] = mapped_column(MONEY)
    gross_profit: Mapped[Decimal | None] = mapped_column(MONEY)
    swap: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=Decimal("0"))
    position_id: Mapped[str | None] = mapped_column(String(128), index=True)
    entry_type: Mapped[str | None] = mapped_column(String(16))
    magic: Mapped[int | None] = mapped_column()
    comment: Mapped[str | None] = mapped_column(String(64))
    execution_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    raw_response: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    broker_order: Mapped[BrokerOrder] = relationship(back_populates="executions")

    __table_args__ = (
        UniqueConstraint("broker_order_id", "broker_execution_id", name="uq_execution_external"),
        UniqueConstraint(
            "broker_account_id",
            "broker_execution_id",
            name="uq_execution_account_external",
        ),
    )


class FinancialPosition(Base):
    __tablename__ = "financial_positions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    broker_account_id: Mapped[str] = mapped_column(ForeignKey("broker_accounts.id"), nullable=False, index=True)
    strategy_id: Mapped[str | None] = mapped_column(String(64), index=True)
    signal_id: Mapped[str | None] = mapped_column(ForeignKey("trading_signals.id"), index=True)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    side: Mapped[str] = mapped_column(String(16), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    average_entry_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    current_quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    stop_loss: Mapped[Decimal | None] = mapped_column(MONEY)
    take_profit: Mapped[Decimal | None] = mapped_column(MONEY)
    broker_position_id: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[PositionStatus] = mapped_column(
        Enum(PositionStatus, native_enum=False, length=32), default=PositionStatus.OPEN
    )
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    realized_pnl: Mapped[Decimal | None] = mapped_column(MONEY)
    fees: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("broker_account_id", "broker_position_id", name="uq_position_external"),
        Index("ix_position_user_status", "user_id", "status"),
    )


class LedgerEvent(Base):
    __tablename__ = "ledger_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    signal_id: Mapped[str | None] = mapped_column(String(64), index=True)
    order_intent_id: Mapped[str | None] = mapped_column(String(36), index=True)
    broker_order_id: Mapped[str | None] = mapped_column(String(36), index=True)
    position_id: Mapped[str | None] = mapped_column(String(36), index=True)
    strategy_id: Mapped[str | None] = mapped_column(String(64), index=True)
    symbol: Mapped[str | None] = mapped_column(String(64))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    payload_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)


@event.listens_for(LedgerEvent, "before_update")
@event.listens_for(LedgerEvent, "before_delete")
def _prevent_ledger_mutation(*_args: object, **_kwargs: object) -> None:
    raise ValueError("LedgerEvent is append-only")
