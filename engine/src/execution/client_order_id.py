import hashlib
import re

BROKER_LIMITS = {
    "binance": 36,
    "binance_futures": 36,
    "ibkr": 32,
    "mt5": 31,
    "paper": 64,
}


def generate_client_order_id(
    user_id: str,
    signal_id: str,
    action: str,
    broker: str,
) -> str:
    """Return a stable, broker-safe identifier without exposing full user IDs."""
    normalized = "|".join((user_id, signal_id, action.upper(), broker.lower()))
    digest = hashlib.sha256(normalized.encode()).hexdigest()
    safe_action = re.sub(r"[^A-Z0-9]", "", action.upper())[:4] or "ORD"
    value = f"XMB-{safe_action}-{digest}"
    return value[: BROKER_LIMITS.get(broker.lower(), 32)]
