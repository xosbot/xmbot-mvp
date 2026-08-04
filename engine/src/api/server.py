from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..core.engine import Engine
from ..core.types import Signal, SignalAction
from .routes.ai import router as ai_router
from .routes.config import router as config_router
from .routes.sync import router as sync_router
from .routes.trading import router as trading_router

log = logging.getLogger("xmbot.api")

app = FastAPI(title="XMBot Engine API", version="0.1.0")
app.include_router(sync_router)
app.include_router(config_router)
app.include_router(ai_router)
app.include_router(trading_router)

engine_ref: Engine | None = None
_api_key: str = ""


def init_api(engine: Engine) -> FastAPI:
    global engine_ref, _api_key
    engine_ref = engine
    _api_key = engine.config.api_key
    _add_auth_middleware()
    return app


def _add_auth_middleware() -> None:
    @app.middleware("http")
    async def auth_middleware(request: Request, call_next):
        if request.url.path in ("/health", "/docs", "/openapi.json"):
            return await call_next(request)
        if not _api_key:
            return JSONResponse(status_code=503, content={"detail": "Engine API key not configured"})
        key = request.headers.get("x-api-key", "")
        if key != _api_key:
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        return await call_next(request)


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


def get_engine() -> Engine:
    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")
    return engine_ref


@app.get("/health")
async def health():
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
async def get_positions():
    engine = get_engine()
    return await engine.broker.get_positions()


@app.get("/account")
async def get_account():
    engine = get_engine()
    return await engine.broker.get_account()


@app.post("/signal")
async def submit_signal(req: SignalRequest):
    engine = get_engine()

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
        user_id="default",
    )
    await engine.signal_bus.emit_signal(signal)
    return {"status": "submitted", "signal_id": signal.id}


@app.post("/control")
async def control(req: ControlRequest):
    engine = get_engine()

    if req.action == "start":
        await engine.start()
        return {"status": "started"}
    elif req.action == "stop":
        await engine.stop()
        return {"status": "stopped"}
    elif req.action == "status":
        return {
            "running": engine.running,
            "agents": len(engine.agents),
            "pending_signals": engine.gate.pending_count,
        }
    raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")
