"""Trading session filter — instrument-aware.

Default behaviour targets XAUUSD (London/NY sessions).  When an instrument
symbol is provided, sessions are read from the instrument registry so that
the same engine code works for forex, crypto, and other asset classes.

Gold (XAUUSD) active sessions (UTC):
- London:       07:00 - 16:00
- New York:     12:00 - 21:00
- Best liquidity: London-NY overlap (12:00 - 16:00)
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from .instruments import get_sessions
from .instruments import is_session_active as _registry_active

log = logging.getLogger("xmbot.session")

# XAUUSD defaults (used when no instrument is specified)
LONDON_START = 7
LONDON_END = 16
NEW_YORK_START = 12
NEW_YORK_END = 21

OFF_PEAK_ADX_BONUS = 5.0


def is_london_active(now: datetime | None = None) -> bool:
    if now is None:
        now = datetime.now(UTC)
    return LONDON_START <= now.hour < LONDON_END


def is_new_york_active(now: datetime | None = None) -> bool:
    if now is None:
        now = datetime.now(UTC)
    return NEW_YORK_START <= now.hour < NEW_YORK_END


def is_overlap_active(now: datetime | None = None) -> bool:
    if now is None:
        now = datetime.now(UTC)
    return NEW_YORK_START <= now.hour < LONDON_END


def is_active_session(now: datetime | None = None, symbol: str = "XAUUSD") -> bool:
    """Check if *now* falls within an active trading session for *symbol*.

    If the instrument has no session configuration (e.g. crypto) or is
    unknown, returns True (always active).
    """
    if now is None:
        now = datetime.now(UTC)

    # Try instrument-aware check first
    spec_sessions = get_sessions(symbol)
    if spec_sessions:
        return _registry_active(symbol, now.hour)

    # Fallback to XAUUSD defaults
    return LONDON_START <= now.hour < NEW_YORK_END


def get_session_name(now: datetime | None = None, symbol: str = "XAUUSD") -> str:
    if now is None:
        now = datetime.now(UTC)

    if is_overlap_active(now) and symbol.upper() in ("XAUUSD", "XAU/USD"):
        return "London-NY Overlap"
    elif is_london_active(now):
        return "London"
    elif is_new_york_active(now):
        return "New York"
    else:
        sessions = get_sessions(symbol)
        if sessions:
            names = [n.title() for n in sessions]
            return f"Sessions: {', '.join(names)}"
        return "Off-Peak"


def get_session_adx_threshold(
    base_threshold: float,
    now: datetime | None = None,
    symbol: str = "XAUUSD",
) -> float:
    """Higher ADX required during off-peak sessions to filter noise."""
    if is_active_session(now, symbol):
        return base_threshold
    return base_threshold + OFF_PEAK_ADX_BONUS
