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
from src.gate.human_gate import HumanGate
from src.risk.engine import RiskEngine
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
    # Technical Analysis Agent
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

    # Future agents will be registered here:
    # engine.register_agent(MarketResearchAgent(...))


async def main() -> None:
    parser = argparse.ArgumentParser(description="XMBot Engine")
    parser.add_argument("--broker", choices=["paper", "mt5", "binance"], default="paper")
    parser.add_argument("--config", type=str, help="Path to config JSON")
    parser.add_argument("--data-dir", type=str, help="Data directory for persistence")
    args = parser.parse_args()

    config = load_config(args.config)
    setup_logging(config.log_level)

    if config.sentry_dsn:
        sentry_sdk.init(
            dsn=config.sentry_dsn,
            environment=config.env,
            traces_sample_rate=0.1,
        )
        log.info("Sentry error tracking initialized")

    missing = [k for k, v in {"TELEGRAM_TOKEN": config.telegram_token}.items() if not v]
    if config.env == "production" and missing:
        log.warning(f"Missing critical env vars in production: {', '.join(missing)}")

    log.info(f"XMBot Engine v0.1.0 starting (env={config.env}, broker={args.broker})")

    config.default_broker = args.broker
    broker = create_broker(config, args.broker)

    telegram = TelegramBot(config.telegram_token, config.telegram_chat_id)
    gate = HumanGate(
        signal_timeout=config.signal_timeout_seconds,
        notify_callback=telegram.send_signal if config.telegram_token else None,
    )

    risk = RiskEngine(
        global_max_daily_loss=config.global_max_daily_loss,
        global_max_positions=config.global_max_positions,
    )

    engine = Engine(config=config, broker=broker, gate=gate, risk=risk)
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
        await engine.stop()
        await telegram.close()
        log.info("Engine shut down")


if __name__ == "__main__":
    asyncio.run(main())
