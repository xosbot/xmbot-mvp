from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..core.engine import Engine
from ..core.types import Signal, SignalAction
from .middleware import RateLimitMiddleware, RequestTrackingMiddleware
from .routes.ai import router as ai_router
from .routes.ai_advanced import router as ai_advanced_router
from .routes.config import router as config_router
from .routes.history import router as history_router
from .routes.strategies import router as strategies_router
from .routes.sync import router as sync_router
from .routes.trading import router as trading_router
from .routes.websocket import router as ws_router
from .user_auth import verified_user_id

log = logging.getLogger("xmbot.api")

app = FastAPI(title="XMBot Engine API", version="0.3.0")

app.add_middleware(RequestTrackingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=60, window_seconds=60)

app.include_router(sync_router)
app.include_router(config_router)
app.include_router(ai_router)
app.include_router(ai_advanced_router)
app.include_router(trading_router)
app.include_router(history_router)
app.include_router(strategies_router)
app.include_router(ws_router)

engine_ref: Engine | None = None
_api_key: str = ""


def init_api(engine: Engine) -> FastAPI:
    global engine_ref, _api_key
    engine_ref = engine
    _api_key = engine.config.api_key

    from ..strategies.registry import StrategyRegistry, load_builtin_strategies
    from .routes.strategies import init_strategies_api

    registry = StrategyRegistry()
    load_builtin_strategies(registry)
    init_strategies_api(registry)

    _add_auth_middleware()
    return app


def get_request_user_id(request: Request) -> str:
    """User id for the current request, verified once by auth_middleware.

    Falls back to re-verifying here (e.g. websocket upgrades, or tests that
    call a route function directly without going through the middleware).
    """
    state_user_id = getattr(request.state, "user_id", None)
    if state_user_id:
        return state_user_id
    return verified_user_id(request, _api_key)


def _add_auth_middleware() -> None:
    @app.middleware("http")
    async def auth_middleware(request: Request, call_next):
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc", "/ws/status"):
            return await call_next(request)
        if request.headers.get("upgrade", "").lower() == "websocket":
            request.state.user_id = verified_user_id(request, _api_key)
            return await call_next(request)
        if not _api_key:
            return JSONResponse(status_code=503, content={"detail": "Engine API key not configured"})
        key = request.headers.get("x-api-key", "")
        if key != _api_key:
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        request.state.user_id = verified_user_id(request, _api_key)
        response = await call_next(request)
        return response


@app.get("/health")
async def health(request: Request):
    if not engine_ref:
        return {"status": "not_ready"}
    connected = await engine_ref.broker.is_connected()
    return {
        "status": "running" if connected else "degraded",
        "agents": list(engine_ref.agents.keys()),
        "broker": engine_ref.config.default_broker,
        "connected": connected,
    }


@app.get("/positions")
async def get_positions(request: Request):
    user_id = get_request_user_id(request)
    if not engine_ref:
        return []
    positions = await engine_ref.broker.get_positions()
    user_positions = [p for p in positions if p.user_id == user_id] if user_id != "anonymous" else positions
    return [
        {
            "id": p.id,
            "symbol": p.symbol,
            "direction": p.direction.value,
            "volume": p.volume,
            "entry_price": p.entry_price,
            "current_price": p.current_price,
            "stop_loss": p.stop_loss,
            "take_profit": p.take_profit,
            "unrealized_pnl": p.unrealized_pnl,
            "open_time": p.open_time.isoformat(),
        }
        for p in user_positions
    ]


@app.get("/account")
async def get_account(request: Request):
    user_id = get_request_user_id(request)
    if not engine_ref:
        return {"balance": 0, "equity": 0, "margin": 0, "margin_free": 0, "currency": "USD", "user_id": user_id}
    account = await engine_ref.broker.get_account()
    if not account:
        return {
            "balance": 0,
            "equity": 0,
            "margin": 0,
            "margin_free": 0,
            "currency": "USD",
            "user_id": user_id,
        }
    return {
        "balance": account.balance,
        "equity": account.equity,
        "margin": account.margin,
        "margin_free": account.margin_free,
        "currency": account.currency,
        "user_id": user_id,
    }


class SignalRequest(BaseModel):
    action: str
    market: str
    entry_price: float
    stop_loss: float
    take_profit: float | None = None
    confidence: float = 0.8
    reason: str = ""
    agent: str = "manual"


class ControlRequest(BaseModel):
    action: str


@app.post("/signal")
async def submit_signal(req: SignalRequest, request: Request):
    user_id = get_request_user_id(request)
    if not engine_ref:
        return {"status": "error", "detail": "Engine not ready"}
    signal = Signal(
        id="",
        action=SignalAction(req.action.upper()),
        market=req.market,
        entry_price=req.entry_price,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        confidence=req.confidence,
        reason=req.reason,
        agent=req.agent,
        user_id=user_id,
    )
    await engine_ref.signal_bus.emit_signal(signal)
    return {"status": "submitted", "signal_id": signal.id}


@app.post("/control")
async def control(req: ControlRequest):
    if not engine_ref:
        return {"status": "error", "detail": "Engine not ready"}

    if req.action == "start":
        await engine_ref.start()
        return {"status": "started"}
    elif req.action == "stop":
        await engine_ref.stop()
        return {"status": "stopped"}
    elif req.action == "status":
        return {
            "running": engine_ref.running,
            "agents": len(engine_ref.agents),
            "pending_signals": engine_ref.gate.pending_count,
        }
    from fastapi import HTTPException
    raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")


@app.get("/subscription-check")
async def subscription_check(request: Request):
    user_id = get_request_user_id(request)
    if not engine_ref:
        return {"active": False, "reason": "engine_not_ready"}
    user_config = engine_ref._user_configs.get(user_id)
    if not user_config:
        return {"active": False, "reason": "no_config"}
    if user_config.is_expired:
        return {"active": False, "reason": "expired", "expiry_date": user_config.expiry_date.isoformat() if user_config.expiry_date else None}
    return {"active": True, "expiry_date": user_config.expiry_date.isoformat() if user_config.expiry_date else None}
