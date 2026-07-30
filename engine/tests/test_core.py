import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from src.core.types import (
    Signal, SignalAction, Order, OrderStatus, RiskVerdict,
    UserConfig, AgentConfig, Position, AccountInfo, Market,
)
from src.risk.engine import RiskEngine
from src.broker.paper import PaperBroker
from src.agents.technical import TechnicalAnalysisAgent


class TestRiskEngine:
    @pytest.fixture
    def risk(self):
        return RiskEngine(global_max_daily_loss=1000.0, global_max_positions=10)

    @pytest.fixture
    def user_config(self):
        return UserConfig(
            user_id="test_user",
            max_daily_loss=500.0,
            max_drawdown_percent=15.0,
            max_position_size=0.5,
        )

    @pytest.mark.asyncio
    async def test_check_signal_pass(self, risk, user_config):
        signal = Signal(
            id="test-1",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        verdict = await risk.check_signal(signal, user_config)
        assert verdict == RiskVerdict.PASS

    @pytest.mark.asyncio
    async def test_check_signal_blocks_daily_loss(self, risk, user_config):
        await risk.record_pnl("test_user", -600.0)
        signal = Signal(
            id="test-2",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        verdict = await risk.check_signal(signal, user_config)
        assert verdict == RiskVerdict.BLOCK

    @pytest.mark.asyncio
    async def test_drawdown_check(self, risk):
        breached = await risk.check_drawdown("user1", 8500.0, 15.0)
        assert not breached

        breached = await risk.check_drawdown("user1", 8400.0, 15.0)
        assert breached

    @pytest.mark.asyncio
    async def test_daily_reset(self, risk, user_config):
        await risk.record_pnl("test_user", -100.0)
        assert risk._daily_pnl.get("test_user", 0) == -100.0

        risk._last_reset = None
        risk._maybe_reset_daily()
        assert risk._daily_pnl.get("test_user", 0) == 0.0


class TestPaperBroker:
    @pytest.fixture
    def broker(self):
        return PaperBroker(initial_balance=10000.0)

    @pytest.mark.asyncio
    async def test_connect(self, broker):
        result = await broker.connect()
        assert result is True
        assert await broker.is_connected()

    @pytest.mark.asyncio
    async def test_place_buy_order(self, broker):
        await broker.connect()
        order = Order(
            id="order-1",
            signal_id="signal-1",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            volume=0.1,
            price=3000.0,
            stop_loss=2990.0,
            take_profit=3020.0,
        )
        result = await broker.place_order(order)
        assert result.success
        assert result.filled_price > 0

    @pytest.mark.asyncio
    async def test_get_account(self, broker):
        await broker.connect()
        account = await broker.get_account()
        assert account is not None
        assert account.balance == 10000.0

    @pytest.mark.asyncio
    async def test_get_market_data(self, broker):
        await broker.connect()
        data = await broker.get_market_data("PAXGUSDT", "M5", 50)
        assert len(data) == 50
        assert data[0].symbol == "PAXGUSDT"


class TestTechnicalAgent:
    @pytest.fixture
    def agent(self):
        config = AgentConfig(
            name="technical",
            markets=["PAXGUSDT"],
            timeframe="M5",
            confidence_threshold=0.6,
        )
        return TechnicalAnalysisAgent(config=config)

    def test_calculate_indicators(self, agent):
        import pandas as pd
        import numpy as np

        np.random.seed(42)
        n = 100
        df = pd.DataFrame({
            "time": pd.date_range("2024-01-01", periods=n, freq="5min"),
            "open": np.random.uniform(2990, 3010, n),
            "high": np.random.uniform(3010, 3020, n),
            "low": np.random.uniform(2980, 2990, n),
            "close": np.random.uniform(2990, 3010, n),
            "volume": np.random.uniform(100, 1000, n),
        })

        result = agent._calculate_indicators(df)
        assert "RSI" in result.columns
        assert "ATR" in result.columns
        assert "ADX" in result.columns
        assert "trend" in result.columns
        assert len(result) == n


class TestSessionFilter:
    def test_london_session(self):
        from src.core.session import is_london_active
        from datetime import datetime, timezone

        london_time = datetime(2024, 1, 1, 10, 0, tzinfo=timezone.utc)
        assert is_london_active(london_time) is True

        night_time = datetime(2024, 1, 1, 3, 0, tzinfo=timezone.utc)
        assert is_london_active(night_time) is False

    def test_active_session(self):
        from src.core.session import is_active_session
        from datetime import datetime, timezone

        active_time = datetime(2024, 1, 1, 14, 0, tzinfo=timezone.utc)
        assert is_active_session(active_time) is True

        off_peak = datetime(2024, 1, 1, 23, 0, tzinfo=timezone.utc)
        assert is_active_session(off_peak) is False
