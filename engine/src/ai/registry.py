from __future__ import annotations

import logging
from typing import Optional

from .base import AIProvider


log = logging.getLogger("xmbot.ai.registry")


class AIRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}
        self._preferred: Optional[str] = None

    def register(self, name: str, provider: AIProvider) -> None:
        self._providers[name] = provider
        log.info(f"Registered AI provider: {name} ({provider.model})")

    def get(self, name: str) -> Optional[AIProvider]:
        return self._providers.get(name)

    def set_preferred(self, name: Optional[str]) -> None:
        """Set which registered provider `default()` should prefer.

        Pass None to clear the preference and fall back to priority order.
        Raises ValueError if `name` isn't a registered provider.
        """
        if name is not None and name not in self._providers:
            raise ValueError(f"Unknown AI provider: {name}")
        self._preferred = name
        log.info(f"Preferred AI provider set to: {name}")

    @property
    def preferred(self) -> Optional[str]:
        return self._preferred

    def default(self) -> Optional[AIProvider]:
        if self._preferred and self._preferred in self._providers:
            return self._providers[self._preferred]
        for name in ("claude", "gemini", "openai"):
            if name in self._providers:
                return self._providers[name]
        return next(iter(self._providers.values())) if self._providers else None

    @property
    def available(self) -> list[str]:
        return list(self._providers.keys())
