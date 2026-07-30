from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel


router = APIRouter(prefix="/api/sync", tags=["sync"])

# In-memory store backed by file persistence
_sync_store: dict = {
    "trades": [],
    "metrics": {
        "total_trades": 0,
        "winning_trades": 0,
        "win_rate": 0.0,
        "total_pnl": 0.0,
        "open_trades": 0,
        "account_balance": 10000.0,
        "account_equity": 10000.0,
    },
    "last_sync": None,
}

_persistence = None


def init_persistence(persistence) -> None:
    global _persistence
    _persistence = persistence
    data = persistence.load()
    if data:
        _sync_store.update(data)


def get_store():
    return _sync_store


class TradeOut(BaseModel):
    id: str
    symbol: str
    action: str
    open_price: float
    close_price: Optional[float] = None
    lot_size: float
    profit: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    open_time: str
    close_time: Optional[str] = None
    status: str
    broker_trade_id: Optional[str] = None


class MetricsOut(BaseModel):
    total_trades: int
    winning_trades: int
    win_rate: float
    total_pnl: float
    open_trades: int
    account_balance: float
    account_equity: float


class StatusOut(BaseModel):
    engine: str
    broker: str
    broker_connected: bool
    agents: list[str]
    pending_signals: int
    uptime_hours: float
    last_sync: Optional[str] = None


@router.get("/trades", response_model=list[TradeOut])
async def get_trades(
    since: Optional[str] = Query(None, description="ISO timestamp"),
    limit: int = Query(50, le=200),
    store: dict = Depends(get_store),
):
    trades = store.get("trades", [])
    if since:
        since_dt = datetime.fromisoformat(since)
        trades = [t for t in trades if t.get("open_time", "") >= since]
    return trades[:limit]


@router.get("/metrics", response_model=MetricsOut)
async def get_metrics(store: dict = Depends(get_store)):
    return store.get("metrics", {})


@router.get("/status", response_model=StatusOut)
async def get_status(store: dict = Depends(get_store)):
    from ..server import engine_ref

    if engine_ref:
        connected = await engine_ref.broker.is_connected()
        return StatusOut(
            engine="running",
            broker=engine_ref.config.default_broker,
            broker_connected=connected,
            agents=list(engine_ref.agents.keys()),
            pending_signals=engine_ref.gate.pending_count,
            uptime_hours=0.0,
            last_sync=store.get("last_sync"),
        )

    return StatusOut(
        engine="starting",
        broker="unknown",
        broker_connected=False,
        agents=[],
        pending_signals=0,
        uptime_hours=0.0,
    )


def apply_updates(data: dict, store: dict | None = None) -> None:
    """Apply trade/metric updates to the store dict."""
    if store is None:
        store = _sync_store
    if "trades" in data:
        store["trades"] = data["trades"]
    if "metrics" in data:
        store["metrics"].update(data["metrics"])
    store["last_sync"] = datetime.utcnow().isoformat()


@router.post("/update")
async def update_store(data: dict, store: dict = Depends(get_store)):
    """Internal endpoint for the engine to push trade data."""
    apply_updates(data, store)
    if _persistence:
        await _persistence.save(store)
    return {"status": "ok"}
