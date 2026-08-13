"""Adapter that wraps a Strategy as an Agent for the engine loop."""
from __future__ import annotations

import logging
import uuid

from ..agents.base import Agent, AgentStatus
from ..core.types import AgentConfig, Market, Signal
from ..strategies.base import Strategy

log = logging.getLogger("xmbot.strategy_agent")


class StrategyAgent(Agent):
    """Wraps a Strategy subclass so it can run in the engine's agent loop.

    The engine only knows about Agents. This adapter delegates analyze()
    to the wrapped Strategy, and propagates lifecycle callbacks.
    """

    def __init__(self, strategy: Strategy, agent_config: AgentConfig | None = None) -> None:
        config = agent_config or AgentConfig(
            name=strategy.name,
            markets=strategy.config.symbols,
            timeframe=strategy.config.timeframe,
            confidence_threshold=0.6,
            max_daily_trades=strategy.config.max_daily_trades,
        )
        super().__init__(config)
        self.strategy = strategy

    async def analyze(self, market_data: list[Market]) -> Signal | None:
        signal = await self.strategy.analyze(market_data)
        if signal and not signal.id:
            signal.id = str(uuid.uuid4())
        if signal and not signal.agent:
            signal.agent = self.name
        return signal

    async def on_start(self) -> None:
        await self.strategy.on_start()
        log.info(f"StrategyAgent {self.name} started (strategy: {self.strategy.config.strategy_type.value})")

    async def on_stop(self) -> None:
        await self.strategy.on_stop()
        log.info(f"StrategyAgent {self.name} stopped")

    async def on_error(self, error: Exception) -> None:
        await self.strategy.on_error(error)
        if self.strategy.status.value == "ERROR":
            self.status = AgentStatus.ERROR
        await super().on_error(error)

    def update_params(self, **kwargs) -> dict:
        return self.strategy.update_params(**kwargs)
