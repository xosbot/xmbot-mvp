from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel

from ..user_auth import verified_user_id

router = APIRouter(prefix="/api/sync", tags=["sync"])

USER_STORES: dict[str, dict] = {}

_persistence = None


def init_persistence(persistence) -> None:
    global _persistence
    _persistence = persistence
    data = persistence.load()
    if not data:
        return
    if "trades" in data or "metrics" in data:
        # Pre-multi-tenant on-disk format: a single flat store, not keyed by user_id.
        # Migrate it under the default user rather than dropping it.
        USER_STORES[_default_user_id] = data
    else:
        USER_STORES.update(data)


def get_user_id(request: Request) -> str:
    state_user_id = getattr(request.state, "user_id", None)
    if state_user_id:
        return state_user_id
    from ..server import _api_key

    return verified_user_id(request, _api_key)


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
        await _persistence.save(USER_STORES)
    return {"status": "ok"}


class LiveStatsOut(BaseModel):
    active_traders: int
    signals_generated: int
    approval_rate: float


@router.get("/live-stats", response_model=LiveStatsOut)
async def get_live_stats():
    total_traders = 0
    total_signals = 0
    total_approved = 0
    total_decisions = 0

    for uid, store in USER_STORES.items():
        trades = store.get("trades", [])
        if not trades:
            continue
        total_traders += 1
        total_signals += len(trades)
        for t in trades:
            status = t.get("status", "")
            if status == "CLOSED":
                total_approved += 1
                total_decisions += 1
            elif status == "OPEN":
                total_approved += 1
                total_decisions += 1
            elif status in ("REJECTED", "TIMEOUT"):
                total_decisions += 1

    approval_rate = (total_approved / total_decisions * 100) if total_decisions > 0 else 0.0

    return LiveStatsOut(
        active_traders=total_traders,
        signals_generated=total_signals,
        approval_rate=round(approval_rate, 1),
    )
