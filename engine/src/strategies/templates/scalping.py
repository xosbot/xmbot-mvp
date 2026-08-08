"""Scalping strategy template - quick trades on small price movements."""
from __future__ import annotations

import logging

from ...core.types import Market, Signal, SignalAction
from ..base import Strategy, StrategyConfig, StrategyType

log = logging.getLogger("xmbot.strategy.scalping")


class ScalpingStrategy(Strategy):
    """Scalping strategy for quick profits on small price movements.

    Uses RSI and moving averages to identify short-term entry/exit points.
    Designed for high-frequency trading on M1-M5 timeframes.
    """

    def __init__(self, config: StrategyConfig) -> None:
        super().__init__(config)
        self.config.strategy_type = StrategyType.SCALPING

        # Default scalping parameters
        self.config.params.setdefault("rsi_period", 7)
        self.config.params.setdefault("rsi_oversold", 30)
        self.config.params.setdefault("rsi_overbought", 70)
        self.config.params.setdefault("fast_ma", 5)
        self.config.params.setdefault("slow_ma", 13)
        self.config.params.setdefault("take_profit_pips", 10)
        self.config.params.setdefault("stop_loss_pips", 5)

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data for scalping opportunities."""
        if len(market_data) < self.config.params["slow_ma"]:
            return None

        closes = [m.close for m in market_data]

        # Calculate RSI
        rsi = self._calculate_rsi(closes, self.config.params["rsi_period"])

        # Calculate moving averages
        fast_ma = sum(closes[-self.config.params["fast_ma":]]) / self.config.params["fast_ma"]
        slow_ma = sum(closes[-self.config.params["slow_ma"]:]) / self.config.params["slow_ma"]

        current_price = closes[-1]
        prev_fast_ma = sum(closes[-self.config.params["fast_ma"]-1:-1]) / self.config.params["fast_ma"]
        prev_slow_ma = sum(closes[-self.config.params["slow_ma"]-1:-1]) / self.config.params["slow_ma"]

        # Generate signals
        signal = None

        # Buy signal: RSI oversold + fast MA crosses above slow MA
        if (rsi < self.config.params["rsi_oversold"] and
            prev_fast_ma <= prev_slow_ma and fast_ma > slow_ma):
            sl = current_price - self.config.params["stop_loss_pips"] * 0.01
            tp = current_price + self.config.params["take_profit_pips"] * 0.01
            signal = Signal(
                id="",
                action=SignalAction.BUY,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.7,
                reason=f"Scalp BUY: RSI={rsi:.1f}, MA crossover",
                agent=self.name,
            )

        # Sell signal: RSI overbought + fast MA crosses below slow MA
        elif (rsi > self.config.params["rsi_overbought"] and
              prev_fast_ma >= prev_slow_ma and fast_ma < slow_ma):
            sl = current_price + self.config.params["stop_loss_pips"] * 0.01
            tp = current_price - self.config.params["take_profit_pips"] * 0.01
            signal = Signal(
                id="",
                action=SignalAction.SELL,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.7,
                reason=f"Scalp SELL: RSI={rsi:.1f}, MA crossover",
                agent=self.name,
            )

        if signal:
            self._last_signal = signal
        return signal

    def _calculate_rsi(self, closes: list[float], period: int) -> float:
        """Calculate RSI indicator."""
        if len(closes) < period + 1:
            return 50.0

        deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]

        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
