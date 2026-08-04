from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from ..agents.base import Agent, AgentStatus
from ..ai.registry import AIRegistry
from ..api.routes.sync import get_store as get_sync_store
from ..broker.base import Broker
from ..gate.human_gate import GateDecision, HumanGate
from ..risk.engine import RiskEngine
from .config import EngineConfig
from .session import get_session_name, is_active_session
from .signal_bus import SignalBus
from .types import (
    Order,
    OrderStatus,
    RiskVerdict,
    Signal,
    SignalAction,
    SignalDecision,
    UserConfig,
)

log = logging.getLogger("xmbot.engine")


class Engine:
    def __init__(
        self,
        config: EngineConfig,
        broker: Broker,
        gate: HumanGate,
        risk: RiskEngine,
        signal_bus: SignalBus | None = None,
        ai_registry: AIRegistry | None = None,
    ) -> None:
        self.config = config
        self.broker = broker
        self.gate = gate
        self.risk = risk
        self.signal_bus = signal_bus or SignalBus()
        self.ai_registry = ai_registry or AIRegistry()
        self._agents: dict[str, Agent] = {}
        self._user_configs: dict[str, UserConfig] = {}
        self._running = False
        self._paused = False
        self._control_lock = asyncio.Lock()
        self._tasks: list[asyncio.Task] = []
        self._position_atr: dict[str, float] = {}  # position_id -> ATR at entry
        self._regime_cache: dict[str, dict] = {}  # symbol -> regime info
        self._regime_cache_ttl = 3600  # 1 hour cache

    @property
    def agents(self) -> dict[str, Agent]:
        return dict(self._agents)

    @property
    def running(self) -> bool:
        return self._running

    @property
    def paused(self) -> bool:
        return self._paused

    def register_agent(self, agent: Agent) -> None:
        self._agents[agent.name] = agent
        log.info(f"Registered agent: {agent.name}")

    def register_user(self, config: UserConfig) -> None:
        self._user_configs[config.user_id] = config
        log.info(f"Registered user: {config.user_id}")

    def update_agent_params(self, agent_name: str, params: dict) -> dict:
        """Push live strategy-parameter overrides to a registered agent.

        Raises KeyError if no such agent is registered, or TypeError if the
        agent doesn't support live parameter updates.
        """
        agent = self._agents.get(agent_name)
        if agent is None:
            raise KeyError(f"No such agent: {agent_name}")
        if not hasattr(agent, "update_params"):
            raise TypeError(f"Agent {agent_name!r} does not support live parameter updates")
        return agent.update_params(**params)

    async def start(self) -> None:
        async with self._control_lock:
            if self._running:
                log.warning("start() called while already running — ignoring")
                return

            log.info("Engine starting...")

            connected = await self.broker.connect()
            if not connected:
                log.error("Broker connection failed")
                return

            for agent in self._agents.values():
                await agent.on_start()

            self._running = True
            self._paused = False

            for agent in self._agents.values():
                task = asyncio.create_task(self._agent_loop(agent))
                self._tasks.append(task)

            self._tasks.append(asyncio.create_task(self._sync_loop()))

            if self.config.trailing_stop_enabled:
                self._tasks.append(asyncio.create_task(self._monitor_positions()))

            log.info(f"Engine running with {len(self._agents)} agent(s)")

    async def stop(self) -> None:
        async with self._control_lock:
            if not self._running:
                log.warning("stop() called while already stopped — ignoring")
                return

            log.info("Engine stopping...")
            self._running = False
            self._paused = False

            for task in self._tasks:
                task.cancel()
            await asyncio.gather(*self._tasks, return_exceptions=True)
            self._tasks = []

            await self.gate.cancel_all()

            for agent in self._agents.values():
                await agent.on_stop()

            await self.broker.disconnect()
            log.info("Engine stopped")

    async def restart(self) -> None:
        await self.stop()
        await self.start()

    def pause(self) -> None:
        """Idle the agent loops without disconnecting the broker or dropping tasks."""
        self._paused = True
        log.info("Engine paused")

    def resume(self) -> None:
        self._paused = False
        log.info("Engine resumed")

    def switch_broker(self, broker_type: str) -> None:
        """Swap the active broker. Only permitted while the engine is stopped."""
        if self._running:
            raise RuntimeError("Stop the engine before switching brokers")

        from .broker_factory import create_broker

        self.broker = create_broker(self.config, broker_type)
        self.config.default_broker = broker_type
        log.info(f"Broker switched to {broker_type}")

    async def _sync_loop(self) -> None:
        """Periodically push trade data to the sync API store."""
        while self._running:
            try:
                positions = await self.broker.get_positions()
                account = await self.broker.get_account()

                store = get_sync_store()

                if positions:
                    store["trades"] = [
                        {
                            "id": p.id,
                            "symbol": p.symbol,
                            "action": p.direction.value,
                            "open_price": p.entry_price,
                            "close_price": None,
                            "lot_size": p.volume,
                            "profit": p.unrealized_pnl,
                            "stop_loss": p.stop_loss,
                            "take_profit": p.take_profit,
                            "open_time": p.open_time.isoformat(),
                            "close_time": None,
                            "status": "OPEN",
                        }
                        for p in positions
                    ]

                if account:
                    self._cached_balance = account.balance
                    total = len(store["trades"])
                    winning = sum(1 for t in store["trades"] if t.get("profit", 0) > 0)
                    total_pnl = sum(t.get("profit", 0) for t in store["trades"])

                    store["metrics"] = {
                        "total_trades": total,
                        "winning_trades": winning,
                        "win_rate": (winning / total * 100) if total > 0 else 0,
                        "total_pnl": total_pnl,
                        "open_trades": len([t for t in store["trades"] if t["status"] == "OPEN"]),
                        "account_balance": account.balance,
                        "account_equity": account.equity,
                    }

                store["last_sync"] = datetime.utcnow().isoformat()

            except Exception as e:
                log.error(f"Sync error: {e}")

            await asyncio.sleep(30)

    async def _monitor_positions(self) -> None:
        """Monitor open positions and trail stop loss, check drawdown."""
        while self._running:
            try:
                positions = await self.broker.get_positions()
                account = await self.broker.get_account()

                if account:
                    user_id = self._resolve_user_id()
                    user_config = self._user_configs.get(user_id)
                    if user_config:
                        drawdown_breached = await self.risk.check_drawdown(
                            user_id, account.balance, user_config.max_drawdown_percent
                        )
                        if drawdown_breached:
                            log.warning(f"Drawdown limit breached — pausing new trades for {user_id}")
                            for pos in positions:
                                await self.broker.cancel_order(pos.id)

                for pos in positions:
                    entry_atr = self._position_atr.get(pos.id)
                    if entry_atr is None or entry_atr <= 0:
                        continue

                    activation_distance = entry_atr * self.config.trailing_stop_activation_atr
                    trail_distance = entry_atr * self.config.trailing_stop_distance_atr

                    if pos.direction == SignalAction.BUY:
                        profit_distance = pos.current_price - pos.entry_price
                        if profit_distance >= activation_distance:
                            new_sl = pos.current_price - trail_distance
                            if new_sl > pos.stop_loss:
                                success = await self.broker.modify_position(pos.id, stop_loss=new_sl)
                                if success:
                                    log.info(f"Trailing stop: {pos.symbol} SL moved to {new_sl:.2f} (was {pos.stop_loss:.2f})")

                    elif pos.direction == SignalAction.SELL:
                        profit_distance = pos.entry_price - pos.current_price
                        if profit_distance >= activation_distance:
                            new_sl = pos.current_price + trail_distance
                            if new_sl < pos.stop_loss:
                                success = await self.broker.modify_position(pos.id, stop_loss=new_sl)
                                if success:
                                    log.info(f"Trailing stop: {pos.symbol} SL moved to {new_sl:.2f} (was {pos.stop_loss:.2f})")

            except Exception as e:
                log.error(f"Position monitor error: {e}")

            await asyncio.sleep(15)

    async def _agent_loop(self, agent: Agent) -> None:
        while self._running:
            try:
                if self._paused:
                    await asyncio.sleep(self.config.tick_interval_seconds)
                    continue

                if agent.config.confirmation_timeframe:
                    m5_data, h1_data = await self._fetch_markets_multi_tf(agent)
                else:
                    m5_data = await self._fetch_markets(agent)
                    h1_data = None

                if not m5_data:
                    await asyncio.sleep(self.config.tick_interval_seconds)
                    continue
                if agent.config.confirmation_timeframe and hasattr(agent, "analyze_with_confirmation"):
                    signal = agent.analyze_with_confirmation(m5_data, h1_data)
                else:
                    signal = await agent.analyze(m5_data)

                if signal is None:
                    await asyncio.sleep(self.config.candle_interval_seconds)
                    continue

                if not is_active_session():
                    log.debug(f"[{agent.name}] Skipping signal — off-peak session ({get_session_name()})")
                    await asyncio.sleep(self.config.candle_interval_seconds)
                    continue

                agent.status = AgentStatus.WAITING_APPROVAL
                signal.user_id = self._resolve_user_id()

                user_config = self._user_configs.get(signal.user_id, UserConfig(user_id=signal.user_id))
                open_positions = await self.broker.get_positions()
                risk_verdict = await self.risk.check_signal(signal, user_config, len(open_positions))

                if risk_verdict == RiskVerdict.BLOCK:
                    log.warning(f"Risk blocked signal: {signal.action} {signal.market}")
                    agent.status = AgentStatus.ANALYZING
                    continue

                if self.config.ai_validation_enabled:
                    signal.metadata["ai_verdict"] = await self.analyze_trade_with_ai(signal, m5_data)

                await self.signal_bus.emit_signal(signal)

                decision = await self._await_human_approval(signal, agent)

                if decision.decision == SignalDecision.APPROVED:
                    await agent.on_signal_approved(signal)
                    await self._execute_signal(signal, user_config)

                elif decision.decision == SignalDecision.MODIFIED:
                    signal.entry_price = decision.modified_price or signal.entry_price
                    signal.stop_loss = decision.modified_stop_loss or signal.stop_loss
                    await agent.on_signal_approved(signal)
                    await self._execute_signal(signal, user_config)

                elif decision.decision == SignalDecision.REJECTED:
                    await agent.on_signal_rejected(signal)

                else:
                    await agent.on_signal_timeout(signal)

                agent.status = AgentStatus.ANALYZING

            except asyncio.CancelledError:
                break
            except Exception as e:
                await agent.on_error(e)
                await asyncio.sleep(5)

    async def _fetch_markets(self, agent: Agent) -> list:
        markets = []
        for symbol in agent.config.markets:
            data = await self.broker.get_market_data(symbol, agent.config.timeframe, 100)
            markets.extend(data)
        return markets

    async def _fetch_markets_multi_tf(self, agent: Agent) -> tuple[list, list]:
        """Fetch primary and confirmation timeframe data."""
        primary_data = []
        confirmation_data = []

        for symbol in agent.config.markets:
            data = await self.broker.get_market_data(symbol, agent.config.timeframe, 100)
            primary_data.extend(data)

            if agent.config.confirmation_timeframe:
                h1_data = await self.broker.get_market_data(
                    symbol, agent.config.confirmation_timeframe, 50
                )
                confirmation_data.extend(h1_data)

        return primary_data, confirmation_data

    async def _await_human_approval(self, signal: Signal, agent: Agent) -> GateDecision:
        message = self._format_signal_message(signal)
        decision = await self.gate.submit(signal, user_message=message)
        await self.signal_bus.emit_decision(agent.name, signal.id, decision.decision)
        return decision

    async def _execute_signal(self, signal: Signal, user_config: UserConfig) -> None:
        order = Order(
            id=signal.id,
            signal_id=signal.id,
            action=signal.action,
            market=signal.market,
            volume=self._calculate_volume(signal, user_config),
            price=signal.entry_price,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            broker=self.config.default_broker,
            user_id=signal.user_id,
            status=OrderStatus.PENDING,
        )

        result = await self.broker.place_order(order)
        order.status = OrderStatus.FILLED if result.success else OrderStatus.REJECTED
        order.filled_price = result.filled_price
        order.broker_order_id = result.broker_order_id

        await self.risk.record_trade(order)

        if result.success:
            atr = signal.metadata.get("atr", 0)
            if atr > 0:
                self._position_atr[signal.id] = atr
            log.info(f"Executed: {order.action} {order.market} @ {result.filled_price}")
        else:
            log.error(f"Execution failed: {result.error}")

    def _format_signal_message(self, signal: Signal) -> str:
        message = (
            f"📊 *{signal.agent} Signal*\n"
            f"Action: {signal.action.value} {signal.market}\n"
            f"Entry: ${signal.entry_price:.2f}\n"
            f"SL: ${signal.stop_loss:.2f} (risk: ${signal.risk_amount:.2f})\n"
            f"Confidence: {signal.confidence:.0%}\n"
            f"Reason: {signal.reason}"
        )

        ai_verdict = signal.metadata.get("ai_verdict")
        if ai_verdict and ai_verdict["verdict"] in ("SAFE", "RISKY"):
            icon = "🤖" if ai_verdict["verdict"] == "SAFE" else "⚠️"
            message += f"\n{icon} AI: {ai_verdict['verdict']} — {ai_verdict['reason']}"

        return message

    def _calculate_volume(self, signal: Signal, config: UserConfig) -> float:
        """Risk-based position sizing: risk X% of account per trade."""
        risk_percent = 0.02  # Risk 2% per trade
        account_balance = self._account_balance
        risk_amount = account_balance * risk_percent

        price_risk = abs(signal.entry_price - signal.stop_loss)
        if price_risk <= 0:
            return min(0.01, config.max_position_size)

        # For XAUUSD: 1 lot = 100 oz, point = $0.01
        # Risk per lot = price_risk * 100
        risk_per_lot = price_risk * 100
        if risk_per_lot <= 0:
            return min(0.01, config.max_position_size)

        volume = risk_amount / risk_per_lot
        volume = max(0.01, min(round(volume, 2), config.max_position_size))
        return volume

    @property
    def _account_balance(self) -> float:
        """Get cached account balance for position sizing."""
        if not hasattr(self, "_cached_balance"):
            self._cached_balance = 0.0
        return self._cached_balance

    def _resolve_user_id(self) -> str:
        return next(iter(self._user_configs)) if self._user_configs else "default"

    async def get_market_regime(self, symbol: str, market_data: list) -> dict:
        """Get market regime (trend/range/volatile) using AI or cached data."""
        now = datetime.utcnow().timestamp()

        if symbol in self._regime_cache:
            cached = self._regime_cache[symbol]
            if now - cached.get("timestamp", 0) < self._regime_cache_ttl:
                return cached

        ai = self.ai_registry.default()
        if not ai:
            return {"regime": "unknown", "confidence": 0, "source": "no_ai"}

        try:
            data_summary = self._format_market_summary(market_data)
            response = await ai.generate(
                f"Analyze this XAUUSD market data and classify the regime.\n\n"
                f"Data:\n{data_summary}\n\n"
                f"Reply with JSON: {{\"regime\": \"trending_up|trending_down|ranging|volatile\", "
                f"\"confidence\": 0.0-1.0, \"reason\": \"brief explanation\"}}",
                system="You are a market regime classifier. Reply only with valid JSON."
            )

            if response.error:
                log.warning(f"AI regime detection failed: {response.error}")
                return {"regime": "unknown", "confidence": 0, "source": "error"}

            import json
            result = json.loads(response.content)
            result["timestamp"] = now
            result["source"] = "ai"
            result["model"] = response.model
            result["tokens"] = response.tokens_used

            self._regime_cache[symbol] = result
            log.info(f"Market regime for {symbol}: {result['regime']} ({result['confidence']:.0%})")
            return result

        except Exception as e:
            log.error(f"Regime detection error: {e}")
            return {"regime": "unknown", "confidence": 0, "source": "error"}

    def _format_market_summary(self, market_data: list) -> str:
        """Format market data for AI analysis."""
        if not market_data:
            return "No data available"

        recent = market_data[-20:] if len(market_data) > 20 else market_data
        lines = []
        for m in recent:
            lines.append(
                f"{m.timestamp.strftime('%H:%M')} O:{m.open:.2f} H:{m.high:.2f} "
                f"L:{m.low:.2f} C:{m.close:.2f}"
            )
        return "\n".join(lines)

    async def analyze_trade_with_ai(self, signal: Signal, market_data: list) -> dict:
        """Use AI to validate a trade signal."""
        ai = self.ai_registry.default()
        if not ai:
            return {"verdict": "SKIP", "reason": "No AI available", "source": "no_ai"}

        try:
            data_summary = self._format_market_summary(market_data)
            response = await ai.validate_trade(
                signal_details=(
                    f"Action: {signal.action.value}\n"
                    f"Market: {signal.market}\n"
                    f"Entry: ${signal.entry_price:.2f}\n"
                    f"SL: ${signal.stop_loss:.2f}\n"
                    f"TP: ${signal.take_profit or 0:.2f}\n"
                    f"Confidence: {signal.confidence:.0%}\n"
                    f"Reason: {signal.reason}"
                ),
                market_context=f"Recent M5 data:\n{data_summary}"
            )

            if response.error:
                return {"verdict": "SKIP", "reason": response.error, "source": "error"}

            verdict = "SAFE" if "SAFE" in response.content.upper() else "RISKY"
            return {
                "verdict": verdict,
                "reason": response.content[:200],
                "source": "ai",
                "model": response.model,
                "tokens": response.tokens_used,
            }

        except Exception as e:
            log.error(f"AI trade analysis error: {e}")
            return {"verdict": "SKIP", "reason": str(e), "source": "error"}

    async def generate_daily_report(self, market: str, trades: list[dict]) -> str:
        """Generate a daily market report using AI."""
        ai = self.ai_registry.default()
        if not ai:
            return "AI not available for report generation."

        try:
            trades_summary = "\n".join([
                f"- {t.get('action', '?')} {t.get('symbol', '?')} @ {t.get('open_price', 0):.2f} "
                f"P&L: ${t.get('profit', 0):+.2f}"
                for t in trades[-10:]
            ]) if trades else "No trades today."

            response = await ai.generate_report(
                market=market,
                period="daily",
                data=f"Recent trades:\n{trades_summary}"
            )

            return response.content if not response.error else f"Report error: {response.error}"

        except Exception as e:
            log.error(f"Report generation error: {e}")
            return f"Report error: {e}"
