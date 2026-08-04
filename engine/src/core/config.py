from __future__ import annotations

import base64
import hashlib
import json
import os
from dataclasses import dataclass


def _derive_key(password: str) -> bytes:
    """Derive a 32-byte Fernet key from a password using SHA-256."""
    return base64.urlsafe_b64encode(hashlib.sha256(password.encode()).digest())


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
    binance_testnet: bool = False

    # AI Providers
    claude_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""
    ai_validation_enabled: bool = True

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

    # MQL5
    mql5_community_key: str = ""

    # Encryption
    encryption_key: str = ""

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
            binance_testnet=os.getenv("BINANCE_TESTNET", "false").lower() == "true",
            claude_api_key=os.getenv("CLAUDE_API_KEY", ""),
            gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            ai_validation_enabled=os.getenv("AI_VALIDATION_ENABLED", "true").lower() == "true",
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
            mql5_community_key=os.getenv("MQL5_COMMUNITY_KEY", ""),
            encryption_key=os.getenv("ENCRYPTION_KEY", ""),
            sentry_dsn=os.getenv("SENTRY_DSN", ""),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )

    def encrypt_secret(self, plaintext: str) -> str:
        """Encrypt a secret value using Fernet symmetric encryption."""
        if not self.encryption_key:
            return plaintext
        from cryptography.fernet import Fernet
        key = _derive_key(self.encryption_key)
        f = Fernet(key)
        return f.encrypt(plaintext.encode()).decode()

    def decrypt_secret(self, ciphertext: str) -> str:
        """Decrypt a secret value using Fernet symmetric encryption."""
        if not self.encryption_key or not ciphertext:
            return ciphertext
        from cryptography.fernet import Fernet
        key = _derive_key(self.encryption_key)
        f = Fernet(key)
        return f.decrypt(ciphertext.encode()).decode()

    def get_broker_creds(self) -> dict[str, str]:
        """Get broker credentials, decrypting if encryption is enabled."""
        return {
            "binance_api_key": self.decrypt_secret(self.binance_api_key),
            "binance_api_secret": self.decrypt_secret(self.binance_api_secret),
            "mt5_password": self.decrypt_secret(self.mt5_password),
            "ibkr_password": self.decrypt_secret(getattr(self, "ibkr_password", "")),
        }


def load_config(path: str | None = None) -> EngineConfig:
    if path and os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
        return EngineConfig(**data)
    return EngineConfig.from_env()
