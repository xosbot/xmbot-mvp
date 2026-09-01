from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum


class ReconciliationHealth(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNSAFE = "UNSAFE"


class ReconciliationSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class MismatchType(str, Enum):
    UNKNOWN_BROKER_ORDER = "UNKNOWN_BROKER_ORDER"
    MISSING_BROKER_ORDER = "MISSING_BROKER_ORDER"
    UNKNOWN_BROKER_POSITION = "UNKNOWN_BROKER_POSITION"
    MISSING_BROKER_POSITION = "MISSING_BROKER_POSITION"
    POSITION_DISAPPEARED = "POSITION_DISAPPEARED"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    ENTRY_PRICE_MISMATCH = "ENTRY_PRICE_MISMATCH"
    STOP_LOSS_MISMATCH = "STOP_LOSS_MISMATCH"
    TAKE_PROFIT_MISMATCH = "TAKE_PROFIT_MISMATCH"
    UNRECORDED_EXECUTION = "UNRECORDED_EXECUTION"
    DUPLICATE_EXECUTION = "DUPLICATE_EXECUTION"
    ORDER_STATUS_MISMATCH = "ORDER_STATUS_MISMATCH"
    BALANCE_MISMATCH = "BALANCE_MISMATCH"
    SUBMISSION_UNKNOWN = "SUBMISSION_UNKNOWN"
    BROKER_UNAVAILABLE = "BROKER_UNAVAILABLE"


@dataclass(frozen=True)
class ReconciliationMismatch:
    type: MismatchType
    severity: ReconciliationSeverity
    user_id: str
    broker_account_id: str
    symbol: str | None = None
    internal_id: str | None = None
    broker_id: str | None = None
    internal_state: dict = field(default_factory=dict)
    broker_state: dict = field(default_factory=dict)
    detected_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    recommended_action: str = "Investigate broker and durable records before trading"
    auto_resolvable: bool = False

    def to_payload(self) -> dict:
        return {
            "type": self.type.value,
            "severity": self.severity.value,
            "user_id": self.user_id,
            "broker_account_id": self.broker_account_id,
            "symbol": self.symbol,
            "internal_id": self.internal_id,
            "broker_id": self.broker_id,
            "internal_state": self.internal_state,
            "broker_state": self.broker_state,
            "detected_at": self.detected_at.isoformat(),
            "recommended_action": self.recommended_action,
            "auto_resolvable": self.auto_resolvable,
        }
