from datetime import UTC, datetime, timedelta

import pytest

from src.core.types import Market
from src.strategies.base import StrategyConfig
from src.strategies.gold_scalper import GoldScalperStrategy
from src.strategies.registry import StrategyRegistry, load_builtin_strategies


def _bar(i: int, *, bid: float = 4400.0, ask: float = 4400.2, close: float = 4400.1) -> Market:
    ts = datetime(2026, 9, 8, 8, 0, tzinfo=UTC) + timedelta(minutes=i)
    return Market(
        symbol="XAUUSD",
        timeframe="M1",
        bid=bid,
        ask=ask,
        open=close - 0.1,
        high=close + 0.4,
        low=close - 0.4,
        close=close,
        volume=100.0,
        timestamp=ts,
    )


def test_gold_scalper_is_registered() -> None:
    registry = StrategyRegistry()
    load_builtin_strategies(registry)
    assert "gold_scalper" in registry.available_types


@pytest.mark.asyncio
async def test_gold_scalper_needs_sufficient_history() -> None:
    strategy = GoldScalperStrategy(StrategyConfig(name="gold", symbols=["XAUUSD"], timeframe="M1"))
    bars = [_bar(i) for i in range(100)]
    assert await strategy.analyze(bars) is None


@pytest.mark.asyncio
async def test_gold_scalper_blocks_excessive_spread() -> None:
    config = StrategyConfig(
        name="gold",
        symbols=["XAUUSD"],
        timeframe="M1",
        params={
            "min_m1_bars": 330,
            "min_atr_pct": 0.001,
            "max_atr_pct": 1.0,
            "max_spread_atr": 0.10,
        },
    )
    strategy = GoldScalperStrategy(config)
    bars = [_bar(i, bid=4400.0, ask=4405.0, close=4402.5) for i in range(340)]
    assert await strategy.analyze(bars) is None


def test_gold_scalper_aggregates_m1_to_m5() -> None:
    bars = [_bar(i, close=4400.0 + i * 0.1) for i in range(10)]
    aggregated = GoldScalperStrategy._aggregate(bars, 5)
    assert len(aggregated) == 2
    assert aggregated[0].open == bars[0].open
    assert aggregated[0].close == bars[4].close
    assert aggregated[1].close == bars[9].close
