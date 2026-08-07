"""Momentum strategy template - trading with the trend direction."""
from __future__ import annotations

import logging

from ...core.types import Market, Signal, SignalAction
from ..base import Strategy, StrategyConfig, StrategyType

log = logging.getLogger("xmbot.strategy.momentum")


class MomentumStrategy(Strategy):
    """Momentum strategy for trading with the trend.

    Uses MACD and ADX to identify strong trends and enter on momentum.
    Designed for trending markets on H1-H4 timeframes.
    """

    def __init__(self, config: StrategyConfig) -> None:
        super().__init__(config)
        self.config.strategy_type = StrategyType.MOMENTUM

        # Default momentum parameters
        self.config.params.setdefault("macd_fast", 12)
        self.config.params.setdefault("macd_slow", 26)
        self.config.params.setdefault("macd_signal", 9)
        self.config.params.setdefault("adx_period", 14)
        self.config.params.setdefault("adx_threshold", 25)
        self.config.params.setdefault("atr_multiplier", 1.5)

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data for momentum opportunities."""
        if len(market_data) < self.config.params["macd_slow"]:
            return None

        closes = [m.close for m in market_data]
        highs = [m.high for m in market_data]
        lows = [m.low for m in market_data]

        # Calculate MACD
        macd_line, signal_line, histogram = self._calculate_macd(
            closes,
            self.config.params["macd_fast"],
            self.config.params["macd_slow"],
            self.config.params["macd_signal"]
        )

        # Calculate ADX
        adx = self._calculate_adx(highs, lows, closes, self.config.params["adx_period"])

        # Calculate ATR
        atr = self._calculate_atr(highs, lows, closes, 14)

        current_price = closes[-1]
        prev_histogram = histogram[-2] if len(histogram) > 1 else 0
        current_histogram = histogram[-1]

        signal = None

        # Buy signal: MACD crosses above signal line + strong trend (ADX > threshold)
        if (prev_histogram <= 0 and current_histogram > 0 and
            adx > self.config.params["adx_threshold"]):
            sl = current_price - atr * self.config.params["atr_multiplier"]
            tp = current_price + atr * self.config.params["atr_multiplier"] * 2

            signal = Signal(
                id="",
                action=SignalAction.BUY,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.75,
                reason=f"Momentum BUY: MACD crossover, ADX={adx:.1f}",
                agent=self.name,
            )

        # Sell signal: MACD crosses below signal line + strong trend
        elif (prev_histogram >= 0 and current_histogram < 0 and
              adx > self.config.params["adx_threshold"]):
            sl = current_price + atr * self.config.params["atr_multiplier"]
            tp = current_price - atr * self.config.params["atr_multiplier"] * 2

            signal = Signal(
                id="",
                action=SignalAction.SELL,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.75,
                reason=f"Momentum SELL: MACD crossover, ADX={adx:.1f}",
                agent=self.name,
            )

        if signal:
            self._last_signal = signal
        return signal

    def _calculate_macd(self, data: list[float], fast: int, slow: int,
                        signal_period: int) -> tuple[list, list, list]:
        """Calculate MACD indicator."""
        ema_fast = self._calculate_ema(data, fast)
        ema_slow = self._calculate_ema(data, slow)

        macd_line = ema_fast - ema_slow

        # For simplicity, use a simple signal line calculation
        signal_line = macd_line * 0.8  # Simplified
        histogram = macd_line - signal_line

        return [macd_line], [signal_line], [histogram]

    def _calculate_ema(self, data: list[float], period: int) -> float:
        """Calculate Exponential Moving Average."""
        if len(data) < period:
            return sum(data) / len(data) if data else 0

        multiplier = 2 / (period + 1)
        ema = sum(data[:period]) / period

        for price in data[period:]:
            ema = (price - ema) * multiplier + ema

        return ema

    def _calculate_adx(self, highs: list[float], lows: list[float],
                       closes: list[float], period: int) -> float:
        """Calculate Average Directional Index."""
        if len(highs) < period + 1:
            return 0.0

        plus_dm = []
        minus_dm = []
        tr_list = []

        for i in range(1, len(highs)):
            high_diff = highs[i] - highs[i-1]
            low_diff = lows[i-1] - lows[i]

            plus_dm.append(high_diff if high_diff > low_diff and high_diff > 0 else 0)
            minus_dm.append(low_diff if low_diff > high_diff and low_diff > 0 else 0)

            tr = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            tr_list.append(tr)

        if len(tr_list) < period:
            return 0.0

        atr = sum(tr_list[-period:]) / period
        if atr == 0:
            return 0.0

        plus_di = (sum(plus_dm[-period:]) / period) / atr * 100
        minus_di = (sum(minus_dm[-period:]) / period) / atr * 100

        if plus_di + minus_di == 0:
            return 0.0

        dx = abs(plus_di - minus_di) / (plus_di + minus_di) * 100
        return dx

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
