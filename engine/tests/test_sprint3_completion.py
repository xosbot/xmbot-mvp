from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from src.core.persistence import Persistence
from src.db.financial_models import PositionStatus
from src.execution.position_reconstruction import reconstruct_position_from_deals
from src.reconciliation.models import (
    MismatchType,
    ReconciliationMismatch,
    ReconciliationSeverity,
)
from src.risk.engine import RiskEngine


@dataclass
class Deal:
    quantity: Decimal
    price: Decimal
    entry_type: str
    execution_time: datetime
    position_id: str | None = "pos-1"
    gross_profit: Decimal | None = None
    commission: Decimal = Decimal("0")
    swap: Decimal = Decimal("0")
    fee: Decimal = Decimal("0")
    realized_pnl: Decimal | None = None


def test_multi_deal_position_and_partial_closes_use_signed_broker_financials() -> None:
    start = datetime(2026, 9, 1, tzinfo=UTC)
    deals = [
        Deal(Decimal("0.40"), Decimal("3400"), "IN", start),
        Deal(Decimal("0.60"), Decimal("3410"), "IN", start + timedelta(seconds=1)),
        Deal(
            Decimal("0.25"), Decimal("3420"), "OUT", start + timedelta(seconds=2),
            gross_profit=Decimal("5"), commission=Decimal("-0.25"),
            swap=Decimal("-0.10"), fee=Decimal("-0.05"), realized_pnl=Decimal("4.60"),
        ),
        Deal(
            Decimal("0.50"), Decimal("3430"), "OUT", start + timedelta(seconds=3),
            gross_profit=Decimal("10"), commission=Decimal("-0.50"),
            realized_pnl=Decimal("9.50"),
        ),
    ]
    partial = reconstruct_position_from_deals(deals, position_id="pos-1")
    assert partial.entry_quantity == Decimal("1.00")
    assert partial.exit_quantity == Decimal("0.75")
    assert partial.remaining_quantity == Decimal("0.25")
    assert partial.average_entry_price == Decimal("3406")
    assert partial.status == PositionStatus.PARTIALLY_CLOSED
    assert partial.gross_realized_pnl == Decimal("15")
    assert partial.commission == Decimal("-0.75")
    assert partial.swap == Decimal("-0.10")
    assert partial.fees == Decimal("-0.05")
    assert partial.net_realized_pnl == Decimal("14.10")
    assert partial.closed_at is None

    deals.append(
        Deal(
            Decimal("0.25"), Decimal("3440"), "OUT", start + timedelta(seconds=4),
            gross_profit=Decimal("7"), commission=Decimal("-0.25"),
            realized_pnl=Decimal("6.75"),
        )
    )
    closed = reconstruct_position_from_deals(deals, position_id="pos-1")
    assert closed.remaining_quantity == 0
    assert closed.status == PositionStatus.CLOSED
    assert closed.closed_at == start + timedelta(seconds=4)
    assert closed.net_realized_pnl == Decimal("20.85")


@pytest.mark.parametrize("entry_type", ["INOUT", "UNKNOWN"])
def test_ambiguous_deal_semantics_fail_closed(entry_type: str) -> None:
    result = reconstruct_position_from_deals(
        [Deal(Decimal("1"), Decimal("1"), entry_type, datetime.now(UTC))],
        position_id="pos-1",
    )
    assert result.status == PositionStatus.RECONCILIATION_REQUIRED
    assert result.uncertainty_reason


def test_missing_position_identifier_fails_closed() -> None:
    deal = Deal(Decimal("1"), Decimal("1"), "IN", datetime.now(UTC), position_id=None)
    result = reconstruct_position_from_deals([deal], position_id="pos-1")
    assert result.status == PositionStatus.RECONCILIATION_REQUIRED


@pytest.mark.asyncio
async def test_risk_execution_is_counted_once_across_restart(tmp_path) -> None:
    persistence = Persistence(str(tmp_path), "risk.json")
    risk = RiskEngine(persistence=persistence)
    await risk.record_pnl_once("user-1", -12.5, "execution-1")
    await risk.record_pnl_once("user-1", -12.5, "execution-1")
    assert risk.get_daily_stats("user-1")["daily_pnl"] == -12.5

    restarted = RiskEngine(persistence=persistence)
    await restarted.record_pnl_once("user-1", -12.5, "execution-1")
    assert restarted.get_daily_stats("user-1")["daily_pnl"] == -12.5


def test_reconciliation_mismatch_id_is_stable() -> None:
    first = ReconciliationMismatch(
        type=MismatchType.UNKNOWN_BROKER_POSITION,
        severity=ReconciliationSeverity.CRITICAL,
        user_id="user-1",
        broker_account_id="account-1",
        broker_id="position-7",
        detected_at=datetime(2026, 1, 1, tzinfo=UTC),
    )
    later = ReconciliationMismatch(
        type=MismatchType.UNKNOWN_BROKER_POSITION,
        severity=ReconciliationSeverity.CRITICAL,
        user_id="user-1",
        broker_account_id="account-1",
        broker_id="position-7",
        detected_at=datetime(2026, 9, 1, tzinfo=UTC),
    )
    assert first.mismatch_id == later.mismatch_id
