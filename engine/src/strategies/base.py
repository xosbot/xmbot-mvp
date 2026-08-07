"""Base strategy class and strategy registry."""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from ..core.types import Market, Signal

log = logging.getLogger("xmbot.strategy")


class StrategyStatus(Enum):
    """Strategy lifecycle status."""
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"
    ERROR = "ERROR"


class StrategyType(Enum):
    """Strategy type classification."""
    SCALPING = "scalping"
    SWING = "swing"
    MEAN_REVERSION = "mean_reversion"
    MOMENTUM = "momentum"
    BREAKOUT = "breakout"
    CUSTOM = "custom"


@dataclass
class StrategyConfig:
    """Configuration for a trading strategy."""
    name: str
    strategy_type: StrategyType = StrategyType.CUSTOM
    enabled: bool = True
    symbols: list[str] = field(default_factory=lambda: ["XAUUSD"])
    timeframe: str = "M5"
    max_positions: int = 3
    risk_per_trade_pct: float = 2.0
    max_daily_trades: int = 10
    params: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class StrategyStats:
    """Performance statistics for a strategy."""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_pnl: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    win_rate: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    profit_factor: float = 0.0
    last_trade_time: datetime | None = None
    start_time: datetime | None = None

    def update_win_rate(self) -> None:
        if self.total_trades > 0:
            self.win_rate = (self.winning_trades / self.total_trades) * 100

    def update_profit_factor(self) -> None:
        if self.losing_trades > 0 and self.avg_loss != 0:
            self.profit_factor = abs(self.avg_win * self.winning_trades) / abs(self.avg_loss * self.losing_trades)


class Strategy(ABC):
    """Base class for all trading strategies.

    Strategies implement specific trading logic and produce signals
    based on market data analysis.
    """

    def __init__(self, config: StrategyConfig) -> None:
        self.config = config
        self.status = StrategyStatus.CREATED
        self.stats = StrategyStats()
        self._error_count = 0
        self._last_signal: Signal | None = None

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def is_running(self) -> bool:
        return self.status == StrategyStatus.RUNNING

    @abstractmethod
    async def analyze(self, market_data: list[Market]) -> Signal | None:
        """Analyze market data and produce a trading signal.

        Returns:
            Signal if a trading opportunity is identified, None otherwise.
        """
        ...

    async def on_start(self) -> None:
        """Called when the strategy is started."""
        self.status = StrategyStatus.RUNNING
        self.stats.start_time = datetime.now(UTC)
        log.info(f"Strategy {self.name} started")

    async def on_stop(self) -> None:
        """Called when the strategy is stopped."""
        self.status = StrategyStatus.STOPPED
        log.info(f"Strategy {self.name} stopped")

    async def on_pause(self) -> None:
        """Called when the strategy is paused."""
        self.status = StrategyStatus.PAUSED
        log.info(f"Strategy {self.name} paused")

    async def on_resume(self) -> None:
        """Called when the strategy is resumed."""
        self.status = StrategyStatus.RUNNING
        log.info(f"Strategy {self.name} resumed")

    async def on_error(self, error: Exception) -> None:
        """Called when an error occurs."""
        self._error_count += 1
        log.error(f"Strategy {self.name} error: {error}")
        if self._error_count > 5:
            self.status = StrategyStatus.ERROR

    def record_trade(self, pnl: float) -> None:
        """Record a completed trade for performance tracking."""
        self.stats.total_trades += 1
        self.stats.total_pnl += pnl
        self.stats.last_trade_time = datetime.now(UTC)

        if pnl > 0:
            self.stats.winning_trades += 1
            self.stats.avg_win = (
                (self.stats.avg_win * (self.stats.winning_trades - 1) + pnl)
                / self.stats.winning_trades
            )
        else:
            self.stats.losing_trades += 1
            self.stats.avg_loss = (
                (self.stats.avg_loss * (self.stats.losing_trades - 1) + pnl)
                / self.stats.losing_trades
            )

        self.stats.update_win_rate()
        self.stats.update_profit_factor()

    def update_params(self, **kwargs) -> dict:
        """Update strategy parameters at runtime."""
        applied = {}
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
                applied[key] = value
            elif key in self.config.params:
                self.config.params[key] = value
                applied[key] = value
            else:
                raise ValueError(f"Unknown parameter: {key}")
        return applied

    def get_state(self) -> dict:
        """Get strategy state for serialization."""
        return {
            "name": self.name,
            "type": self.config.strategy_type.value,
            "status": self.status.value,
            "enabled": self.config.enabled,
            "symbols": self.config.symbols,
            "timeframe": self.config.timeframe,
            "params": self.config.params,
            "stats": {
                "total_trades": self.stats.total_trades,
                "winning_trades": self.stats.winning_trades,
                "losing_trades": self.stats.losing_trades,
                "total_pnl": self.stats.total_pnl,
                "win_rate": self.stats.win_rate,
                "profit_factor": self.stats.profit_factor,
            },
        }
