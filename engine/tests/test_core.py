import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from src.core.types import (
    Signal, SignalAction, SignalDecision, Order, OrderStatus, RiskVerdict,
    UserConfig, AgentConfig, Position, AccountInfo, Market,
)
from src.risk.engine import RiskEngine
from src.broker.paper import PaperBroker
from src.broker.ibkr import IBKRBroker
from src.broker.binance import BinanceBroker
from src.core.broker_factory import create_broker
from src.agents.technical import TechnicalAnalysisAgent
from src.agents.base import AgentStatus
from src.core.engine import Engine
from src.core.config import EngineConfig
from src.gate.human_gate import HumanGate
from src.telegram.bot import TelegramBot
from src.ai.base import AIProvider, AIResponse
from src.ai.registry import AIRegistry
from src.core.persistence import Persistence


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

    @pytest.mark.asyncio
    async def test_check_signal_blocks_when_dollar_risk_exceeds_pct(self, risk, user_config):
        """The hard risk gate must use the trade's real volume, not a placeholder.

        PAXGUSDT has contract_size=1.0. entry=3000, sl=2990 -> price_risk=10.
        At volume=5.0 that's $50 of risk against a $1000 balance (5%),
        which exceeds user_config's default risk_per_trade_pct (2% = $20).
        """
        signal = Signal(
            id="test-risk-amt-1",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        verdict = await risk.check_signal(
            signal, user_config, account_balance=1000.0, volume=5.0,
        )
        assert verdict == RiskVerdict.BLOCK

    @pytest.mark.asyncio
    async def test_check_signal_passes_when_dollar_risk_within_pct(self, risk, user_config):
        """Same signal, but a properly-sized volume keeps risk under the cap."""
        signal = Signal(
            id="test-risk-amt-2",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        # $10 risk on a $1000 balance = 1%, under the 2% default cap.
        verdict = await risk.check_signal(
            signal, user_config, account_balance=1000.0, volume=1.0,
        )
        assert verdict == RiskVerdict.PASS


class TestRiskEnginePersistence:
    """Daily risk counters must survive a process restart — previously they
    were in-memory only, so every redeploy silently reset the loss circuit
    breaker to zero."""

    @pytest.mark.asyncio
    async def test_daily_pnl_survives_restart(self, tmp_path):
        persistence = Persistence(data_dir=str(tmp_path), filename="risk_state.json")
        risk1 = RiskEngine(persistence=persistence)
        await risk1.record_pnl("test_user", -300.0)
        await risk1.record_trade(Order(
            id="o1", signal_id="s1", action=SignalAction.BUY, market="PAXGUSDT",
            volume=0.1, price=3000.0, stop_loss=2990.0, user_id="test_user",
        ))

        risk2 = RiskEngine(persistence=persistence)
        stats = risk2.get_daily_stats("test_user")
        assert stats["daily_pnl"] == -300.0
        assert stats["daily_trades"] == 1

    @pytest.mark.asyncio
    async def test_stale_daily_state_not_restored_across_day_boundary(self, tmp_path):
        persistence = Persistence(data_dir=str(tmp_path), filename="risk_state.json")
        await persistence.save({
            "date": "2000-01-01",
            "daily_pnl": {"test_user": -9999.0},
            "daily_trades": {"test_user": 50},
            "peak_balance": {"test_user": 5000.0},
        })

        risk = RiskEngine(persistence=persistence)
        stats = risk.get_daily_stats("test_user")
        assert stats["daily_pnl"] == 0.0
        assert stats["daily_trades"] == 0
        # Peak balance is an all-time high-water mark, not a daily counter —
        # it should survive regardless of the saved date.
        assert stats["peak_balance"] == 5000.0

    @pytest.mark.asyncio
    async def test_peak_balance_survives_restart(self, tmp_path):
        persistence = Persistence(data_dir=str(tmp_path), filename="risk_state.json")
        risk1 = RiskEngine(persistence=persistence)
        await risk1.check_drawdown("test_user", 8500.0, 15.0)

        risk2 = RiskEngine(persistence=persistence)
        assert risk2.get_daily_stats("test_user")["peak_balance"] == 8500.0


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


class TestBinanceBrokerFactory:
    def test_default_broker_targets_production_api(self):
        broker = create_broker(EngineConfig(binance_testnet=False), "binance")
        assert broker._get_base_url() == "https://api.binance.com"

    def test_testnet_flag_targets_testnet_api(self):
        broker = create_broker(EngineConfig(binance_testnet=True), "binance")
        assert broker._get_base_url() == "https://testnet.binance.vision"


class _FakeBinanceResponse:
    def __init__(self, status=200, payload=None):
        self.status = status
        self._payload = payload or {}

    async def json(self):
        return self._payload


class _FakeBinanceRequestCM:
    def __init__(self, response, record, method, url, kwargs):
        self._response = response
        record.append({"method": method, "url": url, **kwargs})

    async def __aenter__(self):
        return self._response

    async def __aexit__(self, *args):
        return False


class _FakeBinanceSession:
    def __init__(self, response):
        self._response = response
        self.calls = []

    def request(self, method, url, **kwargs):
        return _FakeBinanceRequestCM(self._response, self.calls, method, url, kwargs)


class TestBinanceOrderFillPrice:
    """MARKET orders always report price="0.00000000" at the top level —
    the real fill price is cummulativeQuoteQty / executedQty. Found via the
    same live testnet order that surfaced the request-format bug above."""

    @pytest.mark.asyncio
    async def test_market_order_fill_price_derived_from_cumulative_quote(self, monkeypatch):
        broker = BinanceBroker(api_key="k", api_secret="s", testnet=True)

        async def fake_request(method, path, params=None, signed=False):
            return {
                "orderId": 5638125,
                "price": "0.00000000",
                "executedQty": "0.10000000",
                "cummulativeQuoteQty": "406.12400000",
            }

        monkeypatch.setattr(broker, "_request", fake_request)

        order = Order(
            id="o1", signal_id="s1", action=SignalAction.BUY, market="PAXGUSDT",
            volume=0.1, price=4061.24, stop_loss=4050.0,
        )
        result = await broker.place_order(order)

        assert result.success
        assert result.filled_price == pytest.approx(4061.24)


class TestBinanceProtectiveOrders:
    """cancel_order()/modify_position() previously only touched local
    bookkeeping — a "closed" position stayed open on the real exchange, and
    trailing-stop updates never moved the real stop. Also: a filled MARKET
    entry had no stop-loss enforcement on Binance at all (unlike the paper
    broker, which simulates SL/TP hits itself). Verified live against
    Binance Testnet: real OCO placement, real cancellation, real fill-price
    parsing."""

    def _make_broker(self, monkeypatch, router):
        broker = BinanceBroker(api_key="k", api_secret="s", testnet=True)

        async def fake_request(method, path, params=None, signed=False):
            return router(method, path, params or {})

        monkeypatch.setattr(broker, "_request", fake_request)
        return broker

    @pytest.mark.asyncio
    async def test_place_order_attaches_oco_when_take_profit_set(self, monkeypatch):
        calls = []

        def router(method, path, params):
            calls.append((method, path, params))
            if path == "/api/v3/order":
                return {"orderId": 1, "executedQty": "0.1", "cummulativeQuoteQty": "406.0"}
            if path == "/api/v3/orderList/oco":
                return {"orderListId": 999}
            raise AssertionError(f"unexpected call: {method} {path}")

        broker = self._make_broker(monkeypatch, router)
        order = Order(
            id="o1", signal_id="s1", action=SignalAction.BUY, market="PAXGUSDT",
            volume=0.1, price=4060.0, stop_loss=4040.0, take_profit=4100.0,
        )
        result = await broker.place_order(order)

        assert result.success
        oco_calls = [c for c in calls if c[1] == "/api/v3/orderList/oco"]
        assert len(oco_calls) == 1
        _, _, oco_params = oco_calls[0]
        assert oco_params["side"] == "SELL"  # closes a BUY
        assert oco_params["aboveType"] == "LIMIT_MAKER"
        assert oco_params["belowType"] == "STOP_LOSS_LIMIT"
        assert broker._protective_orders["o1"] == 999
        assert broker._protective_is_oco["o1"] is True

    @pytest.mark.asyncio
    async def test_place_order_attaches_plain_stop_when_no_take_profit(self, monkeypatch):
        calls = []

        def router(method, path, params):
            calls.append((method, path, params))
            if params.get("type") == "MARKET":
                return {"orderId": 1, "executedQty": "0.1", "cummulativeQuoteQty": "406.0"}
            if params.get("type") == "STOP_LOSS_LIMIT":
                return {"orderId": 42}
            raise AssertionError(f"unexpected call: {method} {path} {params}")

        broker = self._make_broker(monkeypatch, router)
        order = Order(
            id="o2", signal_id="s1", action=SignalAction.BUY, market="PAXGUSDT",
            volume=0.1, price=4060.0, stop_loss=4040.0,
        )
        result = await broker.place_order(order)

        assert result.success
        assert broker._protective_orders["o2"] == 42
        assert broker._protective_is_oco["o2"] is False

    @pytest.mark.asyncio
    async def test_place_order_skips_protective_order_without_stop_loss(self, monkeypatch):
        def router(method, path, params):
            return {"orderId": 1, "executedQty": "0.1", "cummulativeQuoteQty": "406.0"}

        broker = self._make_broker(monkeypatch, router)
        order = Order(
            id="o3", signal_id="s1", action=SignalAction.BUY, market="PAXGUSDT",
            volume=0.1, price=4060.0, stop_loss=0,
        )
        await broker.place_order(order)

        assert "o3" not in broker._protective_orders

    @pytest.mark.asyncio
    async def test_cancel_order_cancels_protective_order_and_flattens(self, monkeypatch):
        calls = []

        def router(method, path, params):
            calls.append((method, path, params))
            if method == "DELETE":
                return {"orderListId": 999}
            return {"orderId": 2, "executedQty": "0.1", "cummulativeQuoteQty": "410.0"}

        broker = self._make_broker(monkeypatch, router)
        broker._positions["o1"] = Position(
            id="o1", symbol="PAXGUSDT", direction=SignalAction.BUY, volume=0.1,
            entry_price=4060.0, current_price=4060.0, stop_loss=4040.0,
        )
        broker._protective_orders["o1"] = 999
        broker._protective_is_oco["o1"] = True

        closed = await broker.cancel_order("o1")

        assert closed is True
        assert "o1" not in broker._positions
        assert "o1" not in broker._protective_orders
        delete_calls = [c for c in calls if c[0] == "DELETE"]
        assert delete_calls == [("DELETE", "/api/v3/orderList", {"symbol": "PAXGUSDT", "orderListId": 999})]
        market_calls = [c for c in calls if c[2].get("side") == "SELL" and c[2].get("type") == "MARKET"]
        assert len(market_calls) == 1

    @pytest.mark.asyncio
    async def test_cancel_order_returns_false_for_unknown_position(self, monkeypatch):
        broker = self._make_broker(monkeypatch, lambda *a: {})
        assert await broker.cancel_order("nonexistent") is False

    @pytest.mark.asyncio
    async def test_modify_position_cancels_and_replaces_protective_order(self, monkeypatch):
        calls = []

        def router(method, path, params):
            calls.append((method, path, params))
            if method == "DELETE":
                return {"orderListId": 999}
            return {"orderId": 3}

        broker = self._make_broker(monkeypatch, router)
        broker._positions["o1"] = Position(
            id="o1", symbol="PAXGUSDT", direction=SignalAction.BUY, volume=0.1,
            entry_price=4060.0, current_price=4070.0, stop_loss=4040.0,
        )
        broker._protective_orders["o1"] = 999
        broker._protective_is_oco["o1"] = True

        updated = await broker.modify_position("o1", stop_loss=4055.0)

        assert updated is True
        assert broker._positions["o1"].stop_loss == 4055.0
        delete_calls = [c for c in calls if c[0] == "DELETE"]
        assert len(delete_calls) == 1
        new_stop_calls = [c for c in calls if c[1] == "/api/v3/order" and c[2].get("type") == "STOP_LOSS_LIMIT"]
        assert len(new_stop_calls) == 1
        assert new_stop_calls[0][2]["stopPrice"] == "4055.00"

    @pytest.mark.asyncio
    async def test_modify_position_returns_false_for_unknown_position(self, monkeypatch):
        broker = self._make_broker(monkeypatch, lambda *a: {})
        assert await broker.modify_position("nonexistent", stop_loss=100.0) is False

    @pytest.mark.asyncio
    async def test_get_positions_reconciles_closed_protective_order(self, monkeypatch):
        def router(method, path, params):
            if path == "/api/v3/order":
                return {"status": "FILLED"}
            raise AssertionError(f"unexpected call: {method} {path}")

        broker = self._make_broker(monkeypatch, router)
        broker._positions["o1"] = Position(
            id="o1", symbol="PAXGUSDT", direction=SignalAction.BUY, volume=0.1,
            entry_price=4060.0, current_price=4060.0, stop_loss=4040.0,
        )
        broker._protective_orders["o1"] = 42
        broker._protective_is_oco["o1"] = False

        positions = await broker.get_positions()

        assert positions == []
        assert "o1" not in broker._positions

    @pytest.mark.asyncio
    async def test_get_positions_reconciles_closed_oco(self, monkeypatch):
        """GET /api/v3/orderList — unlike DELETE — does not accept `symbol`,
        only orderListId. Sending it anyway is rejected by Binance with a
        parameter-count error, found live against Testnet."""
        calls = []

        def router(method, path, params):
            calls.append((method, path, params))
            if path == "/api/v3/orderList":
                assert "symbol" not in params
                return {"listOrderStatus": "ALL_DONE"}
            raise AssertionError(f"unexpected call: {method} {path}")

        broker = self._make_broker(monkeypatch, router)
        broker._positions["o1"] = Position(
            id="o1", symbol="PAXGUSDT", direction=SignalAction.BUY, volume=0.1,
            entry_price=4060.0, current_price=4060.0, stop_loss=4040.0,
        )
        broker._protective_orders["o1"] = 999
        broker._protective_is_oco["o1"] = True

        positions = await broker.get_positions()

        assert positions == []
        assert "o1" not in broker._positions

    @pytest.mark.asyncio
    async def test_get_positions_throttles_reconciliation_checks(self, monkeypatch):
        call_count = 0

        def router(method, path, params):
            nonlocal call_count
            call_count += 1
            return {"status": "NEW"}

        broker = self._make_broker(monkeypatch, router)
        broker._positions["o1"] = Position(
            id="o1", symbol="PAXGUSDT", direction=SignalAction.BUY, volume=0.1,
            entry_price=4060.0, current_price=4060.0, stop_loss=4040.0,
        )
        broker._protective_orders["o1"] = 42
        broker._protective_is_oco["o1"] = False

        await broker.get_positions()
        await broker.get_positions()

        assert call_count == 1


class TestBinanceRequestFormat:
    """Binance's REST API reads params from the query string (or form body)
    for every method, including signed trading endpoints — it does not parse
    a JSON body. Sending `json=params` on POST meant the server saw no params
    at all, so every real order silently failed with a missing-parameter
    error. Found by running a real signal through to real testnet order
    placement."""

    @pytest.mark.asyncio
    async def test_signed_post_sends_params_as_query_string_not_json(self):
        broker = BinanceBroker(api_key="k", api_secret="s", testnet=True)
        fake_session = _FakeBinanceSession(
            _FakeBinanceResponse(200, {"orderId": 1, "price": "100.0"})
        )
        broker._session = fake_session

        await broker._request("POST", "/api/v3/order", {"symbol": "PAXGUSDT"}, signed=True)

        call = fake_session.calls[0]
        assert call["method"] == "POST"
        assert call.get("json") is None
        assert call["params"]["symbol"] == "PAXGUSDT"
        assert "signature" in call["params"]


class TestBinanceSpotBalance:
    """GET /api/v3/account (spot) returns a `balances` array, not the
    `totalWalletBalance` field that only exists on the Futures API — reading
    the wrong field meant balance was always read as 0 on spot (masked in
    production only because that account happens to hold funds in margin,
    which Testnet doesn't support at all)."""

    def test_reads_free_and_locked_usdt_from_balances_array(self):
        account = {
            "balances": [
                {"asset": "BTC", "free": "1.0", "locked": "0.0"},
                {"asset": "USDT", "free": "8500.50", "locked": "1499.50"},
            ]
        }
        assert BinanceBroker._spot_usdt_balance(account) == 10000.0

    def test_returns_zero_when_no_usdt_balance(self):
        assert BinanceBroker._spot_usdt_balance({"balances": []}) == 0.0

    @pytest.mark.asyncio
    async def test_get_account_reports_real_spot_balance(self, monkeypatch):
        broker = BinanceBroker(api_key="k", api_secret="s", testnet=True)

        async def fake_request(method, path, params=None, signed=False):
            return {"balances": [{"asset": "USDT", "free": "10000.0", "locked": "0.0"}]}

        monkeypatch.setattr(broker, "_request", fake_request)
        account = await broker.get_account()

        assert account.balance == 10000.0
        assert account.equity == 10000.0


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


class TestEngineErrorAlerting:
    """Repeated agent/loop errors used to degrade silently — no Telegram
    alert was ever sent, so a broker outage would only surface via logs."""

    @pytest.mark.asyncio
    async def test_agent_error_threshold_triggers_one_alert(self, monkeypatch):
        real_sleep = asyncio.sleep
        monkeypatch.setattr(asyncio, "sleep", lambda *_args: real_sleep(0))

        alerts = []

        async def fake_alert(text):
            alerts.append(text)

        config = EngineConfig(tick_interval_seconds=0.001, candle_interval_seconds=0.001)
        engine = Engine(
            config=config,
            broker=PaperBroker(),
            gate=HumanGate(),
            risk=RiskEngine(),
            alert_callback=fake_alert,
        )

        fake_agent = MagicMock()
        fake_agent.name = "fake"
        fake_agent.config.confirmation_timeframe = None
        fake_agent.config.markets = ["XAUUSD"]
        fake_agent.status = AgentStatus.IDLE
        fake_agent.analyze = AsyncMock(side_effect=RuntimeError("boom"))
        fake_agent._error_count = 0

        async def fake_on_error(error):
            fake_agent._error_count += 1
            if fake_agent._error_count > 10:
                fake_agent.status = AgentStatus.ERROR

        fake_agent.on_error = fake_on_error

        engine._running = True
        task = asyncio.create_task(engine._agent_loop(fake_agent))
        for _ in range(500):
            if alerts:
                break
            await real_sleep(0)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

        assert len(alerts) == 1
        assert "disabled after repeated errors" in alerts[0]

    @pytest.mark.asyncio
    async def test_alert_throttled_fires_once_per_window(self):
        alerts = []

        async def fake_alert(text):
            alerts.append(text)

        engine = Engine(
            config=EngineConfig(),
            broker=PaperBroker(),
            gate=HumanGate(),
            risk=RiskEngine(),
            alert_callback=fake_alert,
        )

        await engine._alert_throttled("k", "first", min_interval_seconds=300)
        await engine._alert_throttled("k", "second", min_interval_seconds=300)

        assert alerts == ["first"]

    @pytest.mark.asyncio
    async def test_alert_is_noop_without_callback(self):
        engine = Engine(config=EngineConfig(), broker=PaperBroker(), gate=HumanGate(), risk=RiskEngine())
        await engine._alert("no callback configured")  # must not raise


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

    def test_signal_message_includes_take_profit_when_present(self, engine):
        signal = self._make_signal()
        signal.take_profit = 3020.0
        message = engine._format_signal_message(signal)
        assert "TP: $3020.00" in message


class TestSignalNotification:
    """Covers the human_gate -> telegram wiring: the formatted message (with
    AI verdict) must actually reach the outgoing Telegram call unmodified."""

    @pytest.mark.asyncio
    async def test_gate_notify_receives_formatted_message_unmodified(self):
        received = {}

        async def notify(signal, message):
            received["message"] = message

        gate = HumanGate(signal_timeout=1, notify_callback=notify)
        signal = Signal(
            id="sig-notify",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )
        formatted = "📊 formatted message\nReason: RSI oversold bounce\n🤖 AI: SAFE — looks fine"

        task = asyncio.create_task(gate.submit(signal, user_message=formatted))
        await asyncio.sleep(0.01)
        await gate.resolve(signal.id, SignalDecision.APPROVED)
        await task

        assert received["message"] == formatted

    @pytest.mark.asyncio
    async def test_send_signal_sends_formatted_user_message(self, monkeypatch):
        bot = TelegramBot(token="fake-token", chat_id="fake-chat")
        sent = {}

        async def fake_send_message(text, buttons=None, parse_mode="Markdown"):
            sent["text"] = text
            return True

        monkeypatch.setattr(bot, "send_message", fake_send_message)

        signal = Signal(
            id="sig-1",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )
        formatted = "📊 formatted message\n🤖 AI: SAFE — looks fine"
        await bot.send_signal(signal, user_message=formatted)

        assert sent["text"] == formatted

    @pytest.mark.asyncio
    async def test_send_signal_falls_back_when_no_user_message(self, monkeypatch):
        bot = TelegramBot(token="fake-token", chat_id="fake-chat")
        sent = {}

        async def fake_send_message(text, buttons=None, parse_mode="Markdown"):
            sent["text"] = text
            return True

        monkeypatch.setattr(bot, "send_message", fake_send_message)

        signal = Signal(
            id="sig-2",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )
        await bot.send_signal(signal)

        assert "Trade Signal" in sent["text"]

    @pytest.mark.asyncio
    async def test_send_signal_has_no_modify_button(self, monkeypatch):
        """The Modify button had no follow-up flow to collect a new price/SL,
        so tapping it silently behaved like Approve — removed rather than left
        misleading."""
        bot = TelegramBot(token="fake-token", chat_id="fake-chat")
        sent = {}

        async def fake_send_message(text, buttons=None, parse_mode="Markdown"):
            sent["buttons"] = buttons
            return True

        monkeypatch.setattr(bot, "send_message", fake_send_message)

        signal = Signal(
            id="sig-3",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )
        await bot.send_signal(signal)

        button_texts = [btn["text"] for row in sent["buttons"] for btn in row]
        assert "✅ Approve" in button_texts
        assert "❌ Reject" in button_texts
        assert not any("Modify" in t for t in button_texts)


class TestTelegramSenderVerification:
    """A public bot (can_join_groups=True) handling live trade approvals
    must not act on callbacks/commands from anyone but the configured
    owner chat."""

    def test_callback_from_owner_is_processed(self):
        bot = TelegramBot(token="fake-token", chat_id="12345")
        received = []
        bot.set_default_handler(lambda signal_id, decision: received.append((signal_id, decision)))

        bot._handle_callback({
            "data": "approve_sig-1",
            "from": {"id": 12345},
            "message": {"chat": {"id": 12345}},
        })

        assert received == [("sig-1", SignalDecision.APPROVED)]

    def test_callback_from_stranger_is_ignored(self):
        bot = TelegramBot(token="fake-token", chat_id="12345")
        received = []
        bot.set_default_handler(lambda signal_id, decision: received.append((signal_id, decision)))

        bot._handle_callback({
            "data": "approve_sig-1",
            "from": {"id": 99999},
            "message": {"chat": {"id": 99999}},
        })

        assert received == []

    def test_callback_ignored_when_chat_id_unconfigured(self):
        """Fail closed: an unset owner chat_id must never mean allow-all."""
        bot = TelegramBot(token="fake-token", chat_id="")
        received = []
        bot.set_default_handler(lambda signal_id, decision: received.append((signal_id, decision)))

        bot._handle_callback({
            "data": "approve_sig-1",
            "from": {"id": 12345},
            "message": {"chat": {"id": 12345}},
        })

        assert received == []


class TestTelegramStatusCommand:
    @pytest.mark.asyncio
    async def test_status_reports_real_engine_state(self, monkeypatch):
        bot = TelegramBot(token="fake-token", chat_id="fake-chat")
        sent = {}

        async def fake_send_message(text, buttons=None, parse_mode="Markdown"):
            sent["text"] = text
            return True

        monkeypatch.setattr(bot, "send_message", fake_send_message)

        async def status_provider():
            return {
                "running": True,
                "paused": False,
                "broker": "binance",
                "broker_connected": True,
                "open_positions": 2,
                "pending_signals": 1,
            }

        bot.set_status_provider(status_provider)
        await bot._cmd_status("fake-chat")

        assert "Running" in sent["text"]
        assert "binance" in sent["text"]
        assert "connected" in sent["text"]
        assert "Open Positions:* 2" in sent["text"]

    @pytest.mark.asyncio
    async def test_status_without_provider_reports_unavailable(self, monkeypatch):
        bot = TelegramBot(token="fake-token", chat_id="fake-chat")
        sent = {}

        async def fake_send_message(text, buttons=None, parse_mode="Markdown"):
            sent["text"] = text
            return True

        monkeypatch.setattr(bot, "send_message", fake_send_message)
        await bot._cmd_status("fake-chat")

        assert "unavailable" in sent["text"]


class _FakeAIProvider(AIProvider):
    def __init__(self, content: str) -> None:
        super().__init__(model="fake-model", api_key="fake-key")
        self._content = content

    async def generate(self, prompt: str, system: str | None = None) -> AIResponse:
        return AIResponse(content=self._content, model=self.model)

    async def chat(self, messages: list[dict]) -> AIResponse:
        return AIResponse(content=self._content, model=self.model)


class TestAITradeValidation:
    """Covers analyze_trade_with_ai's parsing of the provider's raw response —
    discovered live that the 'VERDICT: SAFE/RISKY' + 'Reason:' labels the
    providers are instructed to lead with were leaking into the Telegram
    card's reason text, duplicating the verdict."""

    @pytest.fixture
    def engine(self):
        return Engine(
            config=EngineConfig(),
            broker=PaperBroker(),
            gate=HumanGate(),
            risk=RiskEngine(),
        )

    def _make_signal(self):
        return Signal(
            id="sig-ai",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="technical",
            reason="RSI oversold bounce",
        )

    @pytest.mark.asyncio
    async def test_strips_verdict_and_reason_labels(self, engine):
        registry = AIRegistry()
        registry.register(
            "fake",
            _FakeAIProvider("VERDICT: RISKY\nReason: Low liquidity window observed"),
        )
        engine.ai_registry = registry

        verdict = await engine.analyze_trade_with_ai(self._make_signal(), [])

        assert verdict["verdict"] == "RISKY"
        assert verdict["reason"] == "Low liquidity window observed"

    @pytest.mark.asyncio
    async def test_skips_when_no_provider_registered(self, engine):
        engine.ai_registry = AIRegistry()

        verdict = await engine.analyze_trade_with_ai(self._make_signal(), [])

        assert verdict["verdict"] == "SKIP"


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


class TestEngineConfigEncryption:
    """Test Fernet encryption for broker credentials at rest."""

    def test_encrypt_decrypt_roundtrip(self):
        config = EngineConfig(encryption_key="test-secret-key-12345")
        plaintext = "my-secret-api-key"
        encrypted = config.encrypt_secret(plaintext)
        assert encrypted != plaintext
        decrypted = config.decrypt_secret(encrypted)
        assert decrypted == plaintext

    def test_encrypt_without_key_returns_plaintext(self):
        config = EngineConfig(encryption_key="")
        plaintext = "my-secret-api-key"
        encrypted = config.encrypt_secret(plaintext)
        assert encrypted == plaintext

    def test_decrypt_without_key_returns_ciphertext(self):
        config = EngineConfig(encryption_key="")
        ciphertext = "some-ciphertext"
        decrypted = config.decrypt_secret(ciphertext)
        assert decrypted == ciphertext

    def test_different_keys_produce_different_ciphertext(self):
        config1 = EngineConfig(encryption_key="key-1")
        config2 = EngineConfig(encryption_key="key-2")
        plaintext = "secret-data"
        enc1 = config1.encrypt_secret(plaintext)
        enc2 = config2.encrypt_secret(plaintext)
        assert enc1 != enc2

    def test_get_broker_creds_decrypts(self):
        config = EngineConfig(encryption_key="test-key")
        # Encrypt the secrets and store them
        config.binance_api_key = config.encrypt_secret("original-key")
        config.binance_api_secret = config.encrypt_secret("original-secret")
        # get_broker_creds should decrypt them
        creds = config.get_broker_creds()
        assert creds["binance_api_key"] == "original-key"
        assert creds["binance_api_secret"] == "original-secret"


class TestRiskEnginePerUserPositions:
    """Test per-user max positions check in risk engine."""

    @pytest.fixture
    def risk(self):
        return RiskEngine(global_max_daily_loss=10000.0, global_max_positions=20)

    @pytest.fixture
    def user_config(self):
        return UserConfig(
            user_id="test_user",
            max_daily_loss=500.0,
            max_drawdown_percent=15.0,
            max_position_size=0.5,
            max_positions=3,
        )

    @pytest.mark.asyncio
    async def test_blocks_when_user_max_positions_reached(self, risk, user_config):
        signal = Signal(
            id="test-pos-1",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        verdict = await risk.check_signal(signal, user_config, open_position_count=5, user_position_count=3)
        assert verdict == RiskVerdict.BLOCK

    @pytest.mark.asyncio
    async def test_passes_when_user_under_max_positions(self, risk, user_config):
        signal = Signal(
            id="test-pos-2",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        verdict = await risk.check_signal(signal, user_config, open_position_count=5, user_position_count=2)
        assert verdict == RiskVerdict.PASS

    @pytest.mark.asyncio
    async def test_user_position_limit_independent_of_global(self, risk, user_config):
        """User limit should block even when global limit is not reached."""
        signal = Signal(
            id="test-pos-3",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        # Global limit is 20, user has 3 positions (at limit), but only 5 open globally
        verdict = await risk.check_signal(signal, user_config, open_position_count=5, user_position_count=3)
        assert verdict == RiskVerdict.BLOCK

    @pytest.mark.asyncio
    async def test_global_limit_blocks_even_when_user_under_limit(self, risk, user_config):
        signal = Signal(
            id="test-pos-4",
            action=SignalAction.BUY,
            market="PAXGUSDT",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        # Global limit is 20, user has 2 positions (under limit), but 20 open globally
        verdict = await risk.check_signal(signal, user_config, open_position_count=20, user_position_count=2)
        assert verdict == RiskVerdict.BLOCK


class TestCalculateVolumeValidation:
    """Test max_position_size validation in engine._calculate_volume."""

    @pytest.fixture
    def engine(self):
        return Engine(
            config=EngineConfig(),
            broker=PaperBroker(initial_balance=10000.0),
            gate=HumanGate(),
            risk=RiskEngine(),
        )

    @pytest.mark.asyncio
    async def test_zero_max_position_size_uses_default(self, engine):
        signal = Signal(
            id="vol-1",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        config = UserConfig(user_id="test_user", max_position_size=0)
        volume = await engine._calculate_volume(signal, config)
        assert volume <= 0.5  # default max

    @pytest.mark.asyncio
    async def test_negative_max_position_size_uses_default(self, engine):
        signal = Signal(
            id="vol-2",
            action=SignalAction.BUY,
            market="XAUUSD",
            entry_price=3000.0,
            stop_loss=2990.0,
            confidence=0.8,
            agent="test",
            user_id="test_user",
        )
        config = UserConfig(user_id="test_user", max_position_size=-1.0)
        volume = await engine._calculate_volume(signal, config)
        assert volume <= 0.5  # default max


class TestTradeHistoryAPI:
    """Test trade history API routes."""

    def test_record_and_get_trade(self):
        from src.api.routes.history import record_trade, _trade_history

        # Clear history
        _trade_history.clear()

        trade = {
            "id": "trade-1",
            "symbol": "XAUUSD",
            "action": "BUY",
            "entry_price": 3000.0,
            "exit_price": 3050.0,
            "volume": 0.1,
            "pnl": 500.0,
            "status": "CLOSED",
            "open_time": "2024-01-01T10:00:00Z",
            "close_time": "2024-01-01T12:00:00Z",
        }
        record_trade(trade)

        assert len(_trade_history) == 1
        assert _trade_history[0]["id"] == "trade-1"

    def test_record_order(self):
        from src.api.routes.history import record_order, _order_history

        _order_history.clear()

        order = {
            "id": "order-1",
            "signal_id": "signal-1",
            "action": "BUY",
            "symbol": "XAUUSD",
            "volume": 0.1,
            "price": 3000.0,
            "stop_loss": 2990.0,
            "status": "FILLED",
            "broker": "paper",
            "created_at": "2024-01-01T10:00:00Z",
            "filled_at": "2024-01-01T10:00:01Z",
            "filled_price": 3000.5,
        }
        record_order(order)

        assert len(_order_history) == 1
        assert _order_history[0]["id"] == "order-1"


class TestRateLimitMiddleware:
    """Test rate limiting middleware."""

    def test_middleware_initialization(self):
        from src.api.middleware import RateLimitMiddleware

        # Just test that the middleware can be instantiated
        assert RateLimitMiddleware is not None

    def test_request_tracking_middleware_initialization(self):
        from src.api.middleware import RequestTrackingMiddleware

        assert RequestTrackingMiddleware is not None


class TestAPIRoutes:
    """Test that all API routes are properly registered."""

    def test_app_has_routes(self):
        from src.api.server import app

        # Check that routers are included
        router_names = [type(r).__name__ for r in app.routes]
        assert "_IncludedRouter" in router_names

        # Check that basic routes exist
        route_paths = [r.path for r in app.routes if hasattr(r, "path")]
        assert "/health" in route_paths
        assert "/positions" in route_paths
        assert "/account" in route_paths
        assert "/signal" in route_paths
        assert "/control" in route_paths


class TestStrategyRegistry:
    """Test strategy registry and lifecycle."""

    def test_registry_initialization(self):
        from src.strategies.registry import StrategyRegistry

        registry = StrategyRegistry()
        assert len(registry.strategies) == 0
        assert len(registry.running) == 0

    def test_register_strategy(self):
        from src.strategies.registry import StrategyRegistry
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy

        registry = StrategyRegistry()
        config = StrategyConfig(name="test-scalp", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)
        registry.register(strategy)

        assert "test-scalp" in registry.strategies
        assert registry.get("test-scalp") == strategy

    def test_unregister_strategy(self):
        from src.strategies.registry import StrategyRegistry
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy

        registry = StrategyRegistry()
        config = StrategyConfig(name="test-scalp", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)
        registry.register(strategy)

        assert registry.unregister("test-scalp")
        assert "test-scalp" not in registry.strategies

    def test_unregister_running_strategy_fails(self):
        import asyncio
        from src.strategies.registry import StrategyRegistry
        from src.strategies.base import StrategyConfig, StrategyType, StrategyStatus
        from src.strategies.templates.scalping import ScalpingStrategy

        registry = StrategyRegistry()
        config = StrategyConfig(name="test-scalp", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)
        registry.register(strategy)
        strategy.status = StrategyStatus.RUNNING

        with pytest.raises(RuntimeError):
            registry.unregister("test-scalp")

    def test_get_strategy_types(self):
        from src.strategies.registry import StrategyRegistry, load_builtin_strategies

        registry = StrategyRegistry()
        load_builtin_strategies(registry)

        assert "scalping" in registry.available_types
        assert "swing" in registry.available_types
        assert "mean_reversion" in registry.available_types
        assert "momentum" in registry.available_types


class TestScalpingStrategy:
    """Test scalping strategy template."""

    def test_initialization(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy

        config = StrategyConfig(name="test-scalp", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)

        assert strategy.name == "test-scalp"
        assert strategy.config.strategy_type == StrategyType.SCALPING
        assert "rsi_period" in strategy.config.params
        assert "fast_ma" in strategy.config.params

    @pytest.mark.asyncio
    async def test_analyze_returns_none_with_insufficient_data(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy
        from src.core.types import Market
        from datetime import datetime, UTC

        config = StrategyConfig(name="test-scalp", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)

        # Not enough data
        market_data = [
            Market(
                symbol="XAUUSD", timeframe="M5", bid=3000.0, ask=3000.1,
                open=2999.0, high=3001.0, low=2998.0, close=3000.0,
                volume=100, timestamp=datetime.now(UTC)
            )
            for _ in range(5)
        ]

        signal = await strategy.analyze(market_data)
        assert signal is None


class TestSwingStrategy:
    """Test swing strategy template."""

    def test_initialization(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.swing import SwingStrategy

        config = StrategyConfig(name="test-swing", strategy_type=StrategyType.SWING)
        strategy = SwingStrategy(config)

        assert strategy.name == "test-swing"
        assert strategy.config.strategy_type == StrategyType.SWING
        assert "ema_fast" in strategy.config.params
        assert "atr_period" in strategy.config.params


class TestMeanReversionStrategy:
    """Test mean reversion strategy template."""

    def test_initialization(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.mean_reversion import MeanReversionStrategy

        config = StrategyConfig(name="test-mr", strategy_type=StrategyType.MEAN_REVERSION)
        strategy = MeanReversionStrategy(config)

        assert strategy.name == "test-mr"
        assert strategy.config.strategy_type == StrategyType.MEAN_REVERSION
        assert "bb_period" in strategy.config.params
        assert "z_score_threshold" in strategy.config.params


class TestMomentumStrategy:
    """Test momentum strategy template."""

    def test_initialization(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.momentum import MomentumStrategy

        config = StrategyConfig(name="test-mom", strategy_type=StrategyType.MOMENTUM)
        strategy = MomentumStrategy(config)

        assert strategy.name == "test-mom"
        assert strategy.config.strategy_type == StrategyType.MOMENTUM
        assert "macd_fast" in strategy.config.params
        assert "adx_threshold" in strategy.config.params


class TestStrategyStats:
    """Test strategy performance tracking."""

    def test_record_trade_win(self):
        from src.strategies.base import StrategyConfig, StrategyType, StrategyStats
        from src.strategies.templates.scalping import ScalpingStrategy

        config = StrategyConfig(name="test", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)

        strategy.record_trade(100.0)

        assert strategy.stats.total_trades == 1
        assert strategy.stats.winning_trades == 1
        assert strategy.stats.losing_trades == 0
        assert strategy.stats.total_pnl == 100.0
        assert strategy.stats.win_rate == 100.0

    def test_record_trade_loss(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy

        config = StrategyConfig(name="test", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)

        strategy.record_trade(-50.0)

        assert strategy.stats.total_trades == 1
        assert strategy.stats.winning_trades == 0
        assert strategy.stats.losing_trades == 1
        assert strategy.stats.total_pnl == -50.0
        assert strategy.stats.win_rate == 0.0

    def test_multiple_trades(self):
        from src.strategies.base import StrategyConfig, StrategyType
        from src.strategies.templates.scalping import ScalpingStrategy

        config = StrategyConfig(name="test", strategy_type=StrategyType.SCALPING)
        strategy = ScalpingStrategy(config)

        strategy.record_trade(100.0)
        strategy.record_trade(-50.0)
        strategy.record_trade(75.0)

        assert strategy.stats.total_trades == 3
        assert strategy.stats.winning_trades == 2
        assert strategy.stats.losing_trades == 1
        assert strategy.stats.total_pnl == 125.0
        assert strategy.stats.win_rate == pytest.approx(66.67, rel=1e-2)


class TestConsensusValidator:
    """Test multi-model consensus validation."""

    def test_consensus_result_initialization(self):
        from src.ai.consensus import ConsensusResult

        result = ConsensusResult(verdict="SAFE", confidence=0.8)
        assert result.verdict == "SAFE"
        assert result.confidence == 0.8
        assert result.votes == []

    def test_consensus_result_to_dict(self):
        from src.ai.consensus import ConsensusResult

        result = ConsensusResult(
            verdict="RISKY",
            confidence=0.9,
            votes=[{"model": "gemini", "verdict": "RISKY"}],
            reasoning="High volatility",
            models_used=["gemini"],
        )
        d = result.to_dict()
        assert d["verdict"] == "RISKY"
        assert d["confidence"] == 0.9
        assert len(d["votes"]) == 1
        assert d["models_used"] == ["gemini"]


class TestRegimeDetector:
    """Test enhanced regime detection."""

    def test_regime_result_initialization(self):
        from src.ai.regime_enhanced import RegimeResult

        result = RegimeResult(
            regime="trending_up",
            confidence=0.85,
            reasoning="Strong upward momentum",
            indicators={"trend": "up", "volatility": "medium"},
        )
        assert result.regime == "trending_up"
        assert result.confidence == 0.85

    def test_strategy_recommendation_trending(self):
        from src.ai.regime_enhanced import EnhancedRegimeDetector, RegimeResult

        detector = EnhancedRegimeDetector()
        result = RegimeResult(
            regime="trending_up",
            confidence=0.85,
            reasoning="",
            indicators={},
        )
        rec = detector.get_strategy_recommendation(result)
        assert "momentum" in rec["preferred_strategies"]
        assert "mean_reversion" in rec["avoid_strategies"]

    def test_strategy_recommendation_ranging(self):
        from src.ai.regime_enhanced import EnhancedRegimeDetector, RegimeResult

        detector = EnhancedRegimeDetector()
        result = RegimeResult(
            regime="ranging",
            confidence=0.7,
            reasoning="",
            indicators={},
        )
        rec = detector.get_strategy_recommendation(result)
        assert "mean_reversion" in rec["preferred_strategies"]
        assert "momentum" in rec["avoid_strategies"]


class TestTradeJournal:
    """Test natural language trade journal."""

    def test_journal_entry_initialization(self):
        from src.ai.trade_journal import JournalEntry
        from datetime import datetime, UTC

        entry = JournalEntry(
            trade_id="t1",
            symbol="XAUUSD",
            action="BUY",
            entry_price=3000.0,
            exit_price=3050.0,
            volume=0.1,
            pnl=500.0,
        )
        assert entry.trade_id == "t1"
        assert entry.pnl == 500.0

    def test_journal_entry_to_dict(self):
        from src.ai.trade_journal import JournalEntry

        entry = JournalEntry(
            trade_id="t1",
            symbol="XAUUSD",
            action="BUY",
            entry_price=3000.0,
            pnl=100.0,
        )
        d = entry.to_dict()
        assert d["trade_id"] == "t1"
        assert d["pnl"] == 100.0
        assert "timestamp" in d

    def test_journal_stats(self):
        from src.ai.trade_journal import TradeJournal

        journal = TradeJournal()
        stats = journal.get_stats()
        assert stats["total_trades"] == 0
        assert stats["win_rate"] == 0.0


class TestRiskAdvisor:
    """Test AI-powered risk advisor."""

    def test_risk_suggestion_initialization(self):
        from src.ai.risk_advisor import RiskSuggestion

        suggestion = RiskSuggestion(
            category="position_sizing",
            suggestion="Reduce position size",
            priority="high",
            reasoning="High exposure",
            confidence=0.9,
        )
        assert suggestion.category == "position_sizing"
        assert suggestion.priority == "high"

    def test_risk_suggestion_to_dict(self):
        from src.ai.risk_advisor import RiskSuggestion

        suggestion = RiskSuggestion(
            category="stop_loss",
            suggestion="Tighten stops",
            priority="medium",
            reasoning="Market volatility",
            confidence=0.7,
        )
        d = suggestion.to_dict()
        assert d["category"] == "stop_loss"
        assert d["priority"] == "medium"

    def test_risk_advisor_initialization(self):
        from src.ai.risk_advisor import RiskAdvisor

        advisor = RiskAdvisor()
        suggestions = advisor.get_stats() if hasattr(advisor, 'get_stats') else []
        assert isinstance(advisor._risk_limits, dict)
        assert "max_daily_loss" in advisor._risk_limits


class TestSymbolRouter:
    """Test multi-asset symbol routing."""

    def test_router_initialization(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        assert len(router._symbol_map) > 0
        assert len(router._broker_configs) > 0

    def test_get_symbol_for_broker(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        # Test gold
        assert router.get_symbol_for_broker("XAUUSD", "mt5") == "XAUUSD"
        assert router.get_symbol_for_broker("XAUUSD", "binance") == "PAXGUSDT"
        # Test forex
        assert router.get_symbol_for_broker("EURUSD", "mt5") == "EURUSD"
        assert router.get_symbol_for_broker("EURUSD", "binance") == "EURUSDT"

    def test_get_asset_type(self):
        from src.routing.symbol_router import SymbolRouter, AssetType

        router = SymbolRouter()
        assert router.get_asset_type("XAUUSD") == AssetType.COMMODITY
        assert router.get_asset_type("EURUSD") == AssetType.FOREX
        assert router.get_asset_type("BTCUSDT") == AssetType.CRYPTO

    def test_get_best_broker(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        # Gold should prefer MT5
        best = router.get_best_broker("XAUUSD")
        assert best == "mt5"

        # BTC should prefer Binance
        best = router.get_best_broker("BTCUSDT")
        assert best == "binance"

    def test_get_all_brokers_for_symbol(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        brokers = router.get_all_brokers_for_symbol("XAUUSD")
        assert "mt5" in brokers
        assert "binance" in brokers
        assert "ibkr" in brokers

    def test_calculate_position_size(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        # Test position size calculation
        size = router.calculate_position_size(
            symbol="XAUUSD",
            broker_name="mt5",
            account_balance=10000,
            risk_percentage=0.02,
            stop_loss_pips=50,
        )
        assert size > 0
        assert size <= 10.0  # MT5 max position size

    def test_normalize_symbol(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        # Test normalization
        assert router.normalize_symbol("XAUUSD", "binance") == "PAXGUSDT"
        assert router.normalize_symbol("EURUSD", "mt5") == "EURUSD"

    def test_is_symbol_supported(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        assert router.is_symbol_supported("XAUUSD", "mt5") is True
        assert router.is_symbol_supported("XAUUSD", "unknown") is False
        assert router.is_symbol_supported("UNKNOWN") is False

    def test_get_all_symbols(self):
        from src.routing.symbol_router import SymbolRouter

        router = SymbolRouter()
        symbols = router.get_all_symbols()
        assert "XAUUSD" in symbols
        assert "EURUSD" in symbols
        assert "BTCUSDT" in symbols


class TestUserManager:
    """Test multi-user management."""

    def test_create_user(self):
        from src.users.manager import UserManager, UserTier

        manager = UserManager()
        user = manager.create_user("user1", "test@example.com", "Test User", UserTier.FREE)
        assert user.user_id == "user1"
        assert user.tier == UserTier.FREE
        assert user.status.value == "active"

    def test_get_user(self):
        from src.users.manager import UserManager

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User")
        user = manager.get_user("user1")
        assert user is not None
        assert user.email == "test@example.com"

    def test_update_user_tier(self):
        from src.users.manager import UserManager, UserTier

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User")
        assert manager.update_user_tier("user1", UserTier.PRO) is True
        user = manager.get_user("user1")
        assert user.tier == UserTier.PRO

    def test_check_strategy_limit(self):
        from src.users.manager import UserManager, UserTier

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User", UserTier.FREE)
        can_add, current, max_allowed = manager.check_strategy_limit("user1")
        assert can_add is True
        assert current == 0
        assert max_allowed == 2  # Free tier limit

    def test_check_position_limit(self):
        from src.users.manager import UserManager, UserTier

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User", UserTier.FREE)
        can_add, current, max_allowed = manager.check_position_limit("user1")
        assert can_add is True
        assert current == 0
        assert max_allowed == 3  # Free tier limit

    def test_increment_strategy_count(self):
        from src.users.manager import UserManager, UserTier

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User", UserTier.FREE)
        assert manager.increment_strategy_count("user1") is True
        usage = manager.get_user_usage("user1")
        assert usage.strategies_count == 1

    def test_suspend_user(self):
        from src.users.manager import UserManager

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User")
        assert manager.suspend_user("user1") is True
        user = manager.get_user("user1")
        assert user.status.value == "suspended"

    def test_get_user_count(self):
        from src.users.manager import UserManager

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "User 1")
        manager.create_user("user2", "test2@example.com", "User 2")
        assert manager.get_user_count() == 2

    def test_delete_user(self):
        from src.users.manager import UserManager

        manager = UserManager()
        manager.create_user("user1", "test@example.com", "Test User")
        assert manager.delete_user("user1") is True
        assert manager.get_user("user1") is None


class TestCache:
    """Test caching system."""

    def test_lru_cache_set_get(self):
        from src.cache import LRUCache

        cache = LRUCache(max_size=100)
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_lru_cache_eviction(self):
        from src.cache import LRUCache

        cache = LRUCache(max_size=2)
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")  # Should evict key1
        assert cache.get("key1") is None
        assert cache.get("key2") == "value2"
        assert cache.get("key3") == "value3"

    def test_lru_cache_ttl(self):
        import time
        from src.cache import LRUCache

        cache = LRUCache(max_size=100, default_ttl=0.1)  # 100ms TTL
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        time.sleep(0.2)  # Wait for TTL
        assert cache.get("key1") is None

    def test_lru_cache_stats(self):
        from src.cache import LRUCache

        cache = LRUCache(max_size=100)
        cache.set("key1", "value1")
        cache.get("key1")  # Hit
        cache.get("key2")  # Miss
        stats = cache.get_stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 50.0

    def test_cache_manager(self):
        from src.cache import CacheManager

        manager = CacheManager()
        cache1 = manager.get_cache("cache1")
        cache2 = manager.get_cache("cache2")
        cache1.set("key", "value")
        assert cache1.get("key") == "value"
        assert cache2.get("key") is None


class TestMonitoring:
    """Test monitoring and alerting."""

    def test_metrics_collector(self):
        from src.monitoring import MetricsCollector, MetricType

        collector = MetricsCollector()
        collector.record_counter("test_counter", 1.0)
        assert collector.get_counter("test_counter") == 1.0

    def test_metrics_gauge(self):
        from src.monitoring import MetricsCollector

        collector = MetricsCollector()
        collector.record_gauge("test_gauge", 42.0)
        assert collector.get_gauge("test_gauge") == 42.0

    def test_alert_manager(self):
        from src.monitoring import AlertManager, AlertSeverity

        manager = AlertManager()
        alert = manager.create_alert(
            AlertSeverity.WARNING,
            "Test alert",
            "test_source",
        )
        assert alert.severity == AlertSeverity.WARNING
        assert alert.resolved is False

    def test_resolve_alert(self):
        from src.monitoring import AlertManager, AlertSeverity

        manager = AlertManager()
        alert = manager.create_alert(
            AlertSeverity.WARNING,
            "Test alert",
            "test_source",
        )
        assert manager.resolve_alert(alert.alert_id) is True
        assert alert.resolved is True

    def test_health_checker(self):
        from src.monitoring import HealthChecker, HealthCheck

        checker = HealthChecker()
        checker.register_check(
            "test_check",
            lambda: HealthCheck(name="test_check", status="ok", message="All good"),
        )
        result = checker.run_check("test_check")
        assert result.status == "ok"

    def test_performance_monitor(self):
        from src.monitoring import PerformanceMonitor

        monitor = PerformanceMonitor()
        monitor.record_request("/api/test", "GET", 200, 10.0)
        stats = monitor.get_system_stats()
        assert stats["total_requests"] == 1
        assert stats["total_errors"] == 0
