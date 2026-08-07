from __future__ import annotations

from datetime import UTC, datetime
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/sync", tags=["sync"])

USER_STORES: dict[str, dict] = {}

_persistence = None


def init_persistence(persistence) -> None:
    global _persistence
    _persistence = persistence


def get_user_id(request: Request) -> str:
    user_id = request.headers.get("X-User-Id", "")
    return user_id if user_id else "anonymous"


def get_user_store(request: Request):
    user_id = get_user_id(request)
    if user_id not in USER_STORES:
        USER_STORES[user_id] = {
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
    return USER_STORES[user_id]


_default_user_id = "default"


def get_store() -> dict:
    """Legacy compatibility function for engine._sync_loop.
    Returns the default user's store - updates to USER_STORES are now user-scoped.
    """
    if _default_user_id not in USER_STORES:
        USER_STORES[_default_user_id] = {
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
    return USER_STORES[_default_user_id]


class TradeOut(BaseModel):
    id: str
    user_id: str = ""
    symbol: str
    action: str
    open_price: float
    close_price: float | None = None
    lot_size: float
    profit: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    open_time: str
    close_time: str | None = None
    status: str
    broker_trade_id: str | None = None


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
    last_sync: str | None = None


@router.get("/trades", response_model=list[TradeOut])
async def get_trades(
    request: Request,
    since: str | None = Query(None, description="ISO timestamp"),
    limit: int = Query(50, le=200),
    store: dict = Depends(get_user_store),
):
    user_id = get_user_id(request)
    trades = USER_STORES.get(user_id, {}).get("trades", [])
    if since:
        datetime.fromisoformat(since)
        trades = [t for t in trades if t.get("open_time", "") >= since]
    return trades[:limit]


@router.get("/metrics", response_model=MetricsOut)
async def get_metrics(request: Request, store: dict = Depends(get_user_store)):
    user_id = get_user_id(request)
    return USER_STORES.get(user_id, {}).get("metrics", {})


@router.get("/status", response_model=StatusOut)
async def get_status(request: Request, store: dict = Depends(get_user_store)):
    from ..server import engine_ref
    user_id = get_user_id(request)

    if engine_ref:
        connected = await engine_ref.broker.is_connected()
        return StatusOut(
            engine="running",
            broker=engine_ref.config.default_broker,
            broker_connected=connected,
            agents=list(engine_ref.agents.keys()),
            pending_signals=engine_ref.gate.pending_count,
            uptime_hours=0.0,
            last_sync=USER_STORES.get(user_id, {}).get("last_sync"),
        )

    return StatusOut(
        engine="starting",
        broker="unknown",
        broker_connected=False,
        agents=[],
        pending_signals=0,
        uptime_hours=0.0,
    )


@router.post("/update")
async def update_store(request: Request, data: dict, store: dict = Depends(get_user_store)):
    user_id = get_user_id(request)
    if user_id not in USER_STORES:
        USER_STORES[user_id] = {"trades": [], "metrics": {}, "last_sync": None}
    
    if "trades" in data:
        USER_STORES[user_id].setdefault("trades", [])
        USER_STORES[user_id]["trades"].extend(data["trades"])
    if "metrics" in data:
        USER_STORES[user_id].setdefault("metrics", {})
        USER_STORES[user_id]["metrics"].update(data["metrics"])
    USER_STORES[user_id]["last_sync"] = datetime.now(UTC).isoformat()
    
    if _persistence:
        await _persistence.save(USER_STORES[user_id])
    return {"status": "ok"}
