from __future__ import annotations

import logging

from .base import AIProvider
from .consensus import ConsensusValidator, ConsensusResult
from .regime_enhanced import EnhancedRegimeDetector, RegimeResult
from .trade_journal import TradeJournal, JournalEntry
from .risk_advisor import RiskAdvisor, RiskSuggestion

log = logging.getLogger("xmbot.ai.registry")


class AIRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}
        self._preferred: str | None = None
        self._consensus: ConsensusValidator | None = None
        self._regime_detector: EnhancedRegimeDetector | None = None
        self._journal: TradeJournal | None = None
        self._risk_advisor: RiskAdvisor | None = None

    def register(self, name: str, provider: AIProvider) -> None:
        self._providers[name] = provider
        log.info(f"Registered AI provider: {name} ({provider.model})")

    def get(self, name: str) -> AIProvider | None:
        return self._providers.get(name)

    def set_preferred(self, name: str | None) -> None:
        """Set which registered provider `default()` should prefer.

        Pass None to clear the preference and fall back to priority order.
        Raises ValueError if `name` isn't a registered provider.
        """
        if name is not None and name not in self._providers:
            raise ValueError(f"Unknown AI provider: {name}")
        self._preferred = name
        log.info(f"Preferred AI provider set to: {name}")

    @property
    def preferred(self) -> str | None:
        return self._preferred

    def default(self) -> AIProvider | None:
        if self._preferred and self._preferred in self._providers:
            return self._providers[self._preferred]
        for name in ("claude", "gemini", "openai"):
            if name in self._providers:
                return self._providers[name]
        return next(iter(self._providers.values())) if self._providers else None

    @property
    def available(self) -> list[str]:
        return list(self._providers.keys())

    @property
    def consensus(self) -> ConsensusValidator:
        """Get or create consensus validator."""
        if self._consensus is None:
            self._consensus = ConsensusValidator(self)
        return self._consensus

    @property
    def regime_detector(self) -> EnhancedRegimeDetector:
        """Get or create enhanced regime detector."""
        if self._regime_detector is None:
            self._regime_detector = EnhancedRegimeDetector(self.default())
        return self._regime_detector

    @property
    def journal(self) -> TradeJournal:
        """Get or create trade journal."""
        if self._journal is None:
            self._journal = TradeJournal(self.default())
        return self._journal

    @property
    def risk_advisor(self) -> RiskAdvisor:
        """Get or create risk advisor."""
        if self._risk_advisor is None:
            self._risk_advisor = RiskAdvisor(self.default())
        return self._risk_advisor
