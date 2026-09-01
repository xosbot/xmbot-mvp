from __future__ import annotations

import asyncio
import logging
import re
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime

from ..agents.base import Agent, AgentStatus
from ..ai.registry import AIRegistry
from ..broker.base import Broker
from ..db.financial_models import OrderIntentStatus
from ..execution.service import ExecutionService
from ..gate.human_gate import GateDecision, HumanGate
from ..reconciliation.models import ReconciliationHealth
from ..reconciliation.service import ReconciliationService
from ..risk.engine import RiskEngine
from .config import EngineConfig
from .instruments import get_contract_size
from .session import get_session_name, is_active_session
from .signal_bus import SignalBus
from .types import (
    AccountInfo,
    AgentConfig,
    Order,
    OrderStatus,
    Position,
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
        alert_callback: Callable[[str], Awaitable[None]] | None = None,
        execution_service: ExecutionService | None = None,
        reconciliation_service: ReconciliationService | None = None,
    ) -> None:
        self.config = config
        self.broker = broker
        self.gate = gate
        self.risk = risk
        self.signal_bus = signal_bus or SignalBus()
        self.ai_registry = ai_registry or AIRegistry()
        self._alert_callback = alert_callback
        self.execution_service = execution_service
        self.reconciliation_service = reconciliation_service
        self._last_alert_at: dict[str, datetime] = {}
        self._agents: dict[str, Agent] = {}
        self._user_configs: dict[str, UserConfig] = {}
        self._running = False
        self._paused = False
        self._control_lock = asyncio.Lock()
        self._tasks: list[asyncio.Task] = []
        self._position_atr: dict[str, float] = {}  # position_id -> ATR at entry
        self._regime_cache: dict[str, dict] = {}  # symbol -> regime info
        self._regime_cache_ttl = 3600  # 1 hour cache
        self._closed_trades: dict[str, dict] = {}  # position_id -> closed trade info
        self._open_positions: dict[str, Position] = {}  # position_id -> Position object for closure detection

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

    async def _alert(self, text: str) -> None:
        if not self._alert_callback:
            return
        try:
            await self._alert_callback(text)
        except Exception:
            log.exception("Failed to send engine alert")

    async def _alert_throttled(
        self, key: str, text: str, min_interval_seconds: float = 300
    ) -> None:
        """Like _alert, but at most once per `min_interval_seconds` per key —
        for loops that retry every few seconds, so a sustained outage sends
        one notification instead of spamming Telegram."""
        now = datetime.now(UTC)
        last = self._last_alert_at.get(key)
        if last and (now - last).total_seconds() < min_interval_seconds:
            return
        self._last_alert_at[key] = now
        await self._alert(text)

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

            for uid, uc in self._user_configs.items():
                if uc.is_expired:
                    log.error(f"Subscription expired for user {uid} — refusing to start")
                    await self._alert(f"Subscription expired for user {uid}. Engine not started.")
                    return

            log.info("Engine starting...")

            connected = await self.broker.connect()
            if not connected:
                log.error("Broker connection failed")
                return

            if self.reconciliation_service:
                health = await self.reconciliation_service.startup_reconcile()
                if health == ReconciliationHealth.UNSAFE:
                    log.error("Startup reconciliation is UNSAFE — strategy loops will not start")
                    await self._alert("🛑 Startup reconciliation unsafe. No new trades allowed.")
                    await self.broker.disconnect()
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
        """Refresh the cache and flag disappeared positions for reconciliation.

        Position disappearance never finalizes a trade or P&L here. Only the
        broker-authoritative reconciliation path may do that.
        """
        from ..api.routes.sync import USER_STORES
        
        while self._running:
            try:
                positions = await self.broker.get_positions()
                account = await self.broker.get_account()
                
                current_position_ids = {p.id for p in positions}
                previous_position_ids = set(self._open_positions.keys())
                closed_position_ids = previous_position_ids - current_position_ids
                
                for pos_id in closed_position_ids:
                    old_pos = self._open_positions.get(pos_id)
                    if old_pos is None:
                        continue
                    log.warning(
                        "Position disappeared; awaiting broker reconciliation position_id=%s symbol=%s",
                        old_pos.broker_position_id or pos_id,
                        old_pos.symbol,
                    )
                    await self._alert_throttled(
                        f"position_disappeared:{pos_id}",
                        f"⚠️ Position {old_pos.symbol}/{old_pos.broker_position_id or pos_id} "
                        "disappeared. P&L is unresolved; reconciliation required.",
                    )

                if self.reconciliation_service:
                    await self.reconciliation_service.reconcile_all()
                
                for pos in positions:
                    self._open_positions[pos.id] = pos
                
                for pos_id in closed_position_ids:
                    if pos_id in self._open_positions:
                        del self._open_positions[pos_id]
                
                user_id = "default"
                if user_id not in USER_STORES:
                    USER_STORES[user_id] = {
                        "trades": [],
                        "metrics": {
                            "total_trades": 0,
                            "winning_trades": 0,
                            "win_rate": 0.0,
                            "total_pnl": 0.0,
                            "open_trades": 0,
                            "account_balance": 10000.0,
                            "account_equity": 10000.0,
                        },
                        "last_sync": None,
                    }
                
                store = USER_STORES[user_id]
                
                open_trades = [
                    {
                        "id": p.id,
                        "user_id": getattr(p, 'user_id', 'anonymous'),
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
                
                closed_trades_list = list(self._closed_trades.values())
                store["trades"] = open_trades + closed_trades_list
                
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

                store["last_sync"] = datetime.now(UTC).isoformat()

            except Exception as e:
                log.error(f"Sync error: {e}")
                await self._alert_throttled("sync_loop", f"⚠️ Trade sync failing: {e}")

            await asyncio.sleep(30)

    async def _on_trade_closed(self, trade: dict, account: AccountInfo | None) -> None:
        """Called when a position closes. Wires AI risk advisor and trade journal."""
        try:
            from ..ai.risk_advisor import RiskAdvisor
            from ..ai.trade_journal import TradeJournal

            ai = self.ai_registry.default()

            risk_advisor = RiskAdvisor(ai_provider=ai)
            positions = await self.broker.get_positions()
            daily_pnl = trade.get("profit", 0.0)

            suggestions = await risk_advisor.analyze_risk(
                current_positions=positions,
                account_balance=account.balance if account else 0.0,
                daily_pnl=daily_pnl,
                recent_trades=list(self._closed_trades.values())[-10:],
            )

            if suggestions:
                from ..api.routes.sync import USER_STORES
                uid = trade.get("user_id", "default")
                if uid in USER_STORES:
                    USER_STORES[uid].setdefault("risk_suggestions", [])
                    USER_STORES[uid]["risk_suggestions"] = [s.to_dict() for s in suggestions[-5:]]
                log.info(f"Risk advisor: {len(suggestions)} suggestions for trade {trade['id']}")
        except Exception as e:
            log.warning(f"Risk advisor skipped: {e}")

        try:
            from ..ai.trade_journal import TradeJournal

            ai = self.ai_registry.default()
            journal = TradeJournal(ai_provider=ai)

            await journal.record_trade(
                trade_id=trade["id"],
                symbol=trade["symbol"],
                action=trade["action"],
                entry_price=trade["open_price"],
                exit_price=trade["close_price"],
                volume=trade["lot_size"],
                pnl=trade.get("profit", 0.0),
            )

            from ..api.routes.sync import USER_STORES
            uid = trade.get("user_id", "default")
            if uid in USER_STORES:
                USER_STORES[uid].setdefault("journal_entries", [])
                entry = journal._entries[-1].to_dict() if journal._entries else {}
                if entry:
                    USER_STORES[uid]["journal_entries"].append(entry)
            log.info(f"Trade journal: recorded {trade['id']}")
        except Exception as e:
            log.warning(f"Trade journal skipped: {e}")

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
                            log.warning(
                                f"Drawdown limit breached — flattening all positions "
                                f"and pausing engine for {user_id}"
                            )
                            # Flatten all open positions (real exchange orders)
                            for pos in positions:
                                try:
                                    await self.broker.cancel_order(pos.id)
                                    await self.risk.record_pnl(user_id, 0)  # realized at market
                                except Exception as e:
                                    log.error(f"Failed to flatten position {pos.id}: {e}")

                            # Pause engine to block new trades
                            self.pause()
                            await self._alert(
                                f"🛑 *Drawdown Limit Breached*\n"
                                f"Balance: ${account.balance:.2f}\n"
                                f"All positions flattened. Engine paused."
                            )
                            continue  # skip trailing-stop logic this tick

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
                                    log.info(
                                        f"Trailing stop: {pos.symbol} SL moved to "
                                        f"{new_sl:.2f} (was {pos.stop_loss:.2f})"
                                    )

                    elif pos.direction == SignalAction.SELL:
                        profit_distance = pos.entry_price - pos.current_price
                        if profit_distance >= activation_distance:
                            new_sl = pos.current_price + trail_distance
                            if new_sl < pos.stop_loss:
                                success = await self.broker.modify_position(pos.id, stop_loss=new_sl)
                                if success:
                                    log.info(
                                        f"Trailing stop: {pos.symbol} SL moved to "
                                        f"{new_sl:.2f} (was {pos.stop_loss:.2f})"
                                    )

            except Exception as e:
                log.error(f"Position monitor error: {e}")
                await self._alert_throttled(
                    "position_monitor", f"⚠️ Position monitoring failing: {e}"
                )

            await asyncio.sleep(15)

    async def _agent_loop(self, agent: Agent) -> None:
        while self._running:
            try:
                if self._paused:
                    await asyncio.sleep(self.config.tick_interval_seconds)
                    continue

                user_id = self._resolve_user_id()
                user_config = self._user_configs.get(user_id)
                if user_config and user_config.is_expired:
                    log.warning(f"Subscription expired for {user_id} — pausing agent {agent.name}")
                    await self._alert(f"Subscription expired for {user_id}. Engine paused.")
                    self.pause()
                    break

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
                agent_config = user_config.agent_configs.get(signal.agent, AgentConfig(name="default"))
                user_position_count = sum(
                    1 for p in open_positions if hasattr(p, "symbol") and p.symbol in agent_config.markets
                )
                volume = await self._calculate_volume(signal, user_config)
                risk_verdict = await self.risk.check_signal(
                    signal, user_config, len(open_positions), user_position_count,
                    account_balance=self._account_balance, volume=volume,
                )

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
                    await self._execute_signal(signal, user_config, volume)

                elif decision.decision == SignalDecision.MODIFIED:
                    signal.entry_price = decision.modified_price or signal.entry_price
                    signal.stop_loss = decision.modified_stop_loss or signal.stop_loss
                    await agent.on_signal_approved(signal)
                    # Entry/stop moved — the pre-approval volume no longer reflects the
                    # risk check that was actually run, so re-derive it from the modified signal.
                    await self._execute_signal(signal, user_config, await self._calculate_volume(signal, user_config))

                elif decision.decision == SignalDecision.REJECTED:
                    await agent.on_signal_rejected(signal)

                else:
                    await agent.on_signal_timeout(signal)

                agent.status = AgentStatus.ANALYZING

            except asyncio.CancelledError:
                break
            except Exception as e:
                was_error = agent.status == AgentStatus.ERROR
                await agent.on_error(e)
                if agent.status == AgentStatus.ERROR and not was_error:
                    await self._alert(
                        f"⚠️ Agent '{agent.name}' disabled after repeated errors: {e}"
                    )
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

    async def _execute_signal(self, signal: Signal, user_config: UserConfig, volume: float) -> None:
        order = Order(
            id=signal.id,
            signal_id=signal.id,
            action=signal.action,
            market=signal.market,
            volume=volume,
            price=signal.entry_price,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            broker=self.config.default_broker,
            user_id=signal.user_id,
            status=OrderStatus.PENDING,
        )

        if self.execution_service is None:
            raise RuntimeError("ExecutionService is required; direct broker submission is disabled")

        outcome = await self.execution_service.execute(signal, volume=volume)
        order.status = (
            OrderStatus.FILLED
            if outcome.status == OrderIntentStatus.FILLED
            else OrderStatus.PENDING
        )
        order.filled_price = (
            float(outcome.filled_price) if outcome.filled_price is not None else None
        )
        order.broker_order_id = outcome.broker_order_id

        if outcome.status == OrderIntentStatus.FILLED:
            if not outcome.duplicate_prevented:
                await self.risk.record_trade(order)
            atr = signal.metadata.get("atr", 0)
            if atr > 0:
                self._position_atr[signal.id] = atr
            log.info(
                "Executed order user_id=%s signal_id=%s intent_id=%s client_order_id=%s broker_order_id=%s",
                signal.user_id,
                signal.id,
                outcome.intent_id,
                outcome.client_order_id,
                outcome.broker_order_id,
            )
        else:
            log.warning("Order not filled; durable status=%s", outcome.status.value)

    def _format_signal_message(self, signal: Signal) -> str:
        message = (
            f"📊 *{signal.agent} Signal*\n"
            f"Action: {signal.action.value} {signal.market}\n"
            f"Entry: ${signal.entry_price:.2f}\n"
            f"SL: ${signal.stop_loss:.2f} (risk: ${signal.risk_amount:.2f})\n"
        )
        if signal.take_profit:
            message += f"TP: ${signal.take_profit:.2f}\n"
        message += (
            f"Confidence: {signal.confidence:.0%}\n"
            f"Reason: {signal.reason}"
        )

        ai_verdict = signal.metadata.get("ai_verdict")
        if ai_verdict and ai_verdict["verdict"] in ("SAFE", "RISKY"):
            icon = "🤖" if ai_verdict["verdict"] == "SAFE" else "⚠️"
            message += f"\n{icon} AI: {ai_verdict['verdict']} — {ai_verdict['reason']}"

        return message

    async def _calculate_volume(self, signal: Signal, config: UserConfig) -> float:
        """Risk-based position sizing: risk X% of account per trade.

        Fetches live balance from the broker instead of using stale cached
        value, so position size always reflects actual account equity.
        """
        risk_percent = config.risk_per_trade_pct / 100 if hasattr(config, 'risk_per_trade_pct') else 0.02

        # Validate max_position_size is positive
        max_pos_size = config.max_position_size if config.max_position_size > 0 else 0.5

        # Fetch live balance from broker
        account = await self.broker.get_account()
        if account and account.balance > 0:
            account_balance = account.balance
        else:
            # Fallback to cached balance if broker unavailable
            account_balance = self._account_balance

        risk_amount = account_balance * risk_percent

        price_risk = abs(signal.entry_price - signal.stop_loss)
        if price_risk <= 0:
            return min(0.01, max_pos_size)

        # Instrument-specific contract size from registry
        contract_size = get_contract_size(signal.market)
        risk_per_lot = price_risk * contract_size
        if risk_per_lot <= 0:
            return min(0.01, max_pos_size)

        volume = risk_amount / risk_per_lot
        volume = max(0.01, min(round(volume, 2), max_pos_size))
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
        now = datetime.now(UTC).timestamp()

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

            content = response.content.strip()
            verdict = "SAFE" if "SAFE" in content.upper() else "RISKY"
            # Providers are instructed to lead with "VERDICT: SAFE/RISKY" followed by
            # a "Reason: ..." line — strip both labels so the Telegram card doesn't
            # show the verdict twice.
            reason = re.sub(r"(?i)^verdict:\s*(safe|risky)\s*", "", content).strip()
            reason = re.sub(r"(?i)^reason:\s*", "", reason).strip()
            return {
                "verdict": verdict,
                "reason": reason[:200],
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
