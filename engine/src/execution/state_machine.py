from ..db.financial_models import OrderIntentStatus
from .exceptions import InvalidOrderStateTransition

ALLOWED_TRANSITIONS: dict[OrderIntentStatus, set[OrderIntentStatus]] = {
    OrderIntentStatus.CREATED: {OrderIntentStatus.SUBMITTING, OrderIntentStatus.CANCELLED},
    OrderIntentStatus.SUBMITTING: {
        OrderIntentStatus.SUBMITTED,
        OrderIntentStatus.ACKNOWLEDGED,
        OrderIntentStatus.PARTIALLY_FILLED,
        OrderIntentStatus.FILLED,
        OrderIntentStatus.REJECTED,
        OrderIntentStatus.FAILED,
        OrderIntentStatus.SUBMISSION_UNKNOWN,
    },
    OrderIntentStatus.SUBMITTED: {
        OrderIntentStatus.ACKNOWLEDGED,
        OrderIntentStatus.PARTIALLY_FILLED,
        OrderIntentStatus.FILLED,
        OrderIntentStatus.REJECTED,
        OrderIntentStatus.RECONCILIATION_REQUIRED,
    },
    OrderIntentStatus.ACKNOWLEDGED: {
        OrderIntentStatus.PARTIALLY_FILLED,
        OrderIntentStatus.FILLED,
        OrderIntentStatus.CANCELLED,
        OrderIntentStatus.RECONCILIATION_REQUIRED,
    },
    OrderIntentStatus.PARTIALLY_FILLED: {
        OrderIntentStatus.PARTIALLY_FILLED,
        OrderIntentStatus.FILLED,
        OrderIntentStatus.CANCELLED,
        OrderIntentStatus.RECONCILIATION_REQUIRED,
    },
    OrderIntentStatus.SUBMISSION_UNKNOWN: {
        OrderIntentStatus.ACKNOWLEDGED,
        OrderIntentStatus.PARTIALLY_FILLED,
        OrderIntentStatus.FILLED,
        OrderIntentStatus.RECONCILIATION_REQUIRED,
    },
}


def validate_transition(current: OrderIntentStatus, target: OrderIntentStatus) -> None:
    if target == current:
        return
    if target not in ALLOWED_TRANSITIONS.get(current, set()):
        raise InvalidOrderStateTransition(f"Invalid OrderIntent transition: {current} -> {target}")
