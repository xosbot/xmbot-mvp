from __future__ import annotations

import logging
from collections.abc import Callable

log = logging.getLogger("xmbot.broker")


class BrokerManager:
    """Manages multiple broker connections for different users."""
    
    _instance = None
    _brokers: dict[str, Callable[[], object]] = {}
    _connections: dict[str, dict[str, object]] = {}
    
    @classmethod
    def register_factory(cls, name: str, factory: Callable[[], object]) -> None:
        cls._brokers[name] = factory
    
    @classmethod
    def get_broker(cls, user_id: str, broker_type: str = "binance"):
        key = f"{user_id}:{broker_type}"
        if key not in cls._connections:
            factory = cls._brokers.get(broker_type)
            if factory:
                broker = factory()
                cls._connections[key] = {"broker": broker, "user_id": user_id}
        return cls._connections[key].get("broker")
    
    @classmethod
    def close_all(cls) -> None:
        for key, conn in cls._connections.items():
            broker = conn.get("broker")
            if broker and hasattr(broker, "disconnect"):
                import asyncio
                asyncio.create_task(broker.disconnect())
        cls._connections.clear()