from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum

log = logging.getLogger("xmbot.routing")


class AssetType(Enum):
    FOREX = "forex"
    CRYPTO = "crypto"
    COMMODITY = "commodity"
    INDEX = "index"
    STOCK = "stock"
    CFD = "cfd"


@dataclass
class SymbolMapping:
    """Maps a symbol to broker-specific representation."""

    base_symbol: str
    asset_type: AssetType
    broker_symbols: dict[str, str] = field(default_factory=dict)
    tick_size: float = 0.01
    contract_size: float = 1.0
    margin_requirement: float = 0.01  # 1% default margin


@dataclass
class BrokerConfig:
    """Configuration for a broker."""

    name: str
    broker_type: str
    enabled: bool = True
    priority: int = 0  # Higher priority = preferred broker
    supported_assets: list[AssetType] = field(default_factory=list)
    max_position_size: float = 100.0
    commission_rate: float = 0.0


class SymbolRouter:
    """Routes symbols to appropriate brokers based on asset type and availability."""

    def __init__(self) -> None:
        self._symbol_map: dict[str, SymbolMapping] = {}
        self._broker_configs: dict[str, BrokerConfig] = {}
        self._init_default_mappings()

    def _init_default_mappings(self) -> None:
        """Initialize default symbol mappings."""
        # Forex pairs
        self.register_symbol(SymbolMapping(
            base_symbol="EURUSD",
            asset_type=AssetType.FOREX,
            broker_symbols={
                "mt5": "EURUSD",
                "ibkr": "EUR.USD",
                "binance": "EURUSDT",
            },
            tick_size=0.00001,
            contract_size=100000,
        ))

        self.register_symbol(SymbolMapping(
            base_symbol="GBPUSD",
            asset_type=AssetType.FOREX,
            broker_symbols={
                "mt5": "GBPUSD",
                "ibkr": "GBP.USD",
                "binance": "GBPUSDT",
            },
            tick_size=0.00001,
            contract_size=100000,
        ))

        self.register_symbol(SymbolMapping(
            base_symbol="USDJPY",
            asset_type=AssetType.FOREX,
            broker_symbols={
                "mt5": "USDJPY",
                "ibkr": "USD.JPY",
                "binance": "USDJPY",
            },
            tick_size=0.001,
            contract_size=100000,
        ))

        # Crypto
        self.register_symbol(SymbolMapping(
            base_symbol="BTCUSDT",
            asset_type=AssetType.CRYPTO,
            broker_symbols={
                "binance": "BTCUSDT",
                "binance_futures": "BTCUSDT",
                "mt5": "BTCUSD",
                "ibkr": "BTC.USD",
            },
            tick_size=0.01,
            contract_size=1.0,
        ))

        self.register_symbol(SymbolMapping(
            base_symbol="ETHUSDT",
            asset_type=AssetType.CRYPTO,
            broker_symbols={
                "binance": "ETHUSDT",
                "binance_futures": "ETHUSDT",
                "mt5": "ETHUSD",
                "ibkr": "ETH.USD",
            },
            tick_size=0.01,
            contract_size=1.0,
        ))

        # Commodities (Gold)
        self.register_symbol(SymbolMapping(
            base_symbol="XAUUSD",
            asset_type=AssetType.COMMODITY,
            broker_symbols={
                "mt5": "XAUUSD",
                "ibkr": "XAU.USD",
                "binance": "PAXGUSDT",
                "binance_futures": "PAXGUSDT",
            },
            tick_size=0.01,
            contract_size=100,
            margin_requirement=0.02,
        ))

        # Indices
        self.register_symbol(SymbolMapping(
            base_symbol="US30",
            asset_type=AssetType.INDEX,
            broker_symbols={
                "mt5": "US30",
                "ibkr": "US30",
                "binance": "USDT",
            },
            tick_size=0.01,
            contract_size=1,
        ))

        # Register default broker configurations
        self.register_broker(BrokerConfig(
            name="mt5",
            broker_type="mt5",
            enabled=True,
            priority=100,
            supported_assets=[AssetType.FOREX, AssetType.COMMODITY, AssetType.INDEX],
            max_position_size=10.0,
        ))

        self.register_broker(BrokerConfig(
            name="binance",
            broker_type="binance",
            enabled=True,
            priority=90,
            supported_assets=[AssetType.CRYPTO, AssetType.COMMODITY],
            max_position_size=100.0,
        ))

        self.register_broker(BrokerConfig(
            name="binance_futures",
            broker_type="binance_futures",
            enabled=True,
            priority=85,
            supported_assets=[AssetType.CRYPTO],
            max_position_size=100.0,
        ))

        self.register_broker(BrokerConfig(
            name="ibkr",
            broker_type="ibkr",
            enabled=True,
            priority=80,
            supported_assets=[AssetType.FOREX, AssetType.COMMODITY, AssetType.INDEX, AssetType.STOCK, AssetType.CFD],
            max_position_size=50.0,
        ))

    def register_symbol(self, mapping: SymbolMapping) -> None:
        """Register a symbol mapping."""
        self._symbol_map[mapping.base_symbol.upper()] = mapping
        log.debug(f"Registered symbol: {mapping.base_symbol}")

    def register_broker(self, config: BrokerConfig) -> None:
        """Register a broker configuration."""
        self._broker_configs[config.name] = config
        log.debug(f"Registered broker: {config.name}")

    def get_symbol_for_broker(self, base_symbol: str, broker_name: str) -> str | None:
        """Get the broker-specific symbol for a base symbol."""
        mapping = self._symbol_map.get(base_symbol.upper())
        if not mapping:
            log.warning(f"No mapping found for symbol: {base_symbol}")
            return None

        broker_symbol = mapping.broker_symbols.get(broker_name)
        if not broker_symbol:
            log.warning(f"Symbol {base_symbol} not available on broker {broker_name}")
            return None

        return broker_symbol

    def get_asset_type(self, symbol: str) -> AssetType | None:
        """Get the asset type for a symbol."""
        mapping = self._symbol_map.get(symbol.upper())
        return mapping.asset_type if mapping else None

    def get_symbol_info(self, symbol: str) -> SymbolMapping | None:
        """Get full symbol information."""
        return self._symbol_map.get(symbol.upper())

    def get_best_broker(
        self, symbol: str, exclude_brokers: list[str] | None = None
    ) -> str | None:
        """Find the best broker for a symbol based on priority and availability."""
        mapping = self._symbol_map.get(symbol.upper())
        if not mapping:
            return None

        exclude = set(exclude_brokers or [])
        best_broker = None
        best_priority = -1

        for broker_name, broker_symbol in mapping.broker_symbols.items():
            if broker_name in exclude:
                continue

            broker_config = self._broker_configs.get(broker_name)
            if not broker_config or not broker_config.enabled:
                continue

            if mapping.asset_type not in broker_config.supported_assets:
                continue

            if broker_config.priority > best_priority:
                best_priority = broker_config.priority
                best_broker = broker_name

        return best_broker

    def get_all_brokers_for_symbol(self, symbol: str) -> list[str]:
        """Get all brokers that support a symbol."""
        mapping = self._symbol_map.get(symbol.upper())
        if not mapping:
            return []

        brokers = []
        for broker_name in mapping.broker_symbols.keys():
            broker_config = self._broker_configs.get(broker_name)
            if broker_config and broker_config.enabled:
                brokers.append(broker_name)

        return brokers

    def get_symbols_by_asset_type(self, asset_type: AssetType) -> list[str]:
        """Get all symbols of a specific asset type."""
        return [
            symbol for symbol, mapping in self._symbol_map.items()
            if mapping.asset_type == asset_type
        ]

    def calculate_position_size(
        self,
        symbol: str,
        broker_name: str,
        account_balance: float,
        risk_percentage: float = 0.02,
        stop_loss_pips: float = 50,
    ) -> float:
        """Calculate appropriate position size based on risk parameters."""
        mapping = self._symbol_map.get(symbol.upper())
        broker_config = self._broker_configs.get(broker_name)

        if not mapping or not broker_config:
            return 0.0

        risk_amount = account_balance * risk_percentage
        pip_value = mapping.contract_size * mapping.tick_size
        position_size = risk_amount / (stop_loss_pips * pip_value)

        # Cap at broker's max position size
        position_size = min(position_size, broker_config.max_position_size)

        return round(position_size, 2)

    def get_tick_value(self, symbol: str, broker_name: str) -> float:
        """Get the value of one tick for a symbol on a broker."""
        mapping = self._symbol_map.get(symbol.upper())
        if not mapping:
            return 0.0

        return mapping.tick_size * mapping.contract_size

    def get_margin_requirement(self, symbol: str) -> float:
        """Get the margin requirement for a symbol."""
        mapping = self._symbol_map.get(symbol.upper())
        return mapping.margin_requirement if mapping else 0.01

    def normalize_symbol(self, symbol: str, broker_name: str) -> str:
        """Normalize a symbol to broker-specific format."""
        broker_symbol = self.get_symbol_for_broker(symbol, broker_name)
        return broker_symbol or symbol.upper()

    def is_symbol_supported(self, symbol: str, broker_name: str | None = None) -> bool:
        """Check if a symbol is supported."""
        mapping = self._symbol_map.get(symbol.upper())
        if not mapping:
            return False

        if broker_name is None:
            return len(mapping.broker_symbols) > 0

        return broker_name in mapping.broker_symbols

    def get_all_symbols(self) -> list[str]:
        """Get all registered symbols."""
        return list(self._symbol_map.keys())

    def get_asset_types(self) -> list[AssetType]:
        """Get all registered asset types."""
        return list(set(m.asset_type for m in self._symbol_map.values()))


# Global router instance
_router: SymbolRouter | None = None


def get_router() -> SymbolRouter:
    """Get the global symbol router instance."""
    global _router
    if _router is None:
        _router = SymbolRouter()
    return _router
