"""Instrument metadata registry.

Centralizes contract specifications (tick size, contract value, trading
sessions, price precision) so that agent and engine logic doesn't need
symbol-specific hard-coding.  New instruments are added here — the rest
of the codebase reads from this registry.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class InstrumentSpec:
    """Immutable specification for a tradeable instrument."""

    symbol: str
    contract_size: float          # units per 1 standard lot
    tick_size: float              # minimum price increment
    tick_value: float             # profit/loss per tick per lot
    pip_value: float              # profit/loss per pip (0.01 price move) per lot
    price_precision: int          # decimal places for price quoting
    min_lot: float = 0.01
    max_lot: float = 100.0
    lot_step: float = 0.01

    # Trading sessions (UTC hours) — empty means 24/5
    sessions: dict[str, tuple[int, int]] = field(default_factory=dict)

    # Point multiplier for risk calculations: risk_per_lot = price_risk * multiplier
    risk_multiplier: float = 100.0


# ---------------------------------------------------------------------------
# Built-in instruments
# ---------------------------------------------------------------------------

INSTRUMENTS: dict[str, InstrumentSpec] = {
    "XAUUSD": InstrumentSpec(
        symbol="XAUUSD",
        contract_size=100.0,       # 1 lot = 100 troy oz
        tick_size=0.01,
        tick_value=0.01,           # $0.01 per tick per lot
        pip_value=1.0,             # $1.00 per pip (0.01 move) per lot
        price_precision=2,
        min_lot=0.01,
        max_lot=100.0,
        risk_multiplier=100.0,
        sessions={
            "london":  (7, 16),
            "new_york": (12, 21),
        },
    ),
    "XAU/USD": InstrumentSpec(
        symbol="XAUUSD",
        contract_size=100.0,
        tick_size=0.01,
        tick_value=0.01,
        pip_value=1.0,
        price_precision=2,
        min_lot=0.01,
        max_lot=100.0,
        risk_multiplier=100.0,
        sessions={
            "london":  (7, 16),
            "new_york": (12, 21),
        },
    ),
    "PAXGUSDT": InstrumentSpec(
        symbol="PAXGUSDT",
        contract_size=1.0,         # 1 PAXG = 1 oz gold
        tick_size=0.01,
        tick_value=0.01,
        pip_value=1.0,
        price_precision=2,
        min_lot=0.001,
        max_lot=10.0,
        risk_multiplier=1.0,       # crypto-style: 1 unit = 1 coin
    ),
    "EURUSD": InstrumentSpec(
        symbol="EURUSD",
        contract_size=100000.0,    # 1 lot = 100k units
        tick_size=0.0001,
        tick_value=0.0001,
        pip_value=10.0,            # $10 per pip per lot
        price_precision=5,
        min_lot=0.01,
        max_lot=100.0,
        risk_multiplier=100000.0,
        sessions={
            "london":  (7, 16),
            "new_york": (12, 21),
        },
    ),
    "GBPUSD": InstrumentSpec(
        symbol="GBPUSD",
        contract_size=100000.0,
        tick_size=0.0001,
        tick_value=0.0001,
        pip_value=10.0,
        price_precision=5,
        min_lot=0.01,
        max_lot=100.0,
        risk_multiplier=100000.0,
        sessions={
            "london":  (7, 16),
            "new_york": (12, 21),
        },
    ),
    "BTCUSDT": InstrumentSpec(
        symbol="BTCUSDT",
        contract_size=1.0,
        tick_size=0.01,
        tick_value=0.01,
        pip_value=1.0,
        price_precision=2,
        min_lot=0.0001,
        max_lot=10.0,
        lot_step=0.0001,
        risk_multiplier=1.0,
    ),
}

# Normalized lookup: strip "/" and upper-case
_NORMALIZE_MAP: dict[str, str] = {}
for _sym in list(INSTRUMENTS.keys()):
    _key = _sym.replace("/", "").upper()
    if _key not in _NORMALIZE_MAP:
        _NORMALIZE_MAP[_key] = _sym


def get_instrument(symbol: str) -> InstrumentSpec | None:
    """Look up an instrument by symbol (case-insensitive, slash-tolerant)."""
    key = symbol.replace("/", "").upper()
    canonical = _NORMALIZE_MAP.get(key)
    if canonical:
        return INSTRUMENTS[canonical]
    return None


def get_contract_size(symbol: str) -> float:
    """Convenience: return contract_size for *symbol*, default 100."""
    spec = get_instrument(symbol)
    return spec.contract_size if spec else 100.0


def get_sessions(symbol: str) -> dict[str, tuple[int, int]]:
    """Return trading sessions for *symbol*, empty dict if unknown."""
    spec = get_instrument(symbol)
    return spec.sessions if spec else {}


def is_session_active(symbol: str, hour: int) -> bool:
    """Check if *hour* (UTC) falls within any active session for *symbol*."""
    sessions = get_sessions(symbol)
    if not sessions:
        return True  # no session filter configured → always active
    return any(start <= hour < end for start, end in sessions.values())


def list_symbols() -> list[str]:
    """Return all registered symbol names."""
    return list(INSTRUMENTS.keys())
