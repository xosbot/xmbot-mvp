import os
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session, sessionmaker

from src.core.types import Signal, SignalAction
from src.db.financial_models import LedgerEvent, OrderIntent, OrderIntentStatus
from src.execution.client_order_id import generate_client_order_id
from src.execution.repository import ExecutionRepository

POSTGRES_TEST_URL = os.getenv("POSTGRES_TEST_URL")
pytestmark = pytest.mark.skipif(not POSTGRES_TEST_URL, reason="POSTGRES_TEST_URL is not configured")


@pytest.fixture
def postgres_sessions() -> sessionmaker[Session]:
    engine = create_engine(POSTGRES_TEST_URL, pool_pre_ping=True)
    return sessionmaker(bind=engine, expire_on_commit=False)


def test_postgres_intent_claim_is_atomic(postgres_sessions: sessionmaker[Session]) -> None:
    signal = Signal(
        id="postgres-race-signal",
        action=SignalAction.BUY,
        market="XAUUSD",
        entry_price=2650,
        stop_loss=2640,
        user_id="postgres-user",
        agent="test",
    )
    repository = ExecutionRepository(postgres_sessions)
    client_order_id = generate_client_order_id(
        signal.user_id, signal.id, signal.action.value, "paper"
    )
    intent = repository.prepare_intent(
        signal=signal,
        client_order_id=client_order_id,
        broker="paper",
        volume=Decimal("0.1"),
        risk_amount=Decimal("1"),
        risk_percent=Decimal("0.1"),
        correlation_id="postgres-race-correlation",
        approval_required=False,
    )

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(repository.claim_for_submission, [intent.id, intent.id]))

    assert sorted(results) == [False, True]
    with postgres_sessions() as session:
        assert session.scalar(select(OrderIntent.status).where(OrderIntent.id == intent.id)) == (
            OrderIntentStatus.SUBMITTING
        )


def test_postgres_ledger_trigger_rejects_mutation(postgres_sessions: sessionmaker[Session]) -> None:
    with postgres_sessions.begin() as session:
        event = LedgerEvent(
            event_type="POSTGRES_TRIGGER_TEST",
            user_id="postgres-user",
            payload_json={},
            correlation_id="postgres-trigger-correlation",
        )
        session.add(event)
        session.flush()
        event_id = event.id

    with pytest.raises(DBAPIError):
        with postgres_sessions.begin() as session:
            session.execute(
                text("UPDATE ledger_events SET event_type='MUTATED' WHERE id=:id"),
                {"id": event_id},
            )
