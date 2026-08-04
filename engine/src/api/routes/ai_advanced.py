"""Advanced AI API routes for consensus, regime, journal, and risk advisor."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = logging.getLogger("xmbot.api.ai_advanced")

router = APIRouter(prefix="/api/ai", tags=["ai-advanced"])


class ConsensusRequest(BaseModel):
    signal_details: str
    market_context: str
    providers: list[str] | None = None


class RegimeRequest(BaseModel):
    symbol: str = "XAUUSD"
    include_historical: bool = False


class JournalRequest(BaseModel):
    trade_id: str
    symbol: str
    action: str
    entry_price: float
    exit_price: float | None = None
    volume: float = 0.0


class RiskAnalysisRequest(BaseModel):
    account_balance: float = 10000.0
    daily_pnl: float = 0.0


@router.post("/consensus")
async def validate_trade_consensus(req: ConsensusRequest):
    """Validate a trade using multi-model consensus."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        result = await engine_ref.ai_registry.consensus.validate_trade(
            signal_details=req.signal_details,
            market_context=req.market_context,
            providers=req.providers,
        )
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regime")
async def detect_regime_enhanced(req: RegimeRequest):
    """Detect market regime with enhanced analysis."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        market_data = await engine_ref.broker.get_market_data(req.symbol, "M5", 50)
        result = await engine_ref.ai_registry.regime_detector.detect(
            symbol=req.symbol,
            market_data=market_data,
        )
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/regime/recommendations/{regime}")
async def get_regime_recommendations(regime: str):
    """Get strategy recommendations for a specific regime."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    from ...ai.regime_enhanced import RegimeResult
    result = RegimeResult(regime=regime, confidence=0.0, reasoning="", indicators={})
    recommendations = engine_ref.ai_registry.regime_detector.get_strategy_recommendation(result)
    return recommendations


@router.get("/regime/history")
async def get_regime_history(symbol: str | None = None):
    """Get historical regime detections."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    return engine_ref.ai_registry.regime_detector.get_regime_history(symbol)


@router.post("/journal/record")
async def record_journal_entry(req: JournalRequest):
    """Record a trade in the journal."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        market_data = await engine_ref.broker.get_market_data(req.symbol, "M5", 20)
        entry = await engine_ref.ai_registry.journal.record_trade(
            trade_id=req.trade_id,
            symbol=req.symbol,
            action=req.action,
            entry_price=req.entry_price,
            exit_price=req.exit_price,
            volume=req.volume,
            market_data=market_data,
        )
        return entry.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/journal/entries")
async def get_journal_entries(
    symbol: str | None = None,
    limit: int = 50,
):
    """Get journal entries."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    entries = engine_ref.ai_registry.journal.get_entries(symbol=symbol)
    return [e.to_dict() for e in entries[-limit:]]


@router.get("/journal/stats")
async def get_journal_stats():
    """Get journal statistics."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    return engine_ref.ai_registry.journal.get_stats()


@router.get("/journal/daily-summary")
async def get_daily_summary():
    """Get daily trading summary."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    return {"summary": await engine_ref.ai_registry.journal.generate_daily_summary()}


@router.get("/journal/weekly-review")
async def get_weekly_review():
    """Get weekly performance review."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    return {"review": await engine_ref.ai_registry.journal.generate_weekly_review()}


@router.post("/risk/analyze")
async def analyze_risk(req: RiskAnalysisRequest):
    """Analyze current risk exposure."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    try:
        positions = await engine_ref.broker.get_positions()
        suggestions = await engine_ref.ai_registry.risk_advisor.analyze_risk(
            current_positions=positions,
            account_balance=req.account_balance,
            daily_pnl=req.daily_pnl,
            recent_trades=[],
        )
        return {"suggestions": [s.to_dict() for s in suggestions]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk/suggestions")
async def get_risk_suggestions(
    category: str | None = None,
    priority: str | None = None,
):
    """Get risk management suggestions."""
    from ..server import engine_ref

    if not engine_ref:
        raise HTTPException(status_code=503, detail="Engine not ready")

    suggestions = engine_ref.ai_registry.risk_advisor.get_suggestions(
        category=category,
        priority=priority,
    )
    return {"suggestions": [s.to_dict() for s in suggestions]}
