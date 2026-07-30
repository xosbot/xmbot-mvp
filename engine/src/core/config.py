from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class EngineConfig:
    # Environment
    env: str = "development"

    # Telegram
    telegram_token: str = ""
    telegram_chat_id: str = ""

    # Broker
    default_broker: str = "paper"

    # IBKR
    ibkr_host: str = "127.0.0.1"
    ibkr_port: int = 7497
    ibkr_client_id: int = 1

    # MT5
    mt5_path: str = ""
    mt5_login: int = 0
    mt5_password: str = ""
    mt5_server: str = ""

    # Binance
    binance_api_key: str = ""
    binance_api_secret: str = ""

    # AI Providers
    claude_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""

    # Engine
    tick_interval_seconds: float = 1.0
    candle_interval_seconds: float = 300.0
    max_concurrent_agents: int = 10
    signal_timeout_seconds: int = 300

    # Risk
    global_max_daily_loss: float = 10000.0
    global_max_positions: int = 20

    # Trailing Stop
    trailing_stop_enabled: bool = True
    trailing_stop_activation_atr: float = 1.0  # Activate after price moves 1x ATR in profit
    trailing_stop_distance_atr: float = 1.5   # Trail SL at 1.5x ATR from current price

    # API
    api_key: str = ""

    # Monitoring
    sentry_dsn: str = ""
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> EngineConfig:
        return cls(
            env=os.getenv("XMBOT_ENV", "development"),
            telegram_token=os.getenv("TELEGRAM_TOKEN", ""),
            telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID", ""),
            default_broker=os.getenv("DEFAULT_BROKER", "paper"),
            ibkr_host=os.getenv("IBKR_HOST", "127.0.0.1"),
            ibkr_port=int(os.getenv("IBKR_PORT", "7497")),
            ibkr_client_id=int(os.getenv("IBKR_CLIENT_ID", "1")),
            mt5_path=os.getenv("MT5_PATH", ""),
            mt5_login=int(os.getenv("MT5_LOGIN", "0")),
            mt5_password=os.getenv("MT5_PASSWORD", ""),
            mt5_server=os.getenv("MT5_SERVER", ""),
            binance_api_key=os.getenv("BINANCE_API_KEY", ""),
            binance_api_secret=os.getenv("BINANCE_API_SECRET", ""),
            claude_api_key=os.getenv("CLAUDE_API_KEY", ""),
            gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            tick_interval_seconds=float(os.getenv("TICK_INTERVAL", "1.0")),
            candle_interval_seconds=float(os.getenv("CANDLE_INTERVAL", "300.0")),
            max_concurrent_agents=int(os.getenv("MAX_AGENTS", "10")),
            signal_timeout_seconds=int(os.getenv("SIGNAL_TIMEOUT", "300")),
            global_max_daily_loss=float(os.getenv("MAX_DAILY_LOSS", "10000")),
            global_max_positions=int(os.getenv("MAX_POSITIONS", "20")),
            trailing_stop_enabled=os.getenv("TRAILING_STOP_ENABLED", "true").lower() == "true",
            trailing_stop_activation_atr=float(os.getenv("TRAILING_STOP_ACTIVATION_ATR", "1.0")),
            trailing_stop_distance_atr=float(os.getenv("TRAILING_STOP_DISTANCE_ATR", "1.5")),
            api_key=os.getenv("XMBOT_API_KEY", ""),
            sentry_dsn=os.getenv("SENTRY_DSN", ""),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )


def load_config(path: Optional[str] = None) -> EngineConfig:
    if path and os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
        return EngineConfig(**data)
    return EngineConfig.from_env()
