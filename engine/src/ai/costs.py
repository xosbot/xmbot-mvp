"""AI cost controls and rate limiting."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Optional


log = logging.getLogger("xmbot.ai.costs")


@dataclass
class AIBudget:
    """Monthly AI budget configuration."""
    max_monthly_tokens: int = 500_000  # ~$1.50 with Gemini Flash
    max_daily_tokens: int = 50_000
    max_tokens_per_request: int = 2000
    warning_threshold: float = 0.8  # Warn at 80% usage


@dataclass
class AICostTracker:
    """Track AI usage and costs."""
    monthly_tokens: int = 0
    daily_tokens: int = 0
    request_count: int = 0
    last_reset: float = field(default_factory=time.time)
    last_daily_reset: float = field(default_factory=time.time)

    # Cost per 1M tokens (approximate)
    COSTS: dict[str, float] = {
        "gemini-2.5-flash": 0.075,
        "claude-sonnet-4-20250514": 3.0,
        "gpt-4o-mini": 0.15,
    }


class AICostController:
    """Control AI usage costs with rate limiting and budget enforcement."""

    def __init__(self, budget: Optional[AIBudget] = None) -> None:
        self.budget = budget or AIBudget()
        self.tracker = AICostTracker()
        self._last_request_time: float = 0
        self._min_interval: float = 1.0  # Minimum 1 second between requests

    def can_make_request(self, estimated_tokens: int = 500) -> tuple[bool, str]:
        """Check if a request can be made within budget."""
        now = time.time()

        # Check monthly budget
        if self.tracker.monthly_tokens + estimated_tokens > self.budget.max_monthly_tokens:
            return False, "Monthly token budget exceeded"

        # Check daily budget
        if self.tracker.daily_tokens + estimated_tokens > self.budget.max_daily_tokens:
            return False, "Daily token budget exceeded"

        # Check rate limiting
        elapsed = now - self._last_request_time
        if elapsed < self._min_interval:
            return False, f"Rate limited: wait {self._min_interval - elapsed:.1f}s"

        # Check per-request limit
        if estimated_tokens > self.budget.max_tokens_per_request:
            return False, f"Request too large: {estimated_tokens} > {self.budget.max_tokens_per_request}"

        return True, "OK"

    def record_usage(self, tokens: int, model: str = "unknown") -> None:
        """Record token usage."""
        self.tracker.monthly_tokens += tokens
        self.tracker.daily_tokens += tokens
        self.tracker.request_count += 1
        self._last_request_time = time.time()

        # Log cost estimate
        cost_per_million = self.tracker.COSTS.get(model, 1.0)
        estimated_cost = (tokens / 1_000_000) * cost_per_million
        log.debug(f"AI usage: {tokens} tokens (${estimated_cost:.4f}) [{model}]")

        # Check warnings
        self._check_warnings()

    def _check_warnings(self) -> None:
        """Check if usage is approaching limits."""
        monthly_pct = self.tracker.monthly_tokens / self.budget.max_monthly_tokens
        daily_pct = self.tracker.daily_tokens / self.budget.max_daily_tokens

        if monthly_pct >= self.budget.warning_threshold:
            log.warning(f"AI monthly budget at {monthly_pct:.0%}")

        if daily_pct >= self.budget.warning_threshold:
            log.warning(f"AI daily budget at {daily_pct:.0%}")

    def reset_monthly(self) -> None:
        """Reset monthly counters."""
        self.tracker.monthly_tokens = 0
        log.info("AI monthly budget reset")

    def reset_daily(self) -> None:
        """Reset daily counters."""
        self.tracker.daily_tokens = 0
        log.info("AI daily budget reset")

    def get_status(self) -> dict:
        """Get current cost status."""
        return {
            "monthly_tokens": self.tracker.monthly_tokens,
            "monthly_limit": self.budget.max_monthly_tokens,
            "monthly_usage_pct": self.tracker.monthly_tokens / self.budget.max_monthly_tokens * 100,
            "daily_tokens": self.tracker.daily_tokens,
            "daily_limit": self.budget.max_daily_tokens,
            "daily_usage_pct": self.tracker.daily_tokens / self.budget.max_daily_tokens * 100,
            "request_count": self.tracker.request_count,
        }

    def estimate_monthly_cost(self, model: str = "gemini-2.5-flash") -> float:
        """Estimate monthly cost based on current usage."""
        cost_per_million = self.tracker.COSTS.get(model, 1.0)
        return (self.tracker.monthly_tokens / 1_000_000) * cost_per_million
