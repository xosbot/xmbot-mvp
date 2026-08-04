"""Strategy registry for managing multiple strategies."""
from __future__ import annotations

import importlib
import logging
from pathlib import Path

from .base import Strategy, StrategyConfig, StrategyStatus, StrategyType

log = logging.getLogger("xmbot.strategy.registry")


class StrategyRegistry:
    """Registry for managing trading strategies.

    Handles strategy registration, lifecycle, and discovery.
    """

    def __init__(self) -> None:
        self._strategies: dict[str, Strategy] = {}
        self._strategy_classes: dict[str, type[Strategy]] = {}

    @property
    def strategies(self) -> dict[str, Strategy]:
        return dict(self._strategies)

    @property
    def running(self) -> list[str]:
        return [name for name, s in self._strategies.items() if s.is_running]

    @property
    def available_types(self) -> list[str]:
        return list(self._strategy_classes.keys())

    def register_class(self, name: str, cls: type[Strategy]) -> None:
        """Register a strategy class for later instantiation."""
        self._strategy_classes[name] = cls
        log.info(f"Registered strategy class: {name}")

    def register(self, strategy: Strategy) -> None:
        """Register a strategy instance."""
        if strategy.name in self._strategies:
            raise ValueError(f"Strategy '{strategy.name}' already registered")
        self._strategies[strategy.name] = strategy
        log.info(f"Registered strategy: {strategy.name}")

    def unregister(self, name: str) -> bool:
        """Unregister a strategy."""
        if name in self._strategies:
            strategy = self._strategies[name]
            if strategy.is_running:
                raise RuntimeError(f"Cannot unregister running strategy: {name}")
            del self._strategies[name]
            log.info(f"Unregistered strategy: {name}")
            return True
        return False

    def get(self, name: str) -> Strategy | None:
        """Get a strategy by name."""
        return self._strategies.get(name)

    def create(self, config: StrategyConfig, strategy_type: str | None = None) -> Strategy:
        """Create a new strategy from config."""
        type_name = strategy_type or config.strategy_type.value

        if type_name not in self._strategy_classes:
            raise ValueError(f"Unknown strategy type: {type_name}")

        cls = self._strategy_classes[type_name]
        strategy = cls(config)
        self.register(strategy)
        return strategy

    async def start(self, name: str) -> bool:
        """Start a strategy."""
        strategy = self._strategies.get(name)
        if not strategy:
            raise KeyError(f"Strategy not found: {name}")
        if strategy.is_running:
            return True
        await strategy.on_start()
        return True

    async def stop(self, name: str) -> bool:
        """Stop a strategy."""
        strategy = self._strategies.get(name)
        if not strategy:
            raise KeyError(f"Strategy not found: {name}")
        if not strategy.is_running:
            return True
        await strategy.on_stop()
        return True

    async def pause(self, name: str) -> bool:
        """Pause a strategy."""
        strategy = self._strategies.get(name)
        if not strategy:
            raise KeyError(f"Strategy not found: {name}")
        if strategy.is_running:
            await strategy.on_pause()
        return True

    async def resume(self, name: str) -> bool:
        """Resume a paused strategy."""
        strategy = self._strategies.get(name)
        if not strategy:
            raise KeyError(f"Strategy not found: {name}")
        if strategy.status == StrategyStatus.PAUSED:
            await strategy.on_resume()
        return True

    async def start_all(self) -> int:
        """Start all enabled strategies."""
        count = 0
        for strategy in self._strategies.values():
            if strategy.config.enabled and not strategy.is_running:
                await strategy.on_start()
                count += 1
        return count

    async def stop_all(self) -> int:
        """Stop all running strategies."""
        count = 0
        for strategy in self._strategies.values():
            if strategy.is_running:
                await strategy.on_stop()
                count += 1
        return count

    def get_stats(self) -> dict:
        """Get aggregate statistics for all strategies."""
        total_trades = 0
        total_pnl = 0.0
        winning = 0

        for strategy in self._strategies.values():
            total_trades += strategy.stats.total_trades
            total_pnl += strategy.stats.total_pnl
            winning += strategy.stats.winning_trades

        return {
            "total_strategies": len(self._strategies),
            "running_strategies": len(self.running),
            "total_trades": total_trades,
            "total_pnl": total_pnl,
            "win_rate": (winning / total_trades * 100) if total_trades > 0 else 0,
        }

    def list_strategies(self) -> list[dict]:
        """List all registered strategies with their state."""
        return [s.get_state() for s in self._strategies.values()]


def load_builtin_strategies(registry: StrategyRegistry) -> None:
    """Load all built-in strategy types."""
    from .templates.scalping import ScalpingStrategy
    from .templates.swing import SwingStrategy
    from .templates.mean_reversion import MeanReversionStrategy
    from .templates.momentum import MomentumStrategy

    registry.register_class("scalping", ScalpingStrategy)
    registry.register_class("swing", SwingStrategy)
    registry.register_class("mean_reversion", MeanReversionStrategy)
    registry.register_class("momentum", MomentumStrategy)
