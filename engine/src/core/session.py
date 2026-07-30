"""Trading session filter for XAUUSD.

Gold (XAUUSD) has specific active sessions with good liquidity:
- London: 07:00 - 16:00 UTC
- New York: 12:00 - 21:00 UTC
- Best liquidity: London-NY overlap (12:00 - 16:00 UTC)

Avoid trading during low-volume Asian session (21:00 - 07:00 UTC).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone


log = logging.getLogger("xmbot.session")

# XAUUSD active sessions (UTC hours)
LONDON_START = 7
LONDON_END = 16
NEW_YORK_START = 12
NEW_YORK_END = 21

# Minimum ADX during off-peak sessions (higher threshold to filter noise)
OFF_PEAK_ADX_BONUS = 5.0


def is伦敦_active(now: datetime | None = None) -> bool:
    """Check if London session is active."""
    if now is None:
        now = datetime.now(timezone.utc)
    hour = now.hour
    return LONDON_START <= hour < LONDON_END


def is_new_york_active(now: datetime | None = None) -> bool:
    """Check if New York session is active."""
    if now is None:
        now = datetime.now(timezone.utc)
    hour = now.hour
    return NEW_YORK_START <= hour < NEW_YORK_END


def is_overlap_active(now: datetime | None = None) -> bool:
    """Check if London-NY overlap (best liquidity) is active."""
    if now is None:
        now = datetime.now(timezone.utc)
    hour = now.hour
    return NEW_YORK_START <= hour < LONDON_END  # 12:00 - 16:00 UTC


def is_active_session(now: datetime | None = None) -> bool:
    """Check if any major session is active (London or New York)."""
    if now is None:
        now = datetime.now(timezone.utc)
    hour = now.hour
    return LONDON_START <= hour < NEW_YORK_END  # 07:00 - 21:00 UTC


def get_session_name(now: datetime | None = None) -> str:
    """Get the name of the current active session."""
    if now is None:
        now = datetime.now(timezone.utc)

    if is_overlap_active(now):
        return "London-NY Overlap"
    elif is伦敦_active(now):
        return "London"
    elif is_new_york_active(now):
        return "New York"
    else:
        return "Off-Peak (Asian)"


def get_session_adx_threshold(base_threshold: float, now: datetime | None = None) -> float:
    """Get ADX threshold adjusted for current session.

    During off-peak sessions, require higher ADX to filter noise.
    """
    if is_active_session(now):
        return base_threshold
    else:
        return base_threshold + OFF_PEAK_ADX_BONUS
