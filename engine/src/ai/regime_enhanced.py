"""Enhanced regime detection with historical analysis."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from .base import AIProvider, AIResponse

log = logging.getLogger("xmbot.ai.regime")


@dataclass
class RegimeResult:
    """Market regime detection result."""
    regime: str  # trending_up, trending_down, ranging, volatile
    confidence: float
    reasoning: str
    indicators: dict
    historical_context: str | None = None
    timestamp: datetime | None = None

    def to_dict(self) -> dict:
        return {
            "regime": self.regime,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "indicators": self.indicators,
            "historical_context": self.historical_context,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class EnhancedRegimeDetector:
    """Enhanced market regime detection using AI with historical context.

    Improvements over basic detection:
    - Considers multiple timeframes
    - Uses historical regime transitions
    - Provides confidence scoring
    - Offers regime-specific strategy recommendations
    """

    def __init__(self, ai_provider: AIProvider | None = None) -> None:
        self.ai = ai_provider
        self._cache: dict[str, RegimeResult] = {}
        self._cache_ttl = 1800  # 30 minutes
        self._history: list[dict] = []

    async def detect(
        self,
        symbol: str,
        market_data: list,
        historical_data: list | None = None,
    ) -> RegimeResult:
        """Detect current market regime with enhanced analysis.

        Args:
            symbol: Trading symbol
            market_data: Recent market data (M5)
            historical_data: Optional historical data for context

        Returns:
            RegimeResult with detailed regime analysis
        """
        # Check cache
        cache_key = f"{symbol}_{len(market_data)}"
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if cached.timestamp:
                age = (datetime.now(UTC) - cached.timestamp).total_seconds()
                if age < self._cache_ttl:
                    return cached

        if not self.ai:
            return self._default_result(symbol)

        try:
            # Format data for analysis
            data_summary = self._format_data(market_data)
            hist_summary = self._format_data(historical_data) if historical_data else None

            # Build enhanced prompt
            prompt = self._build_enhanced_prompt(data_summary, hist_summary)

            response = await self.ai.generate(
                prompt,
                system=self._system_prompt
            )

            if response.error:
                log.warning(f"AI regime detection failed: {response.error}")
                return self._default_result(symbol)

            # Parse response
            result = self._parse_response(response, symbol)

            # Cache result
            self._cache[cache_key] = result

            # Track history
            self._history.append({
                "symbol": symbol,
                "regime": result.regime,
                "confidence": result.confidence,
                "timestamp": result.timestamp.isoformat(),
            })

            # Keep only last 100 history entries
            if len(self._history) > 100:
                self._history = self._history[-100:]

            log.info(f"Regime for {symbol}: {result.regime} ({result.confidence:.0%})")
            return result

        except Exception as e:
            log.error(f"Regime detection error: {e}")
            return self._default_result(symbol)

    def get_strategy_recommendation(self, regime: RegimeResult) -> dict:
        """Get strategy recommendations based on detected regime."""
        recommendations = {
            "trending_up": {
                "preferred_strategies": ["momentum", "swing"],
                "avoid_strategies": ["mean_reversion"],
                "position_sizing": 1.0,
                "risk_multiplier": 1.0,
            },
            "trending_down": {
                "preferred_strategies": ["momentum", "swing"],
                "avoid_strategies": ["mean_reversion"],
                "position_sizing": 0.8,  # Reduce size in downtrends
                "risk_multiplier": 1.2,
            },
            "ranging": {
                "preferred_strategies": ["mean_reversion", "scalping"],
                "avoid_strategies": ["momentum"],
                "position_sizing": 0.7,
                "risk_multiplier": 0.8,
            },
            "volatile": {
                "preferred_strategies": ["scalping"],
                "avoid_strategies": ["swing", "momentum"],
                "position_sizing": 0.5,
                "risk_multiplier": 1.5,
            },
            "unknown": {
                "preferred_strategies": [],
                "avoid_strategies": [],
                "position_sizing": 0.5,
                "risk_multiplier": 1.0,
            },
        }

        return recommendations.get(regime.regime, recommendations["unknown"])

    def get_regime_history(self, symbol: str | None = None) -> list[dict]:
        """Get historical regime detections."""
        if symbol:
            return [h for h in self._history if h["symbol"] == symbol]
        return self._history

    def _format_data(self, market_data: list) -> str:
        """Format market data for AI analysis."""
        if not market_data:
            return "No data available"

        recent = market_data[-30:] if len(market_data) > 30 else market_data
        lines = []
        for m in recent:
            lines.append(
                f"{m.timestamp.strftime('%H:%M')} O:{m.open:.2f} H:{m.high:.2f} "
                f"L:{m.low:.2f} C:{m.close:.2f} V:{m.volume:.0f}"
            )
        return "\n".join(lines)

    def _build_enhanced_prompt(self, data_summary: str, hist_summary: str | None) -> str:
        """Build enhanced analysis prompt."""
        prompt = (
            f"Analyze this XAUUSD market data and classify the current regime.\n\n"
            f"Current Data (M5):\n{data_summary}\n\n"
        )

        if hist_summary:
            prompt += f"Historical Context:\n{hist_summary}\n\n"

        prompt += (
            "Consider:\n"
            "1. Price action and trend direction\n"
            "2. Volatility (ATR, price range)\n"
            "3. Volume patterns\n"
            "4. Key support/resistance levels\n\n"
            "Reply with JSON:\n"
            '{"regime": "trending_up|trending_down|ranging|volatile", '
            '"confidence": 0.0-1.0, "reasoning": "brief explanation", '
            '"indicators": {"trend": "up|down|flat", "volatility": "low|medium|high", '
            '"volume": "increasing|decreasing|stable"}}'
        )

        return prompt

    def _parse_response(self, response: AIResponse, symbol: str) -> RegimeResult:
        """Parse AI response into RegimeResult."""
        try:
            # Try to parse as JSON
            content = response.content.strip()
            # Find JSON in response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = content[start:end]
                data = json.loads(json_str)

                return RegimeResult(
                    regime=data.get("regime", "unknown"),
                    confidence=float(data.get("confidence", 0.5)),
                    reasoning=data.get("reasoning", ""),
                    indicators=data.get("indicators", {}),
                    timestamp=datetime.now(UTC),
                )
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: infer from text
        content = response.content.upper()
        if "TRENDING UP" in content or "UPTREND" in content:
            regime = "trending_up"
        elif "TRENDING DOWN" in content or "DOWNTREND" in content:
            regime = "trending_down"
        elif "RANGING" in content or "SIDEWAYS" in content:
            regime = "ranging"
        elif "VOLATILE" in content or "VOLATILITY" in content:
            regime = "volatile"
        else:
            regime = "unknown"

        return RegimeResult(
            regime=regime,
            confidence=0.6,
            reasoning=response.content[:200],
            indicators={},
            timestamp=datetime.now(UTC),
        )

    def _default_result(self, symbol: str) -> RegimeResult:
        """Return default result when AI is unavailable."""
        return RegimeResult(
            regime="unknown",
            confidence=0.0,
            reasoning="AI unavailable",
            indicators={},
            timestamp=datetime.now(UTC),
        )

    @property
    def _system_prompt(self) -> str:
        return (
            "You are an expert market regime classifier for XAUUSD gold trading. "
            "Analyze price action, volatility, and volume to determine the current "
            "market regime. Reply only with valid JSON, no other text."
        )
