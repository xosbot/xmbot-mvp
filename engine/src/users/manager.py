from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

log = logging.getLogger("xmbot.users")


class UserTier(Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class UserStatus(Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"


@dataclass
class UserLimits:
    """Resource limits based on subscription tier."""

    max_strategies: int = 3
    max_positions: int = 5
    max_daily_trades: int = 50
    max_api_calls: int = 1000
    max_symbols: int = 10
    max_history_days: int = 30
    risk_per_trade: float = 0.02  # 2% max risk per trade
    max_portfolio_risk: float = 0.10  # 10% max portfolio risk
    websocket_connections: int = 1
    data_retention_days: int = 90


TIER_LIMITS = {
    UserTier.FREE: UserLimits(
        max_strategies=2,
        max_positions=3,
        max_daily_trades=20,
        max_api_calls=500,
        max_symbols=5,
        max_history_days=7,
        risk_per_trade=0.01,
        max_portfolio_risk=0.05,
        websocket_connections=1,
        data_retention_days=30,
    ),
    UserTier.PRO: UserLimits(
        max_strategies=10,
        max_positions=20,
        max_daily_trades=200,
        max_api_calls=5000,
        max_symbols=50,
        max_history_days=90,
        risk_per_trade=0.02,
        max_portfolio_risk=0.10,
        websocket_connections=5,
        data_retention_days=180,
    ),
    UserTier.ENTERPRISE: UserLimits(
        max_strategies=100,
        max_positions=500,
        max_daily_trades=10000,
        max_api_calls=100000,
        max_symbols=500,
        max_history_days=365,
        risk_per_trade=0.05,
        max_portfolio_risk=0.20,
        websocket_connections=50,
        data_retention_days=730,
    ),
}


@dataclass
class UserProfile:
    """User profile with settings and preferences."""

    user_id: str
    email: str
    display_name: str
    tier: UserTier = UserTier.FREE
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    last_login: datetime | None = None
    api_key: str = ""
    settings: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def limits(self) -> UserLimits:
        return TIER_LIMITS[self.tier]

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "email": self.email,
            "display_name": self.display_name,
            "tier": self.tier.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "limits": {
                "max_strategies": self.limits.max_strategies,
                "max_positions": self.limits.max_positions,
                "max_daily_trades": self.limits.max_daily_trades,
                "max_api_calls": self.limits.max_api_calls,
            },
        }


@dataclass
class UserUsage:
    """Track user resource usage."""

    user_id: str
    strategies_count: int = 0
    positions_count: int = 0
    daily_trades: int = 0
    api_calls_today: int = 0
    last_reset: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "strategies_count": self.strategies_count,
            "positions_count": self.positions_count,
            "daily_trades": self.daily_trades,
            "api_calls_today": self.api_calls_today,
            "last_reset": self.last_reset.isoformat(),
        }


class UserManager:
    """Manages user accounts, limits, and isolation."""

    def __init__(self) -> None:
        self._users: dict[str, UserProfile] = {}
        self._usage: dict[str, UserUsage] = {}
        self._api_keys: dict[str, str] = {}  # api_key -> user_id

    def create_user(
        self,
        user_id: str,
        email: str,
        display_name: str,
        tier: UserTier = UserTier.FREE,
    ) -> UserProfile:
        """Create a new user profile."""
        if user_id in self._users:
            raise ValueError(f"User {user_id} already exists")

        profile = UserProfile(
            user_id=user_id,
            email=email,
            display_name=display_name,
            tier=tier,
        )
        self._users[user_id] = profile
        self._usage[user_id] = UserUsage(user_id=user_id)
        log.info(f"Created user: {user_id} (tier={tier.value})")
        return profile

    def get_user(self, user_id: str) -> UserProfile | None:
        """Get user profile by ID."""
        return self._users.get(user_id)

    def get_user_by_api_key(self, api_key: str) -> UserProfile | None:
        """Get user profile by API key."""
        user_id = self._api_keys.get(api_key)
        return self._users.get(user_id) if user_id else None

    def update_user_tier(self, user_id: str, tier: UserTier) -> bool:
        """Update user subscription tier."""
        user = self._users.get(user_id)
        if not user:
            return False

        old_tier = user.tier
        user.tier = tier
        user.updated_at = datetime.now(UTC)
        log.info(f"Updated user {user_id} tier: {old_tier.value} -> {tier.value}")
        return True

    def suspend_user(self, user_id: str) -> bool:
        """Suspend a user account."""
        user = self._users.get(user_id)
        if not user:
            return False

        user.status = UserStatus.SUSPENDED
        user.updated_at = datetime.now(UTC)
        log.warning(f"Suspended user: {user_id}")
        return True

    def reactivate_user(self, user_id: str) -> bool:
        """Reactivate a suspended user."""
        user = self._users.get(user_id)
        if not user:
            return False

        user.status = UserStatus.ACTIVE
        user.updated_at = datetime.now(UTC)
        log.info(f"Reactivated user: {user_id}")
        return True

    def set_api_key(self, user_id: str, api_key: str) -> bool:
        """Set API key for a user."""
        user = self._users.get(user_id)
        if not user:
            return False

        # Remove old key if exists
        if user.api_key:
            self._api_keys.pop(user.api_key, None)

        user.api_key = api_key
        self._api_keys[api_key] = user_id
        log.info(f"Set API key for user: {user_id}")
        return True

    def check_strategy_limit(self, user_id: str) -> tuple[bool, int, int]:
        """Check if user can create more strategies."""
        user = self._users.get(user_id)
        usage = self._usage.get(user_id)
        if not user or not usage:
            return False, 0, 0

        limits = user.limits
        current = usage.strategies_count
        max_allowed = limits.max_strategies

        return current < max_allowed, current, max_allowed

    def check_position_limit(self, user_id: str) -> tuple[bool, int, int]:
        """Check if user can open more positions."""
        user = self._users.get(user_id)
        usage = self._usage.get(user_id)
        if not user or not usage:
            return False, 0, 0

        limits = user.limits
        current = usage.positions_count
        max_allowed = limits.max_positions

        return current < max_allowed, current, max_allowed

    def check_trade_limit(self, user_id: str) -> tuple[bool, int, int]:
        """Check if user can execute more trades today."""
        user = self._users.get(user_id)
        usage = self._usage.get(user_id)
        if not user or not usage:
            return False, 0, 0

        # Reset daily counter if needed
        now = datetime.now(UTC)
        if usage.last_reset.date() < now.date():
            usage.daily_trades = 0
            usage.api_calls_today = 0
            usage.last_reset = now

        limits = user.limits
        current = usage.daily_trades
        max_allowed = limits.max_daily_trades

        return current < max_allowed, current, max_allowed

    def check_api_limit(self, user_id: str) -> tuple[bool, int, int]:
        """Check if user has exceeded API call limit."""
        user = self._users.get(user_id)
        usage = self._usage.get(user_id)
        if not user or not usage:
            return False, 0, 0

        limits = user.limits
        current = usage.api_calls_today
        max_allowed = limits.max_api_calls

        return current < max_allowed, current, max_allowed

    def increment_strategy_count(self, user_id: str) -> bool:
        """Increment strategy count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        can_add, _, _ = self.check_strategy_limit(user_id)
        if not can_add:
            return False

        usage.strategies_count += 1
        return True

    def decrement_strategy_count(self, user_id: str) -> bool:
        """Decrement strategy count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        if usage.strategies_count > 0:
            usage.strategies_count -= 1
            return True
        return False

    def increment_position_count(self, user_id: str) -> bool:
        """Increment position count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        can_add, _, _ = self.check_position_limit(user_id)
        if not can_add:
            return False

        usage.positions_count += 1
        return True

    def decrement_position_count(self, user_id: str) -> bool:
        """Decrement position count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        if usage.positions_count > 0:
            usage.positions_count -= 1
            return True
        return False

    def increment_trade_count(self, user_id: str) -> bool:
        """Increment trade count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        can_trade, _, _ = self.check_trade_limit(user_id)
        if not can_trade:
            return False

        usage.daily_trades += 1
        return True

    def increment_api_calls(self, user_id: str) -> bool:
        """Increment API call count for a user."""
        usage = self._usage.get(user_id)
        if not usage:
            return False

        can_call, _, _ = self.check_api_limit(user_id)
        if not can_call:
            return False

        usage.api_calls_today += 1
        return True

    def get_user_usage(self, user_id: str) -> UserUsage | None:
        """Get user usage statistics."""
        return self._usage.get(user_id)

    def get_all_users(self) -> list[UserProfile]:
        """Get all user profiles."""
        return list(self._users.values())

    def get_users_by_tier(self, tier: UserTier) -> list[UserProfile]:
        """Get all users of a specific tier."""
        return [u for u in self._users.values() if u.tier == tier]

    def get_active_users(self) -> list[UserProfile]:
        """Get all active users."""
        return [u for u in self._users.values() if u.status == UserStatus.ACTIVE]

    def delete_user(self, user_id: str) -> bool:
        """Delete a user account."""
        user = self._users.pop(user_id, None)
        if not user:
            return False

        self._usage.pop(user_id, None)
        if user.api_key:
            self._api_keys.pop(user.api_key, None)

        log.info(f"Deleted user: {user_id}")
        return True

    def get_user_count(self) -> int:
        """Get total number of users."""
        return len(self._users)

    def get_user_count_by_tier(self) -> dict[str, int]:
        """Get user count by tier."""
        counts = {}
        for tier in UserTier:
            counts[tier.value] = len(self.get_users_by_tier(tier))
        return counts


# Global user manager instance
_user_manager: UserManager | None = None


def get_user_manager() -> UserManager:
    """Get the global user manager instance."""
    global _user_manager
    if _user_manager is None:
        _user_manager = UserManager()
    return _user_manager
