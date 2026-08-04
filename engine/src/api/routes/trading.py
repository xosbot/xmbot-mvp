from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...core.engine import Engine
from ...core.types import Signal, SignalAction

router = APIRouter(prefix="/api/trading", tags=["trading"])

_engine: Engine | None = None


def init_trading_api(engine: Engine) -> None:
    global _engine
    _engine = engine


def get_engine() -> Engine:
    if not _engine:
        raise HTTPException(status_code=503, detail="Engine not ready")
    return _engine


class TradeSignalRequest(BaseModel):
    symbol: str = "PAXGUSDT"
    action: str  # BUY or SELL
    entry_price: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    volume: float | None = None
    reason: str = "manual"


class EngineControlRequest(BaseModel):
    action: str  # start, stop, restart, pause, resume


class RiskConfigRequest(BaseModel):
    max_daily_loss: float | None = None
    max_positions: int | None = None
    max_drawdown_percent: float | None = None


@router.get("/status")
async def trading_status(engine: Engine = Depends(get_engine)):
    connected = await engine.broker.is_connected()
    positions = await engine.broker.get_positions()
    account = await engine.broker.get_account()

    return {
        "engine": "running" if engine.running else "stopped",
        "paused": engine.paused,
        "broker": engine.config.default_broker,
        "broker_connected": connected,
        "agents": list(engine.agents.keys()),
        "pending_signals": engine.gate.pending_count,
        "open_positions": len(positions),
        "account_balance": account.balance if account else 0,
        "account_equity": account.equity if account else 0,
    }


@router.post("/signal")
async def submit_signal(req: TradeSignalRequest, engine: Engine = Depends(get_engine)):
    action = SignalAction(req.action.upper())
    entry = req.entry_price or 0
    sl = req.stop_loss or 0

    if action == SignalAction.BUY and entry > 0 and sl > 0:
        sl = entry - abs(entry - sl)
    elif action == SignalAction.SELL and entry > 0 and sl > 0:
        sl = entry + abs(entry - sl)

    signal = Signal(
        id="",
        action=action,
        market=req.symbol,
        entry_price=entry,
        stop_loss=sl,
        take_profit=req.take_profit,
        confidence=0.8,
        reason=req.reason,
        agent="manual",
        user_id="default",
    )

    await engine.signal_bus.emit_signal(signal)
    return {"status": "submitted", "signal_id": signal.id}


@router.post("/control")
async def control_engine(req: EngineControlRequest, engine: Engine = Depends(get_engine)):
    if req.action == "start":
        await engine.start()
        return {"status": "started"}
    elif req.action == "stop":
        await engine.stop()
        return {"status": "stopped"}
    elif req.action == "restart":
        await engine.restart()
        return {"status": "restarted"}
    elif req.action == "pause":
        engine.pause()
        return {"status": "paused"}
    elif req.action == "resume":
        engine.resume()
        return {"status": "resumed"}
    raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")


@router.get("/positions")
async def get_positions(engine: Engine = Depends(get_engine)):
    positions = await engine.broker.get_positions()
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
        for p in positions
    ]


@router.get("/account")
async def get_account(engine: Engine = Depends(get_engine)):
    account = await engine.broker.get_account()
    if not account:
        raise HTTPException(status_code=503, detail="Account not available")
    return {
        "balance": account.balance,
        "equity": account.equity,
        "margin": account.margin,
        "margin_free": account.margin_free,
        "currency": account.currency,
    }


@router.get("/risk")
async def get_risk_stats(engine: Engine = Depends(get_engine)):
    user_id = "default"
    return engine.risk.get_daily_stats(user_id)


@router.post("/risk")
async def update_risk_config(req: RiskConfigRequest, engine: Engine = Depends(get_engine)):
    engine.risk.update_global_limits(
        max_daily_loss=req.max_daily_loss,
        max_positions=req.max_positions,
    )
    return {"status": "updated"}
