from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from enum import Enum

from ..core.types import AgentConfig, Market, Signal, SignalAction


class AgentStatus(Enum):
    IDLE = "IDLE"
    ANALYZING = "ANALYZING"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    ERROR = "ERROR"
    STOPPED = "STOPPED"


log = logging.getLogger("xmbot.agent")


class Agent(ABC):
    def __init__(self, config: AgentConfig) -> None:
        self.config = config
        self.status = AgentStatus.IDLE
        self._error_count = 0

    @property
    def name(self) -> str:
        return self.config.name

    @abstractmethod
    async def analyze(self, market_data: list[Market]) -> Signal | None:
        ...

    async def on_signal_approved(self, signal: Signal) -> None:
        log.info(f"[{self.name}] Signal approved: {signal.action} {signal.market}")

    async def on_signal_rejected(self, signal: Signal) -> None:
        log.info(f"[{self.name}] Signal rejected: {signal.action} {signal.market}")

    async def on_signal_timeout(self, signal: Signal) -> None:
        log.info(f"[{self.name}] Signal timed out: {signal.action} {signal.market}")

    async def on_error(self, error: Exception) -> None:
        self._error_count += 1
        log.error(f"[{self.name}] Error: {error}")
        if self._error_count > 10:
            self.status = AgentStatus.ERROR

    async def on_start(self) -> None:
        log.info(f"[{self.name}] Agent started")

    async def on_stop(self) -> None:
        log.info(f"[{self.name}] Agent stopped")

    def validate_signal(self, signal: Signal) -> bool:
        if signal.confidence < self.config.confidence_threshold:
            return False
        if signal.entry_price <= 0:
            return False
        if signal.stop_loss <= 0:
            return False
        if signal.action in (SignalAction.BUY, SignalAction.SELL):
            risk = signal.risk_percent
            if risk > 5.0:
                return False
        return True
