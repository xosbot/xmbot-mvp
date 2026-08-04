import enum
from datetime import UTC, datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .session import Base


class TradeStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    telegram_chat_id = Column(String(100))
    binance_api_key = Column(String(255))
    binance_api_secret = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    trades = relationship("Trade", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(50), nullable=False)
    action = Column(String(10), nullable=False)
    volume = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    pnl = Column(Float, default=0.0)
    status = Column(String(20), default=TradeStatus.OPEN)
    signal_id = Column(String(100))
    agent = Column(String(100))
    reason = Column(Text)
    opened_at = Column(DateTime, default=lambda: datetime.now(UTC))
    closed_at = Column(DateTime)

    user = relationship("User", back_populates="trades")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default=SubscriptionStatus.ACTIVE)
    starts_at = Column(DateTime, default=lambda: datetime.now(UTC))
    expires_at = Column(DateTime)
    payment_id = Column(String(255))

    user = relationship("User", back_populates="subscription")


class DailyStats(Base):
    __tablename__ = "daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    total_pnl = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    account_balance = Column(Float, default=0.0)
