from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Protocol

from ..db.financial_models import PositionStatus


class DealLike(Protocol):
    quantity: Decimal
    price: Decimal
    commission: Decimal
    fee: Decimal
    realized_pnl: Decimal | None
    gross_profit: Decimal | None
    swap: Decimal
    position_id: str | None
    entry_type: str | None
    execution_time: datetime


@dataclass(frozen=True)
class PositionReconstruction:
    entry_quantity: Decimal
    exit_quantity: Decimal
    remaining_quantity: Decimal
    average_entry_price: Decimal
    gross_realized_pnl: Decimal
    commission: Decimal
    swap: Decimal
    fees: Decimal
    net_realized_pnl: Decimal
    opened_at: datetime | None
    closed_at: datetime | None
    status: PositionStatus
    uncertainty_reason: str | None = None


def reconstruct_position_from_deals(
    deals: list[DealLike],
    *,
    position_id: str,
    broker_quantity: Decimal | None = None,
) -> PositionReconstruction:
    """Rebuild one MT5 position only from deals carrying its position identifier.

    MT5 costs are signed, so net P&L is the sum of broker profit, commission,
    swap and fee. INOUT and unknown entry semantics cannot be split safely
    without account-mode-specific data and therefore fail closed.
    """
    zero = Decimal("0")
    ordered = sorted(deals, key=lambda item: item.execution_time)
    if not ordered or any(item.position_id != position_id for item in ordered):
        return _uncertain("missing or ambiguous MT5 position identifier")
    if any((item.entry_type or "UNKNOWN") in {"INOUT", "UNKNOWN"} for item in ordered):
        return _uncertain("INOUT or unknown MT5 deal semantics")

    entries = [item for item in ordered if item.entry_type == "IN"]
    exits = [item for item in ordered if item.entry_type in {"OUT", "OUT_BY"}]
    entry_quantity = sum((item.quantity for item in entries), zero)
    exit_quantity = sum((item.quantity for item in exits), zero)
    if entry_quantity <= zero or exit_quantity > entry_quantity:
        return _uncertain("deal quantities do not describe a valid position")

    calculated_remaining = entry_quantity - exit_quantity
    if broker_quantity is not None and broker_quantity != calculated_remaining:
        return _uncertain("broker position quantity disagrees with deal history")

    average_entry_price = (
        sum((item.price * item.quantity for item in entries), zero) / entry_quantity
    )
    gross = sum(((item.gross_profit or zero) for item in exits), zero)
    commission = sum((item.commission for item in exits), zero)
    swap = sum((item.swap for item in exits), zero)
    fees = sum((item.fee for item in exits), zero)
    net = sum(
        (
            item.realized_pnl
            if item.realized_pnl is not None
            else (item.gross_profit or zero) + item.commission + item.swap + item.fee
            for item in exits
        ),
        zero,
    )
    if calculated_remaining == zero:
        status = PositionStatus.CLOSED
        closed_at = max((item.execution_time for item in exits), default=None)
    elif exits:
        status = PositionStatus.PARTIALLY_CLOSED
        closed_at = None
    else:
        status = PositionStatus.OPEN
        closed_at = None
    return PositionReconstruction(
        entry_quantity=entry_quantity,
        exit_quantity=exit_quantity,
        remaining_quantity=calculated_remaining,
        average_entry_price=average_entry_price,
        gross_realized_pnl=gross,
        commission=commission,
        swap=swap,
        fees=fees,
        net_realized_pnl=net,
        opened_at=min((item.execution_time for item in entries), default=None),
        closed_at=closed_at,
        status=status,
    )


def _uncertain(reason: str) -> PositionReconstruction:
    zero = Decimal("0")
    return PositionReconstruction(
        entry_quantity=zero,
        exit_quantity=zero,
        remaining_quantity=zero,
        average_entry_price=zero,
        gross_realized_pnl=zero,
        commission=zero,
        swap=zero,
        fees=zero,
        net_realized_pnl=zero,
        opened_at=None,
        closed_at=None,
        status=PositionStatus.RECONCILIATION_REQUIRED,
        uncertainty_reason=reason,
    )
