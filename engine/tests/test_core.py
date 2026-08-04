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
from src.broker.ibkr import IBKRBroker
from src.core.broker_factory import create_broker
from src.agents.technical import TechnicalAnalysisAgent
from src.core.engine import Engine
from src.core.config import EngineConfig
from src.gate.human_gate import HumanGate


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

        # 7000 is a ~17.6% drop from the 8500 peak — breaches the 15% limit.
        breached = await risk.check_drawdown("user1", 7000.0, 15.0)
        assert breached

    @pytest.mark.asyncio
    async def test_daily_reset(self, risk, user_config):
        await risk.record_pnl("test_user", -100.0)
        assert risk._daily_pnl.get("test_user", 0) == -100.0

        risk._last_reset = None
        risk._maybe_reset_daily()
        assert risk._daily_pnl.get("test_user", 0) == 0.0

    def test_update_global_limits(self, risk):
        risk.update_global_limits(max_daily_loss=2000.0, max_positions=5)
        assert risk._global_max_daily_loss == 2000.0
        assert risk._global_max_positions == 5

    def test_update_global_limits_partial(self, risk):
        risk.update_global_limits(max_positions=7)
        assert risk._global_max_positions == 7
        assert risk._global_max_daily_loss == 1000.0  # unchanged (fixture default)

    @pytest.mark.asyncio
    async def test_check_signal_blocks_on_open_position_count(self, risk, user_config):
        """Global limit must reflect actual open positions, not today's trade count."""
        signal = Signal(
            id="test-3",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        # Fixture's global_max_positions=10 — well under the trade counter (0 trades
        # recorded today) but at/above the actual open-position count.
        verdict = await risk.check_signal(signal, user_config, open_position_count=10)
        assert verdict == RiskVerdict.BLOCK

        verdict = await risk.check_signal(signal, user_config, open_position_count=3)
        assert verdict == RiskVerdict.PASS


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


class TestIBKRBroker:
    """No live TWS/Gateway is available in CI, so this only covers what's testable
    without a real connection: construction and graceful degradation."""

    def test_broker_factory_creates_ibkr_broker(self):
        broker = create_broker(EngineConfig(), "ibkr")
        assert isinstance(broker, IBKRBroker)

    @pytest.mark.asyncio
    async def test_connect_fails_gracefully_without_ibapi_installed(self, monkeypatch):
        import src.broker.ibkr as ibkr_module

        monkeypatch.setattr(ibkr_module, "_IBAPI_AVAILABLE", False)
        broker = IBKRBroker()
        result = await broker.connect()
        assert result is False


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

    def test_update_params_applies_valid(self, agent):
        applied = agent.update_params(adx_threshold=25.0, rsi_period=21)
        assert applied == {"adx_threshold": 25.0, "rsi_period": 21}
        assert agent.adx_threshold == 25.0
        assert agent.rsi_period == 21

    def test_update_params_rejects_unknown_key(self, agent):
        with pytest.raises(ValueError):
            agent.update_params(not_a_real_param=1)

    def test_update_params_rejects_bad_value(self, agent):
        with pytest.raises(ValueError):
            agent.update_params(adx_threshold="not-a-number")


class TestEnginePauseResume:
    @pytest.fixture
    def engine(self):
        config = EngineConfig(tick_interval_seconds=0.01, candle_interval_seconds=0.01)
        return Engine(
            config=config,
            broker=PaperBroker(),
            gate=HumanGate(),
            risk=RiskEngine(),
        )

    def test_pause_resume_flags_are_independent(self, engine):
        engine._running = True
        assert not engine.paused

        engine.pause()
        assert engine.paused
        assert engine.running  # pausing must not stop the engine

        engine.resume()
        assert not engine.paused
        assert engine.running

    @pytest.mark.asyncio
    async def test_agent_loop_skips_analysis_while_paused(self, engine):
        fake_agent = MagicMock()
        fake_agent.name = "fake"
        fake_agent.config.confirmation_timeframe = None
        fake_agent.analyze = AsyncMock(return_value=None)

        engine._running = True
        engine._paused = True

        task = asyncio.create_task(engine._agent_loop(fake_agent))
        await asyncio.sleep(0.05)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

        fake_agent.analyze.assert_not_called()

    def test_switch_broker_requires_stopped_engine(self, engine):
        engine._running = True
        with pytest.raises(RuntimeError):
            engine.switch_broker("paper")

    def test_switch_broker_while_stopped(self, engine):
        engine._running = False
        engine.switch_broker("paper")
        assert engine.config.default_broker == "paper"
        assert isinstance(engine.broker, PaperBroker)

    def _make_signal(self):
        return Signal(
            id="sig-1",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )

    def test_signal_message_includes_ai_verdict_when_present(self, engine):
        signal = self._make_signal()
        signal.metadata["ai_verdict"] = {"verdict": "RISKY", "reason": "Low liquidity window"}
        message = engine._format_signal_message(signal)
        assert "RISKY" in message
        assert "Low liquidity window" in message

    def test_signal_message_omits_ai_verdict_when_skipped(self, engine):
        signal = self._make_signal()
        signal.metadata["ai_verdict"] = {"verdict": "SKIP", "reason": "No AI available"}
        message = engine._format_signal_message(signal)
        assert "AI:" not in message

    def test_signal_message_omits_ai_verdict_when_absent(self, engine):
        message = engine._format_signal_message(self._make_signal())
        assert "AI:" not in message


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
