from __future__ import annotations

from ..broker.base import Broker
from ..broker.binance import BinanceBroker
from ..broker.ibkr import IBKRBroker
from ..broker.mt5 import MT5Broker
from ..broker.paper import PaperBroker
from .config import EngineConfig


def create_broker(config: EngineConfig, broker_type: str) -> Broker:
    if broker_type == "binance":
        return BinanceBroker(
            api_key=config.binance_api_key,
            api_secret=config.binance_api_secret,
        )
    if broker_type == "mt5":
        return MT5Broker(
            path=config.mt5_path,
            login=config.mt5_login,
            password=config.mt5_password,
            server=config.mt5_server,
        )
    if broker_type == "ibkr":
        return IBKRBroker(
            host=config.ibkr_host,
            port=config.ibkr_port,
            client_id=config.ibkr_client_id,
        )
    if broker_type == "paper":
        return PaperBroker()
    raise ValueError(f"Unknown broker type: {broker_type}")
