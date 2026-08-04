"""AI configuration and status API routes."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = logging.getLogger("xmbot.api.ai")

router = APIRouter(prefix="/api/ai", tags=["ai"])

# In-memory AI config store
_ai_config: dict = {
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "enabled": True,
    "regime_detection": True,
    "trade_validation": False,
    "daily_reports": False,
}


class AIConfigUpdate(BaseModel):
    provider: str | None = None
    model: str | None = None
    enabled: bool | None = None
    regime_detection: bool | None = None
    trade_validation: bool | None = None
    daily_reports: bool | None = None


@router.get("/config")
async def get_ai_config():
    return _ai_config


@router.put("/config")
async def update_ai_config(body: AIConfigUpdate):
    if body.provider is not None:
        from ..server import engine_ref

        if engine_ref and engine_ref.ai_registry:
            try:
                engine_ref.ai_registry.set_preferred(body.provider)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
        _ai_config["provider"] = body.provider
    if body.model is not None:
        _ai_config["model"] = body.model
    if body.enabled is not None:
        _ai_config["enabled"] = body.enabled
    if body.regime_detection is not None:
        _ai_config["regime_detection"] = body.regime_detection
    if body.trade_validation is not None:
        _ai_config["trade_validation"] = body.trade_validation
    if body.daily_reports is not None:
        _ai_config["daily_reports"] = body.daily_reports

    log.info(f"AI config updated: {_ai_config}")
    return _ai_config


@router.get("/status")
async def get_ai_status():
    from ..server import engine_ref

    status = {
        "provider": _ai_config.get("provider", "none"),
        "model": _ai_config.get("model", "none"),
        "enabled": _ai_config.get("enabled", False),
        "available_providers": [],
    }

    if engine_ref and engine_ref.ai_registry:
        status["available_providers"] = engine_ref.ai_registry.available
        status["preferred_provider"] = engine_ref.ai_registry.preferred

    return status


class RegimeRequest(BaseModel):
    symbol: str = "XAUUSD"


@router.post("/regime")
async def detect_regime(body: RegimeRequest):
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        market_data = await engine_ref.broker.get_market_data(body.symbol, "M5", 50)
        regime = await engine_ref.get_market_regime(body.symbol, market_data)
        return regime
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
