from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.broker.paper import PaperBroker
from src.core.types import Position, SignalAction
from src.db import Base
from src.db.financial_models import BrokerAccount, FinancialPosition, LedgerEvent, PositionStatus
from src.reconciliation.models import ReconciliationHealth
from src.reconciliation.service import ReconciliationService


@pytest.fixture
def sessions() -> sessionmaker[Session]:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


def add_account(sessions: sessionmaker[Session]) -> None:
    with sessions.begin() as session:
        session.add(
            BrokerAccount(
                id="account-1",
                user_id="user-1",
                broker="paper",
                external_account_id="paper-user-1",
            )
        )


@pytest.mark.asyncio
async def test_unknown_manual_position_marks_account_unsafe_and_is_audited(
    sessions: sessionmaker[Session],
) -> None:
    add_account(sessions)
    broker = PaperBroker()
    await broker.connect()
    broker._positions.append(
        Position(
            id="manual-position",
            broker_position_id="manual-position",
            symbol="XAUUSD",
            direction=SignalAction.BUY,
            volume=0.1,
            entry_price=2650,
            current_price=2651,
            stop_loss=2640,
        )
    )
    service = ReconciliationService(broker, sessions)

    health = await service.reconcile_account("account-1", "user-1")

    assert health == ReconciliationHealth.UNSAFE
    with sessions() as session:
        payloads = list(
            session.scalars(
                select(LedgerEvent.payload_json).where(
                    LedgerEvent.event_type == "BROKER_RECONCILIATION_MISMATCH"
                )
            )
        )
    assert any(payload["type"] == "UNKNOWN_BROKER_POSITION" for payload in payloads)


@pytest.mark.asyncio
async def test_disappeared_position_is_not_closed_or_given_guessed_pnl(
    sessions: sessionmaker[Session],
) -> None:
    add_account(sessions)
    with sessions.begin() as session:
        session.add(
            FinancialPosition(
                id="position-1",
                user_id="user-1",
                broker_account_id="account-1",
                symbol="XAUUSD",
                side="BUY",
                quantity=Decimal("0.1"),
                current_quantity=Decimal("0.1"),
                average_entry_price=Decimal("2650"),
                stop_loss=Decimal("2640"),
                broker_position_id="mt5-301",
                status=PositionStatus.OPEN,
                opened_at=datetime.now(UTC),
            )
        )
    broker = PaperBroker()
    await broker.connect()
    pnl_calls: list[float] = []

    async def record_pnl(_user_id: str, pnl: float) -> None:
        pnl_calls.append(pnl)

    service = ReconciliationService(broker, sessions, pnl_callback=record_pnl)
    health = await service.reconcile_account("account-1", "user-1")

    assert health == ReconciliationHealth.UNSAFE
    assert pnl_calls == []
    with sessions() as session:
        position = session.get(FinancialPosition, "position-1")
        assert position.status == PositionStatus.RECONCILIATION_REQUIRED
        assert position.realized_pnl is None
        assert session.scalar(
            select(func.count()).select_from(LedgerEvent).where(
                LedgerEvent.event_type == "BROKER_RECONCILIATION_MISMATCH"
            )
        ) >= 1
