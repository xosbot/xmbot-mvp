from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import Callable

from .types import Signal, SignalDecision

log = logging.getLogger("xmbot.signal_bus")

SignalHandler = Callable[[Signal], None]
DecisionHandler = Callable[[str, SignalDecision], None]


class SignalBus:
    def __init__(self) -> None:
        self._signal_handlers: dict[str, list[SignalHandler]] = {}
        self._decision_handlers: dict[str, list[DecisionHandler]] = {}

    def subscribe_signals(self, agent_name: str, handler: SignalHandler) -> None:
        self._signal_handlers.setdefault(agent_name, []).append(handler)

    def subscribe_decisions(self, agent_name: str, handler: DecisionHandler) -> None:
        self._decision_handlers.setdefault(agent_name, []).append(handler)

    async def emit_signal(self, signal: Signal) -> None:
        if not signal.id:
            signal.id = str(uuid.uuid4())

        log.info(f"Signal: {signal.action} {signal.market} @ {signal.entry_price} (agent={signal.agent})")

        handlers = self._signal_handlers.get(signal.agent, [])
        for handler in handlers:
            try:
                result = handler(signal)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                log.error(f"Signal handler error: {e}")

    async def emit_decision(self, agent_name: str, signal_id: str, decision: SignalDecision) -> None:
        log.info(f"Decision for {signal_id}: {decision} (agent={agent_name})")

        handlers = self._decision_handlers.get(agent_name, [])
        for handler in handlers:
            try:
                result = handler(signal_id, decision)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                log.error(f"Decision handler error: {e}")

    def unsubscribe(self, agent_name: str) -> None:
        self._signal_handlers.pop(agent_name, None)
        self._decision_handlers.pop(agent_name, None)
