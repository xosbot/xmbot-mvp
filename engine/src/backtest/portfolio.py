"""Portfolio tracking for backtesting."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

from ..core.types import Signal, SignalAction

log = logging.getLogger("xmbot.backtest")


@dataclass
class BacktestTrade:
    signal: Signal
    entry_time: datetime
    entry_price: float
    exit_time: datetime | None = None
    exit_price: float | None = None
    volume: float = 0.1
    pnl: float = 0.0
    exit_reason: str = ""

    @property
    def is_open(self) -> bool:
        return self.exit_time is None

    @property
    def hold_duration(self) -> timedelta | None:
        if self.exit_time and self.entry_time:
            return self.exit_time - self.entry_time
        return None


@dataclass
class BacktestResult:
    trades: list[BacktestTrade]
    initial_capital: float
    final_capital: float
    peak_capital: float

    @property
    def total_trades(self) -> int:
        return len(self.trades)

    @property
    def winning_trades(self) -> int:
        return sum(1 for t in self.trades if t.pnl > 0)

    @property
    def losing_trades(self) -> int:
        return sum(1 for t in self.trades if t.pnl < 0)

    @property
    def win_rate(self) -> float:
        if self.total_trades == 0:
            return 0.0
        return self.winning_trades / self.total_trades * 100

    @property
    def total_pnl(self) -> float:
        return sum(t.pnl for t in self.trades)

    @property
    def total_return_pct(self) -> float:
        if self.initial_capital == 0:
            return 0.0
        return (self.total_pnl / self.initial_capital) * 100

    @property
    def max_drawdown_pct(self) -> float:
        if self.peak_capital == 0:
            return 0.0
        return ((self.peak_capital - self.final_capital) / self.peak_capital) * 100

    @property
    def profit_factor(self) -> float:
        gross_profit = sum(t.pnl for t in self.trades if t.pnl > 0)
        gross_loss = abs(sum(t.pnl for t in self.trades if t.pnl < 0))
        if gross_loss == 0:
            return float("inf") if gross_profit > 0 else 0.0
        return gross_profit / gross_loss

    @property
    def avg_win(self) -> float:
        wins = [t.pnl for t in self.trades if t.pnl > 0]
        return sum(wins) / len(wins) if wins else 0.0

    @property
    def avg_loss(self) -> float:
        losses = [t.pnl for t in self.trades if t.pnl < 0]
        return sum(losses) / len(losses) if losses else 0.0

    @property
    def expectancy(self) -> float:
        if self.total_trades == 0:
            return 0.0
        return self.total_pnl / self.total_trades

    def summary(self) -> str:
        return (
            f"=== Backtest Results ===\n"
            f"Total Trades: {self.total_trades}\n"
            f"Win Rate: {self.win_rate:.1f}%\n"
            f"Winning: {self.winning_trades} | Losing: {self.losing_trades}\n"
            f"Total PnL: ${self.total_pnl:+.2f}\n"
            f"Return: {self.total_return_pct:+.1f}%\n"
            f"Profit Factor: {self.profit_factor:.2f}\n"
            f"Avg Win: ${self.avg_win:+.2f} | Avg Loss: ${self.avg_loss:+.2f}\n"
            f"Expectancy: ${self.expectancy:+.2f}/trade\n"
            f"Max Drawdown: {self.max_drawdown_pct:.1f}%\n"
            f"Capital: ${self.initial_capital:.2f} -> ${self.final_capital:.2f}"
        )


class BacktestPortfolio:
    """Track portfolio state during backtesting."""

    def __init__(self, initial_capital: float = 10000.0, risk_per_trade: float = 0.02) -> None:
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.peak_capital = initial_capital
        self.risk_per_trade = risk_per_trade
        self.trades: list[BacktestTrade] = []
        self._open_trade: BacktestTrade | None = None
        self._position_size: float = 0.0

    def open_trade(self, signal: Signal, timestamp: datetime) -> bool:
        """Open a new trade from a signal."""
        if self._open_trade is not None:
            return False  # Already in a trade

        risk_amount = self.capital * self.risk_per_trade
        price_risk = abs(signal.entry_price - signal.stop_loss)
        if price_risk <= 0:
            return False

        # For XAUUSD: 1 lot = 100 oz
        volume = risk_amount / (price_risk * 100)
        volume = max(0.01, round(volume, 2))

        self._open_trade = BacktestTrade(
            signal=signal,
            entry_time=timestamp,
            entry_price=signal.entry_price,
            volume=volume,
        )
        self._position_size = volume
        return True

    def check_exit(self, current_price: float, timestamp: datetime, high: float = 0, low: float = 0) -> bool:
        """Check if current position should be closed (SL/TP hit)."""
        if self._open_trade is None:
            return False

        trade = self._open_trade
        signal = trade.signal

        if signal.action == SignalAction.BUY:
            if signal.stop_loss > 0 and low <= signal.stop_loss:
                self._close_trade(signal.stop_loss, timestamp, "Stop Loss")
                return True
            if signal.take_profit and high >= signal.take_profit:
                self._close_trade(signal.take_profit, timestamp, "Take Profit")
                return True
        else:  # SELL
            if signal.stop_loss > 0 and high >= signal.stop_loss:
                self._close_trade(signal.stop_loss, timestamp, "Stop Loss")
                return True
            if signal.take_profit and low <= signal.take_profit:
                self._close_trade(signal.take_profit, timestamp, "Take Profit")
                return True

        return False

    def _close_trade(self, exit_price: float, timestamp: datetime, reason: str) -> None:
        trade = self._open_trade
        if trade is None:
            return

        trade.exit_price = exit_price
        trade.exit_time = timestamp
        trade.exit_reason = reason

        if trade.signal.action == SignalAction.BUY:
            trade.pnl = (exit_price - trade.entry_price) * trade.volume * 100
        else:
            trade.pnl = (trade.entry_price - exit_price) * trade.volume * 100

        self.capital += trade.pnl
        self.peak_capital = max(self.peak_capital, self.capital)
        self.trades.append(trade)
        self._open_trade = None
        self._position_size = 0.0

    def get_results(self) -> BacktestResult:
        return BacktestResult(
            trades=self.trades,
            initial_capital=self.initial_capital,
            final_capital=self.capital,
            peak_capital=self.peak_capital,
        )
