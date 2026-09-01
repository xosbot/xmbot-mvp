from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from enum import Enum

from ..core.types import (
    AccountInfo,
    BrokerExecution,
    BrokerOrderSnapshot,
    Market,
    Order,
    OrderResult,
    Position,
    PriceTick,
)


class BrokerCapabilityNotSupported(NotImplementedError):
    """Raised when safe lookup/recovery is unavailable for a broker adapter."""


class BrokerStatus(Enum):
    DISCONNECTED = "DISCONNECTED"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    ERROR = "ERROR"


log = logging.getLogger("xmbot.broker")


class Broker(ABC):
    def __init__(self, name: str) -> None:
        self.name = name
        self.status = BrokerStatus.DISCONNECTED

    @property
    def supports_idempotent_execution(self) -> bool:
        return False

    @abstractmethod
    async def connect(self) -> bool:
        ...

    @abstractmethod
    async def disconnect(self) -> bool:
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        ...

    @abstractmethod
    async def place_order(self, order: Order) -> OrderResult:
        ...

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        ...

    @abstractmethod
    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        ...

    @abstractmethod
    async def get_positions(self) -> list[Position]:
        ...

    @abstractmethod
    async def get_account(self) -> AccountInfo | None:
        ...

    @abstractmethod
    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        ...

    @abstractmethod
    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        ...
        yield  # marker for async generator

    async def health_check(self) -> bool:
        return await self.is_connected()

    async def reconnect(self) -> bool:
        log.warning(f"[{self.name}] Reconnecting...")
        await self.disconnect()
        return await self.connect()

    async def get_order_by_client_id(
        self, client_order_id: str, symbol: str | None = None
    ) -> BrokerOrderSnapshot | None:
        raise BrokerCapabilityNotSupported(f"{self.name} cannot look up orders by client ID")

    async def get_order(
        self, broker_order_id: str, symbol: str | None = None
    ) -> BrokerOrderSnapshot | None:
        raise BrokerCapabilityNotSupported(f"{self.name} cannot look up orders")

    async def get_executions(
        self,
        *,
        broker_order_id: str | None = None,
        client_order_id: str | None = None,
        symbol: str | None = None,
        since=None,
    ) -> list[BrokerExecution]:
        raise BrokerCapabilityNotSupported(f"{self.name} cannot retrieve executions")
