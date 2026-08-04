from __future__ import annotations

import logging
import uuid
from datetime import datetime

import numpy as np
import pandas as pd

from ..core.types import AgentConfig, Market, Signal, SignalAction
from .base import Agent

log = logging.getLogger("xmbot.agent.technical")


class TechnicalAnalysisAgent(Agent):
    """
    RSI Sniper + ADX Filter strategy.

    Ported from xm1traderv6.py — the production-tested XAUUSD bot.

    Strategy:
    1. ADX must be > 30 (strong trend — avoids chop)
    2. Enter on Supertrend flip (trend change)
    3. OR enter on RSI continuation (RSI crossing 50 in trend direction)
    """

    _PARAM_TYPES = {
        "rsi_period": int,
        "adx_period": int,
        "adx_threshold": float,
        "atr_period": int,
        "atr_multiplier": float,
        "atr_sl_multiplier": float,
        "tp_ratio": float,
        "min_sl_distance": float,
        "risk_per_trade_pct": float,
    }

    def __init__(
        self,
        config: AgentConfig,
        rsi_period: int = 14,
        adx_period: int = 14,
        adx_threshold: float = 20.0,  # Optimized: was 30.0
        atr_period: int = 14,
        atr_multiplier: float = 2.5,
        atr_sl_multiplier: float = 3.0,  # Optimized: was 1.5
        tp_ratio: float = 2.0,
        min_sl_distance: float = 5.0,
        risk_per_trade_pct: float = 2.0,
    ) -> None:
        super().__init__(config)
        self.rsi_period = rsi_period
        self.adx_period = adx_period
        self.adx_threshold = adx_threshold
        self.atr_period = atr_period
        self.atr_multiplier = atr_multiplier
        self.atr_sl_multiplier = atr_sl_multiplier
        self.tp_ratio = tp_ratio
        self.min_sl_distance = min_sl_distance
        self.risk_per_trade_pct = risk_per_trade_pct
        self._last_signal_time: datetime | None = None
        self._min_candle_gap = 5  # minutes between signals

    def update_params(self, **kwargs) -> dict:
        """Apply live strategy-parameter overrides to this running agent.

        Returns the params actually applied. Raises ValueError on an unknown
        key or a value that can't be coerced to the expected type — callers
        (the config API) turn that into a 400 rather than silently ignoring it.
        """
        applied: dict = {}
        for key, value in kwargs.items():
            expected_type = self._PARAM_TYPES.get(key)
            if expected_type is None:
                raise ValueError(f"Unknown strategy parameter: {key}")
            try:
                coerced = expected_type(value)
            except (TypeError, ValueError):
                raise ValueError(f"Invalid value for {key}: {value!r}")
            setattr(self, key, coerced)
            applied[key] = coerced
        if applied:
            log.info(f"[{self.name}] Strategy params updated: {applied}")
        return applied

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data for trading signals.

        Args:
            market_data: List of Market objects. When multi-timeframe is enabled,
                        the first N candles are M5 data, and the last M candles are
                        H1 confirmation data (separated by the engine).
        """
        if len(market_data) < 50:
            log.warning(f"[{self.name}] Not enough data: {len(market_data)}")
            return None

        df = self._to_dataframe(market_data)
        df = self._calculate_indicators(df)

        last = df.iloc[-2]
        prev = df.iloc[-3]

        self._update_context(last)

        if last["ADX"] <= self.adx_threshold:
            log.debug(f"[{self.name}] ADX {last['ADX']:.1f} <= {self.adx_threshold} — skipping")
            return None

        is_flip_buy = last["trend"] == 1 and prev["trend"] == -1
        is_flip_sell = last["trend"] == -1 and prev["trend"] == 1

        is_cont_buy = last["trend"] == 1 and last["RSI"] > 50 and prev["RSI"] <= 50
        is_cont_sell = last["trend"] == -1 and last["RSI"] < 50 and prev["RSI"] >= 50

        if is_flip_buy or is_cont_buy:
            return self._build_signal(SignalAction.BUY, last, "Sniper")

        if is_flip_sell or is_cont_sell:
            return self._build_signal(SignalAction.SELL, last, "Sniper")

        return None

    def analyze_with_confirmation(
        self, m5_data: list[Market], h1_data: list[Market] | None = None
    ) -> Signal | None:
        """Analyze M5 data with optional H1 trend confirmation.

        This is the synchronous version called by the engine when
        multi-timeframe confirmation is enabled.
        """
        if len(m5_data) < 50:
            return None

        df = self._to_dataframe(m5_data)
        df = self._calculate_indicators(df)

        last = df.iloc[-2]
        prev = df.iloc[-3]

        if last["ADX"] <= self.adx_threshold:
            return None

        signal = None
        is_flip_buy = last["trend"] == 1 and prev["trend"] == -1
        is_flip_sell = last["trend"] == -1 and prev["trend"] == 1
        is_cont_buy = last["trend"] == 1 and last["RSI"] > 50 and prev["RSI"] <= 50
        is_cont_sell = last["trend"] == -1 and last["RSI"] < 50 and prev["RSI"] >= 50

        if is_flip_buy or is_cont_buy:
            signal = self._build_signal(SignalAction.BUY, last, "Sniper")
        elif is_flip_sell or is_cont_sell:
            signal = self._build_signal(SignalAction.SELL, last, "Sniper")

        if signal is None:
            return None

        if h1_data and len(h1_data) >= 30:
            h1_df = self._to_dataframe(h1_data)
            h1_df = self._calculate_indicators(h1_df)
            h1_trend = h1_df.iloc[-1]["trend"]

            if signal.action == SignalAction.BUY and h1_trend != 1:
                log.debug(f"[{self.name}] M5 BUY rejected: H1 trend is {h1_trend} (not uptrend)")
                return None
            if signal.action == SignalAction.SELL and h1_trend != -1:
                log.debug(f"[{self.name}] M5 SELL rejected: H1 trend is {h1_trend} (not downtrend)")
                return None

            signal.reason += f" + H1 confirms ({'↑' if h1_trend == 1 else '↓'})"

        return signal

    def _build_signal(self, action: SignalAction, row: pd.Series, source: str) -> Signal:
        entry = row["close"]
        atr = row["ATR"]

        sl_distance = max(atr * self.atr_sl_multiplier, self.min_sl_distance)

        if action == SignalAction.BUY:
            stop_loss = entry - sl_distance
            take_profit = entry + (sl_distance * self.tp_ratio)
        else:
            stop_loss = entry + sl_distance
            take_profit = entry - (sl_distance * self.tp_ratio)

        reason_parts = [f"ADX {row['ADX']:.1f}", f"ATR {atr:.2f}"]
        if source == "Sniper":
            reason_parts.append("Supertrend flip" if action == SignalAction.BUY else "RSI continuation")
        else:
            reason_parts.append(source)

        return Signal(
            id=str(uuid.uuid4()),
            action=action,
            market=self.config.markets[0],
            entry_price=round(entry, 2),
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
            confidence=min(0.85, 0.5 + row["ADX"] / 100),
            reason=" + ".join(reason_parts),
            agent=self.name,
            user_id="",
            metadata={"atr": float(atr), "adx": float(row["ADX"])},
        )

    def _to_dataframe(self, markets: list[Market]) -> pd.DataFrame:
        return pd.DataFrame([{
            "time": m.timestamp,
            "open": m.open,
            "high": m.high,
            "low": m.low,
            "close": m.close,
            "volume": m.volume,
        } for m in markets])

    def _calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        delta = df["close"].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.ewm(alpha=1 / self.rsi_period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1 / self.rsi_period, adjust=False).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        df["RSI"] = 100 - (100 / (1 + rs))
        df["RSI"] = df["RSI"].fillna(50.0)

        high_low = df["high"] - df["low"]
        high_close = (df["high"] - df["close"].shift()).abs()
        low_close = (df["low"] - df["close"].shift()).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df["ATR"] = tr.ewm(alpha=1 / self.atr_period, adjust=False).mean()

        up = df["high"].diff()
        down = -df["low"].diff()
        plus_dm = pd.Series(np.where((up > down) & (up > 0), up, 0.0), index=df.index)
        minus_dm = pd.Series(np.where((down > up) & (down > 0), down, 0.0), index=df.index)
        atr = df["ATR"].replace(0, np.nan)
        plus_di = 100 * plus_dm.ewm(alpha=1 / self.adx_period, adjust=False).mean() / atr
        minus_di = 100 * minus_dm.ewm(alpha=1 / self.adx_period, adjust=False).mean() / atr
        dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
        df["ADX"] = dx.ewm(alpha=1 / self.adx_period, adjust=False).mean().fillna(0)

        hl2 = (df["high"] + df["low"]) / 2
        basic_upper = hl2 + self.atr_multiplier * df["ATR"]
        basic_lower = hl2 - self.atr_multiplier * df["ATR"]

        final_upper = basic_upper.copy()
        final_lower = basic_lower.copy()
        trend = pd.Series(1, index=df.index)

        for i in range(1, len(df)):
            if basic_upper.iloc[i] < final_upper.iloc[i - 1] or df["close"].iloc[i - 1] > final_upper.iloc[i - 1]:
                final_upper.iloc[i] = basic_upper.iloc[i]
            else:
                final_upper.iloc[i] = final_upper.iloc[i - 1]

            if basic_lower.iloc[i] > final_lower.iloc[i - 1] or df["close"].iloc[i - 1] < final_lower.iloc[i - 1]:
                final_lower.iloc[i] = basic_lower.iloc[i]
            else:
                final_lower.iloc[i] = final_lower.iloc[i - 1]

            if df["close"].iloc[i] > final_upper.iloc[i]:
                trend.iloc[i] = 1
            elif df["close"].iloc[i] < final_lower.iloc[i]:
                trend.iloc[i] = -1
            else:
                trend.iloc[i] = trend.iloc[i - 1]

            if trend.iloc[i] == 1:
                final_lower.iloc[i] = max(basic_lower.iloc[i], final_lower.iloc[i])
            else:
                final_upper.iloc[i] = min(basic_upper.iloc[i], final_upper.iloc[i])

        df["trend"] = trend
        return df

    def _update_context(self, row: pd.Series) -> None:
        pass
