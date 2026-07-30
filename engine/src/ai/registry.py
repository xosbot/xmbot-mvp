from __future__ import annotations

import logging
from typing import Optional

from .base import AIProvider


log = logging.getLogger("xmbot.ai.registry")


class AIRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}

    def register(self, name: str, provider: AIProvider) -> None:
        self._providers[name] = provider
        log.info(f"Registered AI provider: {name} ({provider.model})")

    def get(self, name: str) -> Optional[AIProvider]:
        return self._providers.get(name)

    def default(self) -> Optional[AIProvider]:
        for name in ("claude", "gemini", "openai"):
            if name in self._providers:
                return self._providers[name]
        return next(iter(self._providers.values())) if self._providers else None

    @property
    def available(self) -> list[str]:
        return list(self._providers.keys())
