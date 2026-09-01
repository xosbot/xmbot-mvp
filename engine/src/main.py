"""
XMBot Engine — Entrypoint

Starts the engine, registers agents and AI providers, and runs the API server.

Usage:
    python -m src.main                          # Paper broker, no Telegram
    python -m src.main --broker mt5             # MT5 broker
    TELEGRAM_TOKEN=xxx python -m src.main       # With Telegram signals
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys

import sentry_sdk
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.technical import TechnicalAnalysisAgent
from src.ai.providers import ClaudeProvider, GeminiProvider
from src.ai.registry import AIRegistry
from src.api.routes.trading import init_trading_api
from src.api.server import app, init_api
from src.core.broker_factory import create_broker
from src.core.config import EngineConfig, load_config
from src.core.engine import Engine
from src.core.persistence import Persistence
from src.core.types import AgentConfig, UserConfig
from src.db.session import SessionLocal
from src.execution.repository import ExecutionRepository
from src.execution.service import ExecutionService
from src.gate.human_gate import HumanGate
from src.reconciliation.service import ReconciliationService
from src.risk.engine import RiskEngine
from src.strategies.adapter import StrategyAgent
from src.strategies.base import StrategyConfig, StrategyType
from src.strategies.registry import StrategyRegistry, load_builtin_strategies
from src.telegram.bot import TelegramBot

log = logging.getLogger("xmbot")


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.getLogger("xmbot").setLevel(getattr(logging, level.upper(), logging.INFO))


def setup_ai(config: EngineConfig) -> AIRegistry:
    registry = AIRegistry()

    if config.gemini_api_key:
        gemini = GeminiProvider(api_key=config.gemini_api_key)
        registry.register("gemini", gemini)
        log.info("Registered Gemini AI provider")

    if config.claude_api_key:
        claude = ClaudeProvider(api_key=config.claude_api_key)
        registry.register("claude", claude)
        log.info("Registered Claude AI provider")

    return registry


def setup_agents(engine: Engine, ai_registry: AIRegistry) -> None:
    # Technical Analysis Agent (default)
    ta_config = AgentConfig(
        name="technical",
        markets=["XAUUSD"],
        timeframe="M5",
        confidence_threshold=0.6,
        max_daily_trades=5,
    )
    technical_agent = TechnicalAnalysisAgent(config=ta_config)
    engine.register_agent(technical_agent)
    log.info("Registered Technical Analysis Agent")

    # Register strategy templates as engine agents
    strategy_registry = StrategyRegistry()
    load_builtin_strategies(strategy_registry)

    strategy_types = [
        ("momentum", "Momentum", StrategyType.MOMENTUM, "M5", {"adx_threshold": 25}),
        ("swing", "Swing", StrategyType.SWING, "H1", {}),
        ("scalping", "Scalping", StrategyType.SCALPING, "M5", {}),
        ("mean_reversion", "MeanReversion", StrategyType.MEAN_REVERSION, "M15", {}),
    ]

    for type_name, display_name, stype, tf, overrides in strategy_types:
        try:
            sc = StrategyConfig(
                name=f"strategy_{type_name}",
                strategy_type=stype,
                symbols=["XAUUSD"],
                timeframe=tf,
                params=overrides,
            )
            strategy = strategy_registry.create(sc, type_name)
            agent_config = AgentConfig(
                name=f"strategy_{type_name}",
                markets=["XAUUSD"],
                timeframe=tf,
                confidence_threshold=0.6,
                max_daily_trades=5,
            )
            adapter = StrategyAgent(strategy, agent_config)
            engine.register_agent(adapter)
            log.info(f"Registered strategy agent: {display_name} ({type_name})")
        except Exception as e:
            log.warning(f"Failed to register strategy {type_name}: {e}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="XMBot Engine")
    parser.add_argument("--broker", choices=["paper", "mt5", "binance", "ibkr"])
    parser.add_argument("--config", type=str, help="Path to config JSON")
    parser.add_argument("--data-dir", type=str, help="Data directory for persistence")
    args = parser.parse_args()

    config = load_config(args.config)
    setup_logging(config.log_level)
    selected_broker = args.broker or config.default_broker
    config.validate_for_startup(selected_broker)

    if config.sentry_dsn:
        sentry_sdk.init(
            dsn=config.sentry_dsn,
            environment=config.env,
            traces_sample_rate=0.1,
        )
        log.info("Sentry error tracking initialized")

    log.info(f"XMBot Engine v0.1.0 starting (env={config.env}, broker={selected_broker})")

    config.default_broker = selected_broker
    broker = create_broker(config, selected_broker)

    telegram = TelegramBot(config.telegram_token, config.telegram_chat_id)
    gate = HumanGate(
        signal_timeout=config.signal_timeout_seconds,
        notify_callback=telegram.send_signal if config.telegram_token else None,
    )

    risk_persistence = Persistence(data_dir=args.data_dir, filename="risk_state.json")
    risk = RiskEngine(
        global_max_daily_loss=config.global_max_daily_loss,
        global_max_positions=config.global_max_positions,
        persistence=risk_persistence,
    )
    reconciliation_service = ReconciliationService(
        broker,
        SessionLocal,
        pnl_callback=risk.record_pnl_once,
        alert_callback=telegram.send_alert if config.telegram_token else None,
    )
    execution_service = ExecutionService(
        broker,
        ExecutionRepository(SessionLocal),
        health_provider=lambda user_id: reconciliation_service.health_for_user(user_id).value,
        pnl_callback=risk.record_pnl_once,
    )

    engine = Engine(
        config=config,
        broker=broker,
        gate=gate,
        risk=risk,
        alert_callback=telegram.send_alert if config.telegram_token else None,
        execution_service=execution_service,
        reconciliation_service=reconciliation_service,
    )
    init_api(engine)
    init_trading_api(engine)

    from src.api.routes.sync import init_persistence

    persistence = Persistence(data_dir=args.data_dir)
    init_persistence(persistence)

    ai_registry = setup_ai(config)
    engine.ai_registry = ai_registry
    setup_agents(engine, ai_registry)

    engine.register_user(UserConfig(
        user_id="default",
        telegram_chat_id=config.telegram_chat_id,
        max_daily_loss=500.0,
        max_drawdown_percent=20.0,
        max_position_size=0.1,
    ))

    async def get_status() -> dict:
        connected = await engine.broker.is_connected()
        positions = await engine.broker.get_positions()
        return {
            "running": engine.running,
            "paused": engine.paused,
            "broker": engine.config.default_broker,
            "broker_connected": connected,
            "open_positions": len(positions),
            "pending_signals": engine.gate.pending_count,
        }

    telegram.set_status_provider(get_status)

    if config.telegram_token:
        telegram.set_default_handler(
            lambda signal_id, decision: asyncio.create_task(
                gate.resolve(signal_id, decision)
            )
        )
        asyncio.create_task(telegram.start_polling())
        await telegram.send_message("🚀 *XMBot Engine Online*\nTechnical Analysis Agent active on XAUUSD M5")
        log.info("Telegram bot polling started")

    await engine.start()

    log.info("Engine initialized. Starting API server on port 8080...")

    uvicorn_config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8080,
        log_level=config.log_level.lower(),
    )
    server = uvicorn.Server(uvicorn_config)

    try:
        await server.serve()
    finally:
        pending = gate.pending_count
        await engine.stop()
        if pending and config.telegram_token:
            await telegram.send_alert(
                f"Engine shutting down — {pending} pending signal(s) cancelled."
            )
        await telegram.close()
        log.info("Engine shut down")


if __name__ == "__main__":
    asyncio.run(main())
