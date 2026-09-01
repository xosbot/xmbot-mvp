from __future__ import annotations

import asyncio

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.broker.paper import PaperBroker
from src.core.types import OrderResult, Signal, SignalAction
from src.db import Base
from src.db.financial_models import (
    BrokerAccount,
    BrokerOrder,
    Execution,
    LedgerEvent,
    OrderIntent,
    OrderIntentStatus,
)
from src.execution.client_order_id import generate_client_order_id
from src.execution.exceptions import (
    BrokerAccountMismatchError,
    BrokerOrderRejectedError,
    BrokerSubmissionUnknownError,
    FinancialStateUncertainError,
    InvalidOrderStateTransition,
)
from src.execution.repository import ExecutionRepository
from src.execution.service import ExecutionService
from src.execution.state_machine import validate_transition


@pytest.fixture
def session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture
def signal() -> Signal:
    return Signal(
        id="signal-durable-1",
        action=SignalAction.BUY,
        market="XAUUSD",
        entry_price=2650.0,
        stop_loss=2640.0,
        take_profit=2670.0,
        confidence=0.8,
        agent="momentum",
        user_id="user-1",
    )


def test_client_order_id_is_stable_safe_and_broker_bounded() -> None:
    first = generate_client_order_id("user@example.com", "signal/1", "buy", "mt5")
    second = generate_client_order_id("user@example.com", "signal/1", "buy", "mt5")
    different = generate_client_order_id("user@example.com", "signal/2", "buy", "mt5")

    assert first == second
    assert first != different
    assert len(first) <= 31
    assert "user@example.com" not in first


def test_state_machine_rejects_terminal_reentry() -> None:
    validate_transition(OrderIntentStatus.CREATED, OrderIntentStatus.SUBMITTING)
    with pytest.raises(InvalidOrderStateTransition):
        validate_transition(OrderIntentStatus.FILLED, OrderIntentStatus.SUBMITTING)
    with pytest.raises(InvalidOrderStateTransition):
        validate_transition(OrderIntentStatus.REJECTED, OrderIntentStatus.FILLED)


@pytest.mark.asyncio
async def test_order_intent_is_durable_before_broker_call(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class InspectingBroker(PaperBroker):
        observed_intent = False

        async def place_order(self, order):
            with session_factory() as session:
                self.observed_intent = session.scalar(
                    select(func.count()).select_from(OrderIntent)
                ) == 1
            return await super().place_order(order)

    broker = InspectingBroker()
    service = ExecutionService(broker, ExecutionRepository(session_factory))
    outcome = await service.execute(signal, volume=0.1)

    assert broker.observed_intent
    assert outcome.status == OrderIntentStatus.FILLED


@pytest.mark.asyncio
async def test_database_failure_prevents_broker_submission(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class FailingRepository(ExecutionRepository):
        def prepare_intent(self, **kwargs):
            raise OSError("database unavailable")

    class CountingBroker(PaperBroker):
        calls = 0

        async def place_order(self, order):
            self.calls += 1
            return await super().place_order(order)

    broker = CountingBroker()
    service = ExecutionService(broker, FailingRepository(session_factory))
    with pytest.raises(OSError, match="database unavailable"):
        await service.execute(signal, volume=0.1)
    assert broker.calls == 0


@pytest.mark.asyncio
async def test_cross_user_broker_account_fails_before_submission(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    with session_factory.begin() as session:
        session.add(
            BrokerAccount(
                id="other-account",
                user_id="other-user",
                broker="paper",
                external_account_id="other-external",
            )
        )
    broker = PaperBroker()
    service = ExecutionService(broker, ExecutionRepository(session_factory))

    with pytest.raises(BrokerAccountMismatchError):
        await service.execute(signal, volume=0.1, broker_account_id="other-account")

    assert broker._orders == []


@pytest.mark.asyncio
async def test_duplicate_and_concurrent_requests_place_one_order(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class CountingBroker(PaperBroker):
        calls = 0

        async def place_order(self, order):
            self.calls += 1
            await asyncio.sleep(0)
            return await super().place_order(order)

    broker = CountingBroker()
    service = ExecutionService(broker, ExecutionRepository(session_factory))
    first, second = await asyncio.gather(
        service.execute(signal, volume=0.1),
        service.execute(signal, volume=0.1),
    )
    third = await service.execute(signal, volume=0.1)

    assert broker.calls == 1
    assert {first.broker_order_id, second.broker_order_id, third.broker_order_id} == {
        first.broker_order_id
    }
    with session_factory() as session:
        assert session.scalar(select(func.count()).select_from(OrderIntent)) == 1
        assert session.scalar(select(func.count()).select_from(BrokerOrder)) == 1
        assert session.scalar(select(func.count()).select_from(Execution)) == 1


@pytest.mark.asyncio
async def test_timeout_after_acceptance_recovers_without_resubmit(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class LostResponseBroker(PaperBroker):
        calls = 0

        async def place_order(self, order):
            self.calls += 1
            await super().place_order(order)
            raise TimeoutError("response lost")

    broker = LostResponseBroker()
    outcome = await ExecutionService(broker, ExecutionRepository(session_factory)).execute(
        signal, volume=0.1
    )

    assert broker.calls == 1
    assert outcome.status == OrderIntentStatus.FILLED
    assert outcome.duplicate_prevented


@pytest.mark.asyncio
async def test_timeout_without_broker_record_remains_unknown(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class UnknownBroker(PaperBroker):
        async def place_order(self, order):
            raise TimeoutError("no response")

    service = ExecutionService(UnknownBroker(), ExecutionRepository(session_factory))
    with pytest.raises(BrokerSubmissionUnknownError):
        await service.execute(signal, volume=0.1)

    with session_factory() as session:
        intent = session.scalar(select(OrderIntent))
        assert intent.status == OrderIntentStatus.SUBMISSION_UNKNOWN
        assert session.scalar(
            select(func.count()).select_from(LedgerEvent).where(
                LedgerEvent.event_type == "ORDER_SUBMISSION_UNKNOWN"
            )
        ) == 1


@pytest.mark.asyncio
async def test_rejection_is_durable(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class RejectingBroker(PaperBroker):
        async def place_order(self, order):
            return OrderResult(success=False, order_id=order.id, error="market closed")

    service = ExecutionService(RejectingBroker(), ExecutionRepository(session_factory))
    with pytest.raises(BrokerOrderRejectedError):
        await service.execute(signal, volume=0.1)

    with session_factory() as session:
        assert session.scalar(select(OrderIntent.status)) == OrderIntentStatus.REJECTED
        assert session.scalar(
            select(func.count()).select_from(LedgerEvent).where(
                LedgerEvent.event_type == "ORDER_REJECTED"
            )
        ) == 1


@pytest.mark.asyncio
async def test_unapproved_live_adapter_fails_before_broker_submission(
    session_factory: sessionmaker[Session], signal: Signal
) -> None:
    class UnsafeBroker(PaperBroker):
        calls = 0

        @property
        def supports_idempotent_execution(self) -> bool:
            return False

        async def place_order(self, order):
            self.calls += 1
            return await super().place_order(order)

    broker = UnsafeBroker()
    service = ExecutionService(broker, ExecutionRepository(session_factory))
    with pytest.raises(FinancialStateUncertainError):
        await service.execute(signal, volume=0.1)
    assert broker.calls == 0
