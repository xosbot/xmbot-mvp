"""Strategy management API routes."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ...strategies.base import StrategyConfig, StrategyType
from ...strategies.registry import StrategyRegistry

log = logging.getLogger("xmbot.api.strategies")

router = APIRouter(prefix="/api/strategies", tags=["strategies"])

_registry: StrategyRegistry | None = None


def init_strategies_api(registry: StrategyRegistry) -> None:
    global _registry
    _registry = registry


def get_registry() -> StrategyRegistry:
    if not _registry:
        raise HTTPException(status_code=503, detail="Strategy registry not initialized")
    return _registry


class StrategyCreate(BaseModel):
    name: str
    strategy_type: str  # scalping, swing, mean_reversion, momentum
    symbols: list[str] = ["XAUUSD"]
    timeframe: str = "M5"
    max_positions: int = 3
    risk_per_trade_pct: float = 2.0
    max_daily_trades: int = 10
    params: dict = {}


class StrategyUpdate(BaseModel):
    enabled: bool | None = None
    symbols: list[str] | None = None
    timeframe: str | None = None
    max_positions: int | None = None
    risk_per_trade_pct: float | None = None
    max_daily_trades: int | None = None
    params: dict | None = None


class StrategyAction(BaseModel):
    action: str  # start, stop, pause, resume


@router.get("/")
async def list_strategies(registry: StrategyRegistry = Depends(get_registry)):
    """List all registered strategies."""
    return registry.list_strategies()


@router.get("/types")
async def list_strategy_types():
    """List available strategy types."""
    return {
        "types": [
            {"name": "scalping", "description": "Quick trades on small price movements"},
            {"name": "swing", "description": "Medium-term trend following"},
            {"name": "mean_reversion", "description": "Trading price reversions to mean"},
            {"name": "momentum", "description": "Trading with strong trend direction"},
        ]
    }


@router.get("/stats")
async def get_strategy_stats(registry: StrategyRegistry = Depends(get_registry)):
    """Get aggregate strategy statistics."""
    return registry.get_stats()


@router.get("/{name}")
async def get_strategy(name: str, registry: StrategyRegistry = Depends(get_registry)):
    """Get a specific strategy by name."""
    strategy = registry.get(name)
    if not strategy:
        raise HTTPException(status_code=404, detail=f"Strategy not found: {name}")
    return strategy.get_state()


@router.post("/")
async def create_strategy(req: StrategyCreate, registry: StrategyRegistry = Depends(get_registry)):
    """Create a new strategy."""
    try:
        config = StrategyConfig(
            name=req.name,
            strategy_type=StrategyType(req.strategy_type),
            symbols=req.symbols,
            timeframe=req.timeframe,
            max_positions=req.max_positions,
            risk_per_trade_pct=req.risk_per_trade_pct,
            max_daily_trades=req.max_daily_trades,
            params=req.params,
        )
        strategy = registry.create(config, req.strategy_type)
        return strategy.get_state()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{name}")
async def update_strategy(name: str, req: StrategyUpdate,
                          registry: StrategyRegistry = Depends(get_registry)):
    """Update a strategy's configuration."""
    strategy = registry.get(name)
    if not strategy:
        raise HTTPException(status_code=404, detail=f"Strategy not found: {name}")

    if req.enabled is not None:
        strategy.config.enabled = req.enabled
    if req.symbols is not None:
        strategy.config.symbols = req.symbols
    if req.timeframe is not None:
        strategy.config.timeframe = req.timeframe
    if req.max_positions is not None:
        strategy.config.max_positions = req.max_positions
    if req.risk_per_trade_pct is not None:
        strategy.config.risk_per_trade_pct = req.risk_per_trade_pct
    if req.max_daily_trades is not None:
        strategy.config.max_daily_trades = req.max_daily_trades
    if req.params is not None:
        strategy.config.params.update(req.params)

    return strategy.get_state()


@router.delete("/{name}")
async def delete_strategy(name: str, registry: StrategyRegistry = Depends(get_registry)):
    """Delete a strategy."""
    try:
        registry.unregister(name)
        return {"status": "deleted", "name": name}
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{name}/control")
async def control_strategy(name: str, req: StrategyAction,
                           registry: StrategyRegistry = Depends(get_registry)):
    """Control a strategy (start, stop, pause, resume)."""
    try:
        if req.action == "start":
            await registry.start(name)
        elif req.action == "stop":
            await registry.stop(name)
        elif req.action == "pause":
            await registry.pause(name)
        elif req.action == "resume":
            await registry.resume(name)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

        strategy = registry.get(name)
        return {"status": req.action, "strategy": strategy.get_state() if strategy else None}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/control/all")
async def control_all_strategies(req: StrategyAction,
                                 registry: StrategyRegistry = Depends(get_registry)):
    """Control all strategies (start, stop)."""
    try:
        if req.action == "start":
            count = await registry.start_all()
            return {"status": "started", "count": count}
        elif req.action == "stop":
            count = await registry.stop_all()
            return {"status": "stopped", "count": count}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
