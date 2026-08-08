"""Swing strategy template - capturing medium-term price movements."""
from __future__ import annotations

import logging

from ...core.types import Market, Signal, SignalAction
from ..base import Strategy, StrategyConfig, StrategyType

log = logging.getLogger("xmbot.strategy.swing")


class SwingStrategy(Strategy):
    """Swing strategy for capturing medium-term price movements.

    Uses trend analysis and support/resistance levels.
    Designed for H4-D1 timeframes with wider stops.
    """

    def __init__(self, config: StrategyConfig) -> None:
        super().__init__(config)
        self.config.strategy_type = StrategyType.SWING

        # Default swing parameters
        self.config.params.setdefault("ema_fast", 12)
        self.config.params.setdefault("ema_slow", 26)
        self.config.params.setdefault("atr_period", 14)
        self.config.params.setdefault("atr_multiplier", 2.0)
        self.config.params.setdefault("min_risk_reward", 2.0)

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data for swing trading opportunities."""
        if len(market_data) < self.config.params["ema_slow"]:
            return None

        closes = [m.close for m in market_data]
        highs = [m.high for m in market_data]
        lows = [m.low for m in market_data]

        # Calculate EMAs
        ema_fast = self._calculate_ema(closes, self.config.params["ema_fast"])
        ema_slow = self._calculate_ema(closes, self.config.params["ema_slow"])

        # Calculate ATR
        atr = self._calculate_atr(highs, lows, closes, self.config.params["atr_period"])

        # Calculate trend strength
        trend_strength = (ema_fast - ema_slow) / ema_slow * 100

        current_price = closes[-1]
        prev_ema_fast = self._calculate_ema(closes[:-1], self.config.params["ema_fast"])
        prev_ema_slow = self._calculate_ema(closes[:-1], self.config.params["ema_slow"])

        signal = None

        # Buy signal: Fast EMA crosses above slow EMA in uptrend
        if (prev_ema_fast <= prev_ema_slow and ema_fast > ema_slow and
            trend_strength > 0.1):
            sl = current_price - atr * self.config.params["atr_multiplier"]
            risk = current_price - sl
            tp = current_price + risk * self.config.params["min_risk_reward"]

            signal = Signal(
                id="",
                action=SignalAction.BUY,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.75,
                reason=f"Swing BUY: EMA crossover, trend={trend_strength:.2f}%",
                agent=self.name,
            )

        # Sell signal: Fast EMA crosses below slow EMA in downtrend
        elif (prev_ema_fast >= prev_ema_slow and ema_fast < ema_slow and
              trend_strength < -0.1):
            sl = current_price + atr * self.config.params["atr_multiplier"]
            risk = sl - current_price
            tp = current_price - risk * self.config.params["min_risk_reward"]

            signal = Signal(
                id="",
                action=SignalAction.SELL,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.75,
                reason=f"Swing SELL: EMA crossover, trend={trend_strength:.2f}%",
                agent=self.name,
            )

        if signal:
            self._last_signal = signal
        return signal

    def _calculate_ema(self, data: list[float], period: int) -> float:
        """Calculate Exponential Moving Average."""
        if len(data) < period:
            return sum(data) / len(data) if data else 0

        multiplier = 2 / (period + 1)
        ema = sum(data[:period]) / period

        for price in data[period:]:
            ema = (price - ema) * multiplier + ema

        return ema

    def _calculate_atr(self, highs: list[float], lows: list[float],
                       closes: list[float], period: int) -> float:
        """Calculate Average True Range."""
        if len(highs) < period + 1:
            return 0.0

        true_ranges = []
        for i in range(1, len(highs)):
            tr = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            true_ranges.append(tr)

        return sum(true_ranges[-period:]) / period
