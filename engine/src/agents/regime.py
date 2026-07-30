"""Market regime detection agent using AI."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

from ..ai.base import AIProvider, AIResponse
from ..core.types import Market


log = logging.getLogger("xmbot.agent.regime")


class MarketRegimeDetector:
    """Detect market regime (trending/ranging/volatile) using AI.

    This is NOT used for per-trade decisions. It's used for:
    - Adjusting ADX thresholds based on market conditions
    - Selecting appropriate strategy parameters
    - Risk management adjustments
    """

    def __init__(self, ai_provider: Optional[AIProvider] = None) -> None:
        self.ai = ai_provider
        self._cache: dict[str, dict] = {}
        self._cache_ttl = 3600  # 1 hour

    async def detect(self, symbol: str, market_data: list[Market]) -> dict:
        """Detect current market regime."""
        now = datetime.utcnow().timestamp()

        if symbol in self._cache:
            cached = self._cache[symbol]
            if now - cached.get("timestamp", 0) < self._cache_ttl:
                return cached

        if not self.ai:
            return self._default_regime()

        try:
            data_summary = self._format_data(market_data)
            response = await self.ai.generate(
                self._build_prompt(data_summary),
                system=self._system_prompt
            )

            if response.error:
                log.warning(f"AI regime detection failed: {response.error}")
                return self._default_regime()

            result = json.loads(response.content)
            result["timestamp"] = now
            result["source"] = "ai"
            result["model"] = response.model
            result["tokens"] = response.tokens_used

            self._cache[symbol] = result
            log.info(f"Regime for {symbol}: {result['regime']} ({result['confidence']:.0%})")
            return result

        except json.JSONDecodeError:
            log.error("Failed to parse AI regime response")
            return self._default_regime()
        except Exception as e:
            log.error(f"Regime detection error: {e}")
            return self._default_regime()

    def get_adx_threshold(self, regime: dict) -> float:
        """Get appropriate ADX threshold based on regime."""
        regime_type = regime.get("regime", "unknown")
        thresholds = {
            "trending_up": 25.0,
            "trending_down": 25.0,
            "ranging": 35.0,
            "volatile": 40.0,
            "unknown": 30.0,
        }
        return thresholds.get(regime_type, 30.0)

    def get_position_size_multiplier(self, regime: dict) -> float:
        """Get position size multiplier based on regime."""
        regime_type = regime.get("regime", "unknown")
        multipliers = {
            "trending_up": 1.0,
            "trending_down": 1.0,
            "ranging": 0.5,
            "volatile": 0.75,
            "unknown": 1.0,
        }
        return multipliers.get(regime_type, 1.0)

    def _default_regime(self) -> dict:
        return {
            "regime": "unknown",
            "confidence": 0.0,
            "reason": "AI unavailable",
            "source": "default",
            "timestamp": datetime.utcnow().timestamp(),
        }

    def _format_data(self, market_data: list[Market]) -> str:
        if not market_data:
            return "No data available"

        recent = market_data[-20:] if len(market_data) > 20 else market_data
        lines = []
        for m in recent:
            lines.append(
                f"{m.timestamp.strftime('%H:%M')} O:{m.open:.2f} H:{m.high:.2f} "
                f"L:{m.low:.2f} C:{m.close:.2f}"
            )
        return "\n".join(lines)

    def _build_prompt(self, data_summary: str) -> str:
        return (
            f"Analyze this XAUUSD M5 market data and classify the current regime.\n\n"
            f"Data (last 20 candles):\n{data_summary}\n\n"
            f"Reply with JSON:\n"
            f'{{"regime": "trending_up|trending_down|ranging|volatile", '
            f'"confidence": 0.0-1.0, "reason": "brief explanation"}}'
        )

    @property
    def _system_prompt(self) -> str:
        return (
            "You are a market regime classifier for XAUUSD gold trading. "
            "Analyze price action to determine if the market is trending or ranging. "
            "Reply only with valid JSON, no other text."
        )
