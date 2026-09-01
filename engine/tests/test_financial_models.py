from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db import Base
from src.db.financial_models import (
    BrokerAccount,
    BrokerOrder,
    Execution,
    LedgerEvent,
    OrderIntent,
    TradingSignal,
)


@pytest.fixture
def session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        yield db


def make_signal() -> TradingSignal:
    return TradingSignal(
        id="signal-1",
        user_id="user-1",
        strategy_id="momentum-v1",
        agent_name="technical",
        symbol="XAUUSD",
        market="XAUUSD",
        timeframe="M5",
        side="BUY",
        entry_price=Decimal("3428.40000000"),
        stop_loss=Decimal("3417.20000000"),
        take_profit=Decimal("3450.80000000"),
        confidence=Decimal("0.780000"),
        correlation_id="correlation-1",
    )


def make_account() -> BrokerAccount:
    return BrokerAccount(
        id="account-1",
        user_id="user-1",
        broker="mt5",
        external_account_id="demo-10001",
    )


def make_intent() -> OrderIntent:
    return OrderIntent(
        id="intent-1",
        client_order_id="XMB-user1-signal1-entry",
        user_id="user-1",
        signal_id="signal-1",
        broker_account_id="account-1",
        strategy_id="momentum-v1",
        symbol="XAUUSD",
        side="BUY",
        order_type="MARKET",
        requested_quantity=Decimal("0.1000000000"),
        requested_price=Decimal("3428.40000000"),
        stop_loss=Decimal("3417.20000000"),
        take_profit=Decimal("3450.80000000"),
        risk_amount=Decimal("112.00000000"),
        risk_percent=Decimal("0.750000"),
        correlation_id="correlation-1",
    )


def test_financial_lifecycle_persists_decimal_values(session: Session) -> None:
    session.add_all([make_signal(), make_account(), make_intent()])
    broker_order = BrokerOrder(
        id="broker-order-1",
        order_intent_id="intent-1",
        broker="mt5",
        broker_order_id="98765",
        client_order_id="XMB-user1-signal1-entry",
        symbol="XAUUSD",
        side="BUY",
        order_type="MARKET",
        status="PARTIALLY_FILLED",
        requested_quantity=Decimal("0.1000000000"),
        filled_quantity=Decimal("0.0400000000"),
        average_fill_price=Decimal("3428.41000000"),
        raw_response={"retcode": 10009},
    )
    execution = Execution(
        broker_order_id="broker-order-1",
        broker_execution_id="deal-1",
        broker_trade_id="trade-1",
        user_id="user-1",
        symbol="XAUUSD",
        side="BUY",
        quantity=Decimal("0.0400000000"),
        price=Decimal("3428.41000000"),
        commission=Decimal("0.40000000"),
        fee=Decimal("0.10000000"),
        execution_time=datetime.now(UTC),
        raw_response={"deal": "deal-1"},
    )
    session.add_all([broker_order, execution])
    session.commit()

    stored = session.query(Execution).one()
    assert stored.quantity == Decimal("0.0400000000")
    assert stored.price == Decimal("3428.41000000")
    assert stored.commission + stored.fee == Decimal("0.50000000")


def test_client_order_id_is_globally_unique(session: Session) -> None:
    session.add_all([make_signal(), make_account(), make_intent()])
    session.commit()

    duplicate = make_intent()
    duplicate.id = "intent-2"
    session.add(duplicate)
    with pytest.raises(IntegrityError):
        session.commit()


def test_broker_execution_is_unique_per_broker_order(session: Session) -> None:
    session.add_all([make_signal(), make_account(), make_intent()])
    session.add(
        BrokerOrder(
            id="broker-order-1",
            order_intent_id="intent-1",
            broker="mt5",
            broker_order_id="98765",
            client_order_id="XMB-user1-signal1-entry",
            symbol="XAUUSD",
            side="BUY",
            order_type="MARKET",
            status="FILLED",
            requested_quantity=Decimal("0.1000000000"),
        )
    )
    for execution_id in ("execution-1", "execution-2"):
        session.add(
            Execution(
                id=execution_id,
                broker_order_id="broker-order-1",
                broker_execution_id="same-deal",
                user_id="user-1",
                symbol="XAUUSD",
                side="BUY",
                quantity=Decimal("0.0500000000"),
                price=Decimal("3428.41000000"),
                execution_time=datetime.now(UTC),
            )
        )

    with pytest.raises(IntegrityError):
        session.commit()


def test_ledger_event_cannot_be_updated_or_deleted(session: Session) -> None:
    ledger_event = LedgerEvent(
        event_type="ORDER_INTENT_CREATED",
        user_id="user-1",
        order_intent_id="intent-1",
        symbol="XAUUSD",
        payload_json={"client_order_id": "XMB-user1-signal1-entry"},
        correlation_id="correlation-1",
    )
    session.add(ledger_event)
    session.commit()

    ledger_event.event_type = "ORDER_FILLED"
    with pytest.raises(ValueError, match="append-only"):
        session.commit()
    session.rollback()

    with pytest.raises(ValueError, match="append-only"):
        session.delete(ledger_event)
        session.commit()
