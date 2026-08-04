from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime

from ..core.types import Signal, SignalDecision


@dataclass
class GateDecision:
    signal_id: str
    decision: SignalDecision
    user_id: str
    modified_price: float | None = None
    modified_stop_loss: float | None = None
    modified_take_profit: float | None = None
    reason: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


log = logging.getLogger("xmbot.gate")


class HumanGate:
    def __init__(
        self,
        signal_timeout: int = 300,
        notify_callback=None,
    ) -> None:
        self._signal_timeout = signal_timeout
        self._pending: dict[str, asyncio.Future[GateDecision]] = {}
        self._notify = notify_callback

    async def submit(
        self,
        signal: Signal,
        user_message: str = "",
        buttons: list | None = None,
    ) -> GateDecision:
        decision = GateDecision(
            signal_id=signal.id,
            decision=SignalDecision.PENDING,
            user_id=signal.user_id,
        )

        loop = asyncio.get_event_loop()
        future = loop.create_future()
        self._pending[signal.id] = future

        if self._notify:
            await self._notify(signal, user_message)

        try:
            result = await asyncio.wait_for(future, timeout=self._signal_timeout)
            return result
        except TimeoutError:
            decision.decision = SignalDecision.TIMEOUT
            decision.reason = "User did not respond in time"
            return decision
        finally:
            self._pending.pop(signal.id, None)

    async def resolve(
        self,
        signal_id: str,
        decision: SignalDecision,
        **kwargs,
    ) -> bool:
        future = self._pending.get(signal_id)
        if not future or future.done():
            return False

        result = GateDecision(
            signal_id=signal_id,
            decision=decision,
            user_id="",
            **kwargs,
        )
        future.set_result(result)
        return True

    @property
    def pending_count(self) -> int:
        return len(self._pending)

    async def cancel_all(self) -> None:
        for signal_id, future in self._pending.items():
            if not future.done():
                decision = GateDecision(
                    signal_id=signal_id,
                    decision=SignalDecision.TIMEOUT,
                    user_id="",
                    reason="Gate shutting down",
                )
                future.set_result(decision)
        self._pending.clear()
