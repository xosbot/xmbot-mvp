from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum


class SignalAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    EXIT = "EXIT"
    HOLD = "HOLD"


class SignalDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"
    TIMEOUT = "TIMEOUT"
    PENDING = "PENDING"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIAL = "PARTIAL"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class RiskVerdict(str, Enum):
    PASS = "PASS"
    BLOCK = "BLOCK"
    MODIFY = "MODIFY"


@dataclass
class PriceTick:
    symbol: str
    bid: float
    ask: float
    timestamp: datetime
    volume: float = 0.0


@dataclass
class Market:
    symbol: str
    timeframe: str
    bid: float
    ask: float
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: datetime


@dataclass
class Signal:
    id: str
    action: SignalAction
    market: str
    entry_price: float
    stop_loss: float
    take_profit: float | None = None
    confidence: float = 0.0
    reason: str = ""
    agent: str = ""
    user_id: str = ""
    metadata: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @property
    def risk_amount(self) -> float:
        return abs(self.entry_price - self.stop_loss)

    @property
    def risk_percent(self) -> float:
        if self.entry_price == 0:
            return 0.0
        return (self.risk_amount / self.entry_price) * 100


@dataclass
class Order:
    id: str
    signal_id: str
    action: SignalAction
    market: str
    volume: float
    price: float
    stop_loss: float
    take_profit: float | None = None
    order_type: str = "market"
    broker: str = ""
    user_id: str = ""
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    filled_at: datetime | None = None
    filled_price: float | None = None
    broker_order_id: str | None = None


@dataclass
class OrderResult:
    success: bool
    order_id: str
    broker_order_id: str | None = None
    filled_price: float | None = None
    filled_volume: float | None = None
    error: str | None = None


@dataclass
class Position:
    id: str
    symbol: str
    direction: SignalAction
    volume: float
    entry_price: float
    current_price: float
    stop_loss: float
    take_profit: float | None = None
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    open_time: datetime = field(default_factory=lambda: datetime.now(UTC))
    broker_position_id: str | None = None
    user_id: str = ""


@dataclass
class AccountInfo:
    broker: str
    balance: float
    equity: float
    margin: float
    margin_free: float
    currency: str = "USD"
    leverage: int = 1
    is_connected: bool = False


@dataclass
class AgentConfig:
    name: str
    enabled: bool = True
    markets: list[str] = field(default_factory=lambda: ["XAUUSD"])
    timeframe: str = "M5"
    confirmation_timeframe: str | None = "H1"  # Higher TF for trend confirmation
    max_positions: int = 3
    confidence_threshold: float = 0.6
    max_daily_trades: int = 5
    metadata: dict = field(default_factory=dict)


@dataclass
class UserConfig:
    user_id: str
    telegram_chat_id: str | None = None
    max_daily_loss: float = 500.0
    max_drawdown_percent: float = 20.0
    max_position_size: float = 0.5
    max_positions: int = 10
    default_stop_loss: float = 30.0
    enable_ai_analysis: bool = True
    agent_configs: dict[str, AgentConfig] = field(default_factory=dict)
