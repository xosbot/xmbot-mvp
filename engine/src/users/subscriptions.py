from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any

from .manager import UserTier

log = logging.getLogger("xmbot.subscriptions")


class SubscriptionStatus(Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"


class PaymentMethod(Enum):
    CREDIT_CARD = "credit_card"
    CRYPTO = "crypto"
    BANK_TRANSFER = "bank_transfer"
    FREE = "free"


@dataclass
class SubscriptionPlan:
    """Defines a subscription plan with pricing and features."""

    plan_id: str
    name: str
    tier: UserTier
    price_monthly: float
    price_yearly: float
    features: list[str] = field(default_factory=list)
    trial_days: int = 0
    is_popular: bool = False

    def to_dict(self) -> dict:
        return {
            "plan_id": self.plan_id,
            "name": self.name,
            "tier": self.tier.value,
            "price_monthly": self.price_monthly,
            "price_yearly": self.price_yearly,
            "features": self.features,
            "trial_days": self.trial_days,
            "is_popular": self.is_popular,
        }


# Predefined plans
PLANS = {
    "free": SubscriptionPlan(
        plan_id="free",
        name="Free",
        tier=UserTier.FREE,
        price_monthly=0,
        price_yearly=0,
        features=[
            "2 trading strategies",
            "3 max positions",
            "20 daily trades",
            "Basic indicators",
            "7-day history",
        ],
        trial_days=0,
    ),
    "pro_monthly": SubscriptionPlan(
        plan_id="pro_monthly",
        name="Pro Monthly",
        tier=UserTier.PRO,
        price_monthly=49.99,
        price_yearly=499.99,
        features=[
            "10 trading strategies",
            "20 max positions",
            "200 daily trades",
            "Advanced indicators",
            "AI signal validation",
            "90-day history",
            "Priority support",
        ],
        trial_days=7,
        is_popular=True,
    ),
    "pro_yearly": SubscriptionPlan(
        plan_id="pro_yearly",
        name="Pro Yearly",
        tier=UserTier.PRO,
        price_monthly=0,
        price_yearly=499.99,
        features=[
            "10 trading strategies",
            "20 max positions",
            "200 daily trades",
            "Advanced indicators",
            "AI signal validation",
            "90-day history",
            "Priority support",
        ],
        trial_days=7,
    ),
    "enterprise_monthly": SubscriptionPlan(
        plan_id="enterprise_monthly",
        name="Enterprise Monthly",
        tier=UserTier.ENTERPRISE,
        price_monthly=199.99,
        price_yearly=1999.99,
        features=[
            "100 trading strategies",
            "500 max positions",
            "10,000 daily trades",
            "All indicators",
            "AI signal validation",
            "365-day history",
            "Dedicated support",
            "Custom integrations",
            "White-label options",
        ],
        trial_days=14,
    ),
    "enterprise_yearly": SubscriptionPlan(
        plan_id="enterprise_yearly",
        name="Enterprise Yearly",
        tier=UserTier.ENTERPRISE,
        price_monthly=0,
        price_yearly=1999.99,
        features=[
            "100 trading strategies",
            "500 max positions",
            "10,000 daily trades",
            "All indicators",
            "AI signal validation",
            "365-day history",
            "Dedicated support",
            "Custom integrations",
            "White-label options",
        ],
        trial_days=14,
    ),
}


@dataclass
class Subscription:
    """User subscription record."""

    subscription_id: str
    user_id: str
    plan_id: str
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    payment_method: PaymentMethod = PaymentMethod.FREE
    current_period_start: datetime = field(default_factory=lambda: datetime.now(UTC))
    current_period_end: datetime = field(default_factory=lambda: datetime.now(UTC))
    canceled_at: datetime | None = None
    trial_start: datetime | None = None
    trial_end: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def plan(self) -> SubscriptionPlan | None:
        return PLANS.get(self.plan_id)

    @property
    def is_active(self) -> bool:
        return self.status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING)

    @property
    def is_trialing(self) -> bool:
        return self.status == SubscriptionStatus.TRIALING

    @property
    def days_until_renewal(self) -> int:
        now = datetime.now(UTC)
        if self.current_period_end > now:
            return (self.current_period_end - now).days
        return 0

    def to_dict(self) -> dict:
        return {
            "subscription_id": self.subscription_id,
            "user_id": self.user_id,
            "plan_id": self.plan_id,
            "status": self.status.value,
            "payment_method": self.payment_method.value,
            "current_period_start": self.current_period_start.isoformat(),
            "current_period_end": self.current_period_end.isoformat(),
            "canceled_at": self.canceled_at.isoformat() if self.canceled_at else None,
            "trial_start": self.trial_start.isoformat() if self.trial_start else None,
            "trial_end": self.trial_end.isoformat() if self.trial_end else None,
            "is_active": self.is_active,
            "days_until_renewal": self.days_until_renewal,
        }


class SubscriptionManager:
    """Manages user subscriptions and billing."""

    def __init__(self) -> None:
        self._subscriptions: dict[str, Subscription] = {}  # subscription_id -> Subscription
        self._user_subscriptions: dict[str, str] = {}  # user_id -> subscription_id

    def create_subscription(
        self,
        user_id: str,
        plan_id: str,
        payment_method: PaymentMethod = PaymentMethod.FREE,
        start_trial: bool = False,
    ) -> Subscription | None:
        """Create a new subscription for a user."""
        plan = PLANS.get(plan_id)
        if not plan:
            log.error(f"Invalid plan: {plan_id}")
            return None

        # Check if user already has a subscription
        if user_id in self._user_subscriptions:
            log.warning(f"User {user_id} already has a subscription")
            return None

        subscription_id = f"sub_{user_id}_{plan_id}"
        now = datetime.now(UTC)

        # Calculate period end
        if plan.price_yearly > 0 and plan.price_monthly == 0:
            from datetime import timedelta
            period_end = now + timedelta(days=365)
        elif plan.price_monthly > 0:
            from datetime import timedelta
            period_end = now + timedelta(days=30)
        else:
            from datetime import timedelta
            period_end = now + timedelta(days=365)  # Free tier

        subscription = Subscription(
            subscription_id=subscription_id,
            user_id=user_id,
            plan_id=plan_id,
            status=SubscriptionStatus.ACTIVE,
            payment_method=payment_method,
            current_period_start=now,
            current_period_end=period_end,
        )

        # Start trial if requested
        if start_trial and plan.trial_days > 0:
            from datetime import timedelta
            subscription.status = SubscriptionStatus.TRIALING
            subscription.trial_start = now
            subscription.trial_end = now + timedelta(days=plan.trial_days)

        self._subscriptions[subscription_id] = subscription
        self._user_subscriptions[user_id] = subscription_id

        log.info(f"Created subscription: {subscription_id} for user {user_id}")
        return subscription

    def get_subscription(self, subscription_id: str) -> Subscription | None:
        """Get subscription by ID."""
        return self._subscriptions.get(subscription_id)

    def get_user_subscription(self, user_id: str) -> Subscription | None:
        """Get subscription for a user."""
        subscription_id = self._user_subscriptions.get(user_id)
        return self._subscriptions.get(subscription_id) if subscription_id else None

    def cancel_subscription(self, user_id: str) -> bool:
        """Cancel a user's subscription."""
        subscription = self.get_user_subscription(user_id)
        if not subscription:
            return False

        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = datetime.now(UTC)
        log.info(f"Canceled subscription for user: {user_id}")
        return True

    def upgrade_subscription(self, user_id: str, new_plan_id: str) -> bool:
        """Upgrade a user's subscription plan."""
        subscription = self.get_user_subscription(user_id)
        if not subscription:
            return False

        new_plan = PLANS.get(new_plan_id)
        if not new_plan:
            return False

        old_plan_id = subscription.plan_id
        subscription.plan_id = new_plan_id
        log.info(f"Upgraded user {user_id} from {old_plan_id} to {new_plan_id}")
        return True

    def is_subscription_active(self, user_id: str) -> bool:
        """Check if a user has an active subscription."""
        subscription = self.get_user_subscription(user_id)
        return subscription.is_active if subscription else False

    def get_all_subscriptions(self) -> list[Subscription]:
        """Get all subscriptions."""
        return list(self._subscriptions.values())

    def get_subscriptions_by_status(self, status: SubscriptionStatus) -> list[Subscription]:
        """Get all subscriptions with a specific status."""
        return [s for s in self._subscriptions.values() if s.status == status]

    def get_subscription_count(self) -> int:
        """Get total number of subscriptions."""
        return len(self._subscriptions)

    def get_revenue_metrics(self) -> dict:
        """Calculate revenue metrics."""
        active = self.get_subscriptions_by_status(SubscriptionStatus.ACTIVE)
        monthly_revenue = 0
        yearly_revenue = 0

        for sub in active:
            plan = sub.plan
            if plan:
                if plan.price_monthly > 0:
                    monthly_revenue += plan.price_monthly
                elif plan.price_yearly > 0:
                    yearly_revenue += plan.price_yearly

        return {
            "active_subscriptions": len(active),
            "monthly_recurring_revenue": monthly_revenue,
            "yearly_recurring_revenue": yearly_revenue,
            "total_revenue": monthly_revenue + yearly_revenue,
        }


# Global subscription manager instance
_subscription_manager: SubscriptionManager | None = None


def get_subscription_manager() -> SubscriptionManager:
    """Get the global subscription manager instance."""
    global _subscription_manager
    if _subscription_manager is None:
        _subscription_manager = SubscriptionManager()
    return _subscription_manager
