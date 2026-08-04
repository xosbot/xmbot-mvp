"""Trade history and order management API routes."""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ...core.types import Order, OrderStatus, SignalAction

log = logging.getLogger("xmbot.api.history")

router = APIRouter(prefix="/api/history", tags=["history"])

# In-memory trade history store (would be database-backed in production)
_trade_history: list[dict] = []
_order_history: list[dict] = []


class TradeOut(BaseModel):
    id: str
    symbol: str
    action: str
    entry_price: float
    exit_price: float | None = None
    volume: float
    pnl: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    status: str
    open_time: str
    close_time: str | None = None
    broker_trade_id: str | None = None
    notes: str = ""


class OrderOut(BaseModel):
    id: str
    signal_id: str
    action: str
    symbol: str
    volume: float
    price: float
    stop_loss: float
    take_profit: float | None = None
    status: str
    broker: str
    created_at: str
    filled_at: str | None = None
    filled_price: float | None = None
    broker_order_id: str | None = None
    error: str | None = None


def record_trade(trade: dict) -> None:
    """Record a trade to history (called by engine on trade execution)."""
    _trade_history.append(trade)
    # Keep only last 1000 trades in memory
    if len(_trade_history) > 1000:
        _trade_history.pop(0)


def record_order(order: dict) -> None:
    """Record an order to history."""
    _order_history.append(order)
    if len(_order_history) > 1000:
        _order_history.pop(0)


@router.get("/trades", response_model=list[TradeOut])
async def get_trade_history(
    symbol: str | None = Query(None, description="Filter by symbol"),
    action: str | None = Query(None, description="Filter by action (BUY/SELL)"),
    status: str | None = Query(None, description="Filter by status (OPEN/CLOSED)"),
    limit: int = Query(50, le=200, description="Max trades to return"),
    offset: int = Query(0, description="Pagination offset"),
):
    """Get trade history with optional filters."""
    trades = _trade_history.copy()

    if symbol:
        trades = [t for t in trades if t.get("symbol", "").upper() == symbol.upper()]
    if action:
        trades = [t for t in trades if t.get("action", "").upper() == action.upper()]
    if status:
        trades = [t for t in trades if t.get("status", "").upper() == status.upper()]

    # Sort by open_time descending (most recent first)
    trades.sort(key=lambda t: t.get("open_time", ""), reverse=True)

    return trades[offset:offset + limit]


@router.get("/trades/{trade_id}", response_model=TradeOut)
async def get_trade(trade_id: str):
    """Get a specific trade by ID."""
    for trade in _trade_history:
        if trade.get("id") == trade_id:
            return trade
    raise HTTPException(status_code=404, detail=f"Trade {trade_id} not found")


@router.get("/orders", response_model=list[OrderOut])
async def get_order_history(
    symbol: str | None = Query(None, description="Filter by symbol"),
    status: str | None = Query(None, description="Filter by status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """Get order history with optional filters."""
    orders = _order_history.copy()

    if symbol:
        orders = [o for o in orders if o.get("symbol", "").upper() == symbol.upper()]
    if status:
        orders = [o for o in orders if o.get("status", "").upper() == status.upper()]

    orders.sort(key=lambda o: o.get("created_at", ""), reverse=True)

    return orders[offset:offset + limit]


@router.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(order_id: str):
    """Get a specific order by ID."""
    for order in _order_history:
        if order.get("id") == order_id:
            return order
    raise HTTPException(status_code=404, detail=f"Order {order_id} not found")


@router.get("/stats")
async def get_trade_stats():
    """Get aggregated trade statistics."""
    if not _trade_history:
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0.0,
            "total_pnl": 0.0,
            "avg_pnl": 0.0,
            "best_trade": 0.0,
            "worst_trade": 0.0,
        }

    winning = [t for t in _trade_history if (t.get("pnl") or 0) > 0]
    losing = [t for t in _trade_history if (t.get("pnl") or 0) < 0]
    pnls = [t.get("pnl", 0) for t in _trade_history]

    return {
        "total_trades": len(_trade_history),
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "win_rate": len(winning) / len(_trade_history) * 100 if _trade_history else 0,
        "total_pnl": sum(pnls),
        "avg_pnl": sum(pnls) / len(pnls) if pnls else 0,
        "best_trade": max(pnls) if pnls else 0,
        "worst_trade": min(pnls) if pnls else 0,
    }
