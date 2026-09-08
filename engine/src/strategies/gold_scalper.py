"""XAUUSD breakout-pullback scalper v0.1.

The strategy intentionally avoids single-indicator entries. It consumes M1 bars,
builds M5/M15 context internally, detects a volatility expansion through recent
structure, then waits for a controlled pullback before emitting a signal.

This module only creates candidate signals. Account-level sizing, daily-loss
limits, position limits and execution checks remain the responsibility of the
existing XMBot risk/execution pipeline.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from ..core.types import Market, Signal, SignalAction
from .base import Strategy, StrategyConfig, StrategyType


@dataclass
class _PendingBreakout:
    direction: SignalAction
    level: float
    atr: float
    created_at: datetime
    expires_at: datetime


class GoldScalperStrategy(Strategy):
    """Regime-filtered XAUUSD breakout/pullback scalping strategy.

    Expected input is a rolling list of M1 ``Market`` bars for XAUUSD. The
    strategy aggregates those bars to M5 and M15 so the entry timeframe and
    regime timeframes are derived from the same price stream.
    """

    VERSION = "0.1.0"

    def __init__(self, config: StrategyConfig) -> None:
        super().__init__(config)
        self.config.strategy_type = StrategyType.SCALPING

        params = self.config.params
        params.setdefault("breakout_lookback", 15)
        params.setdefault("atr_period", 14)
        params.setdefault("m5_fast_ema", 20)
        params.setdefault("m5_slow_ema", 50)
        params.setdefault("m15_fast_ema", 8)
        params.setdefault("m15_slow_ema", 21)
        params.setdefault("ema_slope_lookback", 3)
        params.setdefault("breakout_range_atr", 1.20)
        params.setdefault("breakout_buffer_atr", 0.05)
        params.setdefault("volume_factor", 1.05)
        params.setdefault("pullback_touch_atr", 0.18)
        params.setdefault("max_pullback_below_atr", 0.35)
        params.setdefault("pullback_expiry_bars", 4)
        params.setdefault("stop_buffer_atr", 0.10)
        params.setdefault("min_stop_atr", 0.60)
        params.setdefault("max_stop_atr", 2.25)
        params.setdefault("reward_risk", 1.60)
        params.setdefault("max_spread_atr", 0.15)
        params.setdefault("min_atr_pct", 0.010)
        params.setdefault("max_atr_pct", 0.250)
        params.setdefault("session_start_utc", 6)
        params.setdefault("session_end_utc", 20)
        params.setdefault("min_m1_bars", 330)

        self._pending: _PendingBreakout | None = None
        self._last_signal_bar: datetime | None = None

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        bars = self._target_bars(market_data)
        if len(bars) < int(self.config.params["min_m1_bars"]):
            return None

        current = bars[-1]
        if not self._inside_session(current.timestamp):
            self._pending = None
            return None

        atr = self._atr(bars, int(self.config.params["atr_period"]))
        if atr <= 0 or current.close <= 0:
            return None

        atr_pct = atr / current.close * 100.0
        if not (
            float(self.config.params["min_atr_pct"])
            <= atr_pct
            <= float(self.config.params["max_atr_pct"])
        ):
            self._pending = None
            return None

        spread = max(0.0, current.ask - current.bid)
        spread_atr = spread / atr
        if spread_atr > float(self.config.params["max_spread_atr"]):
            return None

        m5 = self._aggregate(bars, 5)
        m15 = self._aggregate(bars, 15)
        regime = self._regime(m5, m15)
        if regime is None:
            self._pending = None
            return None

        session_vwap = self._session_vwap(bars)
        if session_vwap <= 0:
            return None

        signal = self._check_pending(
            bars=bars,
            current=current,
            atr=atr,
            spread_atr=spread_atr,
            session_vwap=session_vwap,
            regime=regime,
        )
        if signal is not None:
            self._last_signal = signal
            self._last_signal_bar = current.timestamp
            self._pending = None
            return signal

        self._detect_breakout(
            bars=bars,
            current=current,
            atr=atr,
            session_vwap=session_vwap,
            regime=regime,
        )
        return None

    def _target_bars(self, market_data: list[Market]) -> list[Market]:
        symbols = set(self.config.symbols or ["XAUUSD"])
        bars = [
            bar
            for bar in market_data
            if bar.symbol in symbols and bar.timeframe.upper() == "M1"
        ]
        return sorted(bars, key=lambda bar: bar.timestamp)

    def _inside_session(self, timestamp: datetime) -> bool:
        start = int(self.config.params["session_start_utc"])
        end = int(self.config.params["session_end_utc"])
        hour = timestamp.hour
        if start <= end:
            return start <= hour < end
        return hour >= start or hour < end

    def _regime(self, m5: list[Market], m15: list[Market]) -> SignalAction | None:
        p = self.config.params
        m5_slow = int(p["m5_slow_ema"])
        m15_slow = int(p["m15_slow_ema"])
        slope_lookback = int(p["ema_slope_lookback"])
        if len(m5) < m5_slow + slope_lookback + 2 or len(m15) < m15_slow + 2:
            return None

        m5_closes = [bar.close for bar in m5]
        m15_closes = [bar.close for bar in m15]
        m5_fast_series = self._ema_series(m5_closes, int(p["m5_fast_ema"]))
        m5_slow_series = self._ema_series(m5_closes, m5_slow)
        m15_fast = self._ema_series(m15_closes, int(p["m15_fast_ema"]))[-1]
        m15_slow_value = self._ema_series(m15_closes, m15_slow)[-1]

        fast_now = m5_fast_series[-1]
        slow_now = m5_slow_series[-1]
        fast_then = m5_fast_series[-1 - slope_lookback]

        if fast_now > slow_now and fast_now > fast_then and m15_fast > m15_slow_value:
            return SignalAction.BUY
        if fast_now < slow_now and fast_now < fast_then and m15_fast < m15_slow_value:
            return SignalAction.SELL
        return None

    def _detect_breakout(
        self,
        *,
        bars: list[Market],
        current: Market,
        atr: float,
        session_vwap: float,
        regime: SignalAction,
    ) -> None:
        if self._pending is not None:
            return
        if self._last_signal_bar is not None and current.timestamp <= self._last_signal_bar:
            return

        lookback = int(self.config.params["breakout_lookback"])
        if len(bars) < lookback + 2:
            return
        previous = bars[-lookback - 1 : -1]
        recent_high = max(bar.high for bar in previous)
        recent_low = min(bar.low for bar in previous)
        candle_range = max(0.0, current.high - current.low)
        if candle_range < float(self.config.params["breakout_range_atr"]) * atr:
            return

        avg_volume = sum(max(0.0, bar.volume) for bar in previous) / len(previous)
        volume_ok = avg_volume <= 0 or current.volume >= avg_volume * float(self.config.params["volume_factor"])
        if not volume_ok:
            return

        buffer_value = float(self.config.params["breakout_buffer_atr"]) * atr
        expiry = current.timestamp + timedelta(minutes=int(self.config.params["pullback_expiry_bars"]))
        close_location = (current.close - current.low) / candle_range if candle_range > 0 else 0.5

        if (
            regime == SignalAction.BUY
            and current.close > recent_high + buffer_value
            and current.close > session_vwap
            and close_location >= 0.65
        ):
            self._pending = _PendingBreakout(
                direction=SignalAction.BUY,
                level=recent_high,
                atr=atr,
                created_at=current.timestamp,
                expires_at=expiry,
            )
        elif (
            regime == SignalAction.SELL
            and current.close < recent_low - buffer_value
            and current.close < session_vwap
            and close_location <= 0.35
        ):
            self._pending = _PendingBreakout(
                direction=SignalAction.SELL,
                level=recent_low,
                atr=atr,
                created_at=current.timestamp,
                expires_at=expiry,
            )

    def _check_pending(
        self,
        *,
        bars: list[Market],
        current: Market,
        atr: float,
        spread_atr: float,
        session_vwap: float,
        regime: SignalAction,
    ) -> Signal | None:
        pending = self._pending
        if pending is None:
            return None
        if current.timestamp <= pending.created_at:
            return None
        if current.timestamp > pending.expires_at:
            self._pending = None
            return None
        if regime != pending.direction:
            self._pending = None
            return None

        touch = float(self.config.params["pullback_touch_atr"]) * pending.atr
        max_breach = float(self.config.params["max_pullback_below_atr"]) * pending.atr

        if pending.direction == SignalAction.BUY:
            if current.low < pending.level - max_breach:
                self._pending = None
                return None
            confirmed = (
                current.low <= pending.level + touch
                and current.close > pending.level
                and current.close > current.open
                and current.close > session_vwap
            )
            if not confirmed:
                return None
            entry = current.ask if current.ask > 0 else current.close
            raw_stop = min(bar.low for bar in bars[-3:]) - float(self.config.params["stop_buffer_atr"]) * atr
            return self._build_signal(
                direction=SignalAction.BUY,
                entry=entry,
                raw_stop=raw_stop,
                atr=atr,
                spread_atr=spread_atr,
                breakout_level=pending.level,
                session_vwap=session_vwap,
            )

        if current.high > pending.level + max_breach:
            self._pending = None
            return None
        confirmed = (
            current.high >= pending.level - touch
            and current.close < pending.level
            and current.close < current.open
            and current.close < session_vwap
        )
        if not confirmed:
            return None
        entry = current.bid if current.bid > 0 else current.close
        raw_stop = max(bar.high for bar in bars[-3:]) + float(self.config.params["stop_buffer_atr"]) * atr
        return self._build_signal(
            direction=SignalAction.SELL,
            entry=entry,
            raw_stop=raw_stop,
            atr=atr,
            spread_atr=spread_atr,
            breakout_level=pending.level,
            session_vwap=session_vwap,
        )

    def _build_signal(
        self,
        *,
        direction: SignalAction,
        entry: float,
        raw_stop: float,
        atr: float,
        spread_atr: float,
        breakout_level: float,
        session_vwap: float,
    ) -> Signal | None:
        p = self.config.params
        if direction == SignalAction.BUY:
            distance = entry - raw_stop
        else:
            distance = raw_stop - entry
        if distance <= 0:
            return None

        min_distance = float(p["min_stop_atr"]) * atr
        max_distance = float(p["max_stop_atr"]) * atr
        if distance > max_distance:
            self._pending = None
            return None
        if distance < min_distance:
            distance = min_distance

        rr = float(p["reward_risk"])
        if direction == SignalAction.BUY:
            stop = entry - distance
            target = entry + rr * distance
        else:
            stop = entry + distance
            target = entry - rr * distance

        confidence = 0.70
        if spread_atr <= float(p["max_spread_atr"]) * 0.5:
            confidence += 0.05
        if distance <= atr:
            confidence += 0.05

        return Signal(
            id="",
            action=direction,
            market=self.config.symbols[0] if self.config.symbols else "XAUUSD",
            entry_price=entry,
            stop_loss=stop,
            take_profit=target,
            confidence=min(confidence, 0.85),
            reason=(
                f"GoldScalper {direction.value}: regime aligned, structure break held on pullback; "
                f"RR={rr:.2f}, spread={spread_atr:.2f} ATR"
            ),
            agent=self.name,
            metadata={
                "strategy": "gold_scalper",
                "version": self.VERSION,
                "entry_timeframe": "M1",
                "regime_timeframes": ["M5", "M15"],
                "breakout_level": breakout_level,
                "atr": atr,
                "spread_atr": spread_atr,
                "session_vwap": session_vwap,
                "stop_distance_atr": distance / atr,
                "reward_risk": rr,
            },
        )

    @staticmethod
    def _ema_series(values: list[float], period: int) -> list[float]:
        if not values:
            return []
        alpha = 2.0 / (period + 1.0)
        output = [values[0]]
        for value in values[1:]:
            output.append(alpha * value + (1.0 - alpha) * output[-1])
        return output

    @staticmethod
    def _atr(bars: list[Market], period: int) -> float:
        if len(bars) < period + 1:
            return 0.0
        true_ranges: list[float] = []
        for index in range(1, len(bars)):
            current = bars[index]
            previous_close = bars[index - 1].close
            true_ranges.append(
                max(
                    current.high - current.low,
                    abs(current.high - previous_close),
                    abs(current.low - previous_close),
                )
            )
        recent = true_ranges[-period:]
        return sum(recent) / len(recent) if recent else 0.0

    @staticmethod
    def _session_vwap(bars: list[Market]) -> float:
        current_date = bars[-1].timestamp.date()
        session = [bar for bar in bars if bar.timestamp.date() == current_date]
        if not session:
            return 0.0
        weighted_value = 0.0
        total_volume = 0.0
        for bar in session:
            volume = max(0.0, bar.volume)
            typical = (bar.high + bar.low + bar.close) / 3.0
            weighted_value += typical * volume
            total_volume += volume
        if total_volume > 0:
            return weighted_value / total_volume
        return sum(bar.close for bar in session) / len(session)

    @staticmethod
    def _aggregate(bars: list[Market], minutes: int) -> list[Market]:
        if not bars:
            return []

        output: list[Market] = []
        bucket: list[Market] = []
        bucket_key: datetime | None = None

        def key_for(timestamp: datetime) -> datetime:
            return timestamp.replace(
                minute=(timestamp.minute // minutes) * minutes,
                second=0,
                microsecond=0,
            )

        def flush(group: list[Market], key: datetime) -> Market:
            first = group[0]
            last = group[-1]
            return Market(
                symbol=last.symbol,
                timeframe=f"M{minutes}",
                bid=last.bid,
                ask=last.ask,
                open=first.open,
                high=max(bar.high for bar in group),
                low=min(bar.low for bar in group),
                close=last.close,
                volume=sum(max(0.0, bar.volume) for bar in group),
                timestamp=key,
            )

        for bar in bars:
            key = key_for(bar.timestamp)
            if bucket_key is None:
                bucket_key = key
            if key != bucket_key:
                output.append(flush(bucket, bucket_key))
                bucket = []
                bucket_key = key
            bucket.append(bar)

        if bucket and bucket_key is not None:
            output.append(flush(bucket, bucket_key))
        return output
