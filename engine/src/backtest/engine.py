"""Core backtesting engine for XMBot strategies."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from ..agents.technical import TechnicalAnalysisAgent
from ..core.types import Market
from .portfolio import BacktestPortfolio, BacktestResult

log = logging.getLogger("xmbot.backtest")


class BacktestEngine:
    """Run technical analysis strategy against historical data."""

    def __init__(
        self,
        agent: TechnicalAnalysisAgent | None = None,
        initial_capital: float = 10000.0,
        risk_per_trade: float = 0.02,
    ) -> None:
        self.agent = agent or TechnicalAnalysisAgent(name="backtest")
        self.portfolio = BacktestPortfolio(initial_capital, risk_per_trade)

    def load_from_csv(self, filepath: str | Path) -> list[Market]:
        """Load OHLCV data from CSV file.

        Expected columns: time (unix), open, high, low, close
        """
        df = pd.read_csv(filepath)

        # Handle different column names
        time_col = "time" if "time" in df.columns else "timestamp"
        if time_col not in df.columns:
            # Try first column
            time_col = df.columns[0]

        markets = []
        for _, row in df.iterrows():
            ts = row[time_col]
            # Convert unix timestamp to datetime
            if isinstance(ts, (int, float)):
                dt = datetime.fromtimestamp(ts, tz=UTC)
            else:
                dt = pd.to_datetime(ts).to_pydatetime().replace(tzinfo=UTC)

            close = float(row["close"])
            markets.append(Market(
                symbol="XAUUSD",
                timeframe="M5",
                timestamp=dt,
                bid=close,
                ask=close + 0.3,  # Approximate spread
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=close,
                volume=float(row.get("volume", 0)),
            ))

        log.info(f"Loaded {len(markets)} candles from {filepath}")
        return markets

    def run(self, market_data: list[Market], start_capital: float = 10000.0) -> BacktestResult:
        """Run backtest on historical data.

        Uses a rolling window of 100 candles for analysis.

        Timing alignment: the agent's ``analyze_with_confirmation`` reads
        ``df.iloc[-2]`` (signal candle) and ``df.iloc[-3]`` (previous candle)
        to detect a Supertrend flip or RSI crossover.  We include candle `i`
        in the window so that ``iloc[-2]`` = candle `i-1` — the last *closed*
        candle before the current one.  The trade then executes at candle `i`
        open, matching live behaviour where a signal at candle close executes
        at the next candle open.
        """
        if len(market_data) < 100:
            log.error(f"Not enough data: {len(market_data)} candles (need 100)")
            return self.portfolio.get_results()

        self.portfolio = BacktestPortfolio(start_capital, self.agent.risk_per_trade_pct / 100)

        for i in range(100, len(market_data)):
            # Include candle i so iloc[-2] = candle i-1 (last closed),
            # iloc[-1] = candle i (current, for indicator calculation only).
            window = market_data[i - 99:i + 1]
            current = market_data[i]

            # Check for exit on current candle before opening new trades
            if self.portfolio._open_trade is not None:
                self.portfolio.check_exit(
                    current.close,
                    current.timestamp,
                    high=current.high,
                    low=current.low,
                )

            # Use sync analyze_with_confirmation (no H1 data in backtest)
            signal = self.agent.analyze_with_confirmation(window, h1_data=None)
            if signal is None:
                continue

            # Open trade at current candle open (next candle after signal)
            success = self.portfolio.open_trade(signal, current.open, current.timestamp)
            if success:
                log.debug(
                    f"[{current.timestamp}] {signal.action.value} "
                    f"@ {current.open:.2f} SL={signal.stop_loss:.2f}"
                )

        # Close any remaining open position at last price
        if self.portfolio._open_trade is not None:
            last = market_data[-1]
            self.portfolio._close_trade(last.close, last.timestamp, "End of Data")

        return self.portfolio.get_results()

    def run_from_csv(self, filepath: str | Path, start_capital: float = 10000.0) -> BacktestResult:
        """Load CSV and run backtest in one step."""
        market_data = self.load_from_csv(filepath)
        return self.run(market_data, start_capital)
