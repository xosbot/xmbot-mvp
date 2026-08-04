"""Mean reversion strategy template - trading price reversions to the mean."""
from __future__ import annotations

import logging
from ..base import Strategy, StrategyConfig, StrategyType
from ...core.types import Market, Signal, SignalAction

log = logging.getLogger("xmbot.strategy.mean_reversion")


class MeanReversionStrategy(Strategy):
    """Mean reversion strategy for trading price reversions.

    Uses Bollinger Bands and Z-score to identify overbought/oversold conditions.
    Designed for ranging markets on M15-H1 timeframes.
    """

    def __init__(self, config: StrategyConfig) -> None:
        super().__init__(config)
        self.config.strategy_type = StrategyType.MEAN_REVERSION

        # Default mean reversion parameters
        self.config.params.setdefault("bb_period", 20)
        self.config.params.setdefault("bb_std", 2.0)
        self.config.params.setdefault("z_score_threshold", 2.0)
        self.config.params.setdefault("rsi_period", 14)
        self.config.params.setdefault("rsi_oversold", 30)
        self.config.params.setdefault("rsi_overbought", 70)

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data for mean reversion opportunities."""
        if len(market_data) < self.config.params["bb_period"]:
            return None

        closes = [m.close for m in market_data]

        # Calculate Bollinger Bands
        bb_upper, bb_middle, bb_lower = self._calculate_bollinger_bands(
            closes, self.config.params["bb_period"], self.config.params["bb_std"]
        )

        # Calculate Z-score
        z_score = self._calculate_z_score(closes, self.config.params["bb_period"])

        # Calculate RSI
        rsi = self._calculate_rsi(closes, self.config.params["rsi_period"])

        current_price = closes[-1]
        signal = None

        # Buy signal: Price below lower BB + oversold RSI + negative Z-score
        if (current_price <= bb_lower and
            rsi < self.config.params["rsi_oversold"] and
            z_score < -self.config.params["z_score_threshold"]):
            sl = bb_lower - (bb_middle - bb_lower) * 0.5
            tp = bb_middle

            signal = Signal(
                id="",
                action=SignalAction.BUY,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.8,
                reason=f"Mean Rev BUY: Z={z_score:.2f}, RSI={rsi:.1f}",
                agent=self.name,
            )

        # Sell signal: Price above upper BB + overbought RSI + positive Z-score
        elif (current_price >= bb_upper and
              rsi > self.config.params["rsi_overbought"] and
              z_score > self.config.params["z_score_threshold"]):
            sl = bb_upper + (bb_upper - bb_middle) * 0.5
            tp = bb_middle

            signal = Signal(
                id="",
                action=SignalAction.SELL,
                market=self.config.symbols[0],
                entry_price=current_price,
                stop_loss=sl,
                take_profit=tp,
                confidence=0.8,
                reason=f"Mean Rev SELL: Z={z_score:.2f}, RSI={rsi:.1f}",
                agent=self.name,
            )

        if signal:
            self._last_signal = signal
        return signal

    def _calculate_bollinger_bands(self, data: list[float], period: int,
                                    std_dev: float) -> tuple[float, float, float]:
        """Calculate Bollinger Bands."""
        if len(data) < period:
            avg = sum(data) / len(data) if data else 0
            return avg, avg, avg

        recent = data[-period:]
        middle = sum(recent) / period
        variance = sum((x - middle) ** 2 for x in recent) / period
        std = variance ** 0.5

        upper = middle + std_dev * std
        lower = middle - std_dev * std

        return upper, middle, lower

    def _calculate_z_score(self, data: list[float], period: int) -> float:
        """Calculate Z-score of current price relative to recent mean."""
        if len(data) < period:
            return 0.0

        recent = data[-period:]
        mean = sum(recent) / period
        variance = sum((x - mean) ** 2 for x in recent) / period
        std = variance ** 0.5

        if std == 0:
            return 0.0

        return (data[-1] - mean) / std

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
