from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
import time
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from urllib.parse import urlencode

import aiohttp

from ..core.types import (
    AccountInfo,
    Market,
    Order,
    OrderResult,
    OrderStatus,
    Position,
    PriceTick,
    SignalAction,
)
from .base import Broker, BrokerStatus

log = logging.getLogger("xmbot.broker.binance")

BINANCE_BASE_URL = "https://api.binance.com"
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws"

TIMEFRAME_MAP = {
    "M1": "1m",
    "M5": "5m",
    "M15": "15m",
    "M30": "30m",
    "H1": "1h",
    "H4": "4h",
    "D1": "1d",
}

SYMBOL_MAP = {
    "XAUUSD": "PAXGUSDT",
    "XAU/USD": "PAXGUSDT",
    "PAXGUSDT": "PAXGUSDT",
}


class BinanceBroker(Broker):
    def __init__(
        self,
        api_key: str = "",
        api_secret: str = "",
        testnet: bool = False,
    ) -> None:
        super().__init__("binance")
        self._api_key = api_key
        self._api_secret = api_secret
        self._testnet = testnet
        self._session: aiohttp.ClientSession | None = None
        self._positions: dict[str, Position] = {}
        self._orders: dict[str, Order] = {}
        self._ws: asyncio.Task | None = None
        self._price_cache: dict[str, dict] = {}

    def _get_base_url(self) -> str:
        if self._testnet:
            return "https://testnet.binance.vision"
        return BINANCE_BASE_URL

    def _sign(self, params: dict) -> dict:
        params["timestamp"] = int(time.time() * 1000)
        query = urlencode(params)
        signature = hmac.new(
            self._api_secret.encode(), query.encode(), hashlib.sha256
        ).hexdigest()
        params["signature"] = signature
        return params

    def _headers(self) -> dict:
        return {"X-MBX-APIKEY": self._api_key}

    async def _request(
        self, method: str, path: str, params: dict = None, signed: bool = False
    ) -> dict:
        if params is None:
            params = {}
        if signed:
            params = self._sign(params)

        url = f"{self._get_base_url()}{path}"
        headers = self._headers() if signed else {}

        if self._session is None:
            self._session = aiohttp.ClientSession()

        async with self._session.request(
            method, url, params=params if method == "GET" else None,
            json=params if method != "GET" else None,
            headers=headers,
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                raise Exception(f"Binance API error: {data}")
            return data

    async def connect(self) -> bool:
        self.status = BrokerStatus.CONNECTING
        try:
            if not self._api_key or not self._api_secret:
                log.warning("No Binance API keys — running in public mode only")
                self.status = BrokerStatus.CONNECTED
                return True

            account = await self._request("GET", "/api/v3/account", signed=True)
            log.info(f"Binance connected — balance: {float(account.get('totalWalletBalance', 0)):.2f} USDT")
            self.status = BrokerStatus.CONNECTED
            return True
        except Exception as e:
            log.error(f"Binance connection failed: {e}")
            self.status = BrokerStatus.ERROR
            return False

    async def disconnect(self) -> bool:
        self.status = BrokerStatus.DISCONNECTED
        if self._session:
            await self._session.close()
            self._session = None
        if self._ws:
            self._ws.cancel()
            self._ws = None
        return True

    async def is_connected(self) -> bool:
        return self.status == BrokerStatus.CONNECTED

    async def place_order(self, order: Order) -> OrderResult:
        if not self._api_key or not self._api_secret:
            filled_price = self._price_cache.get(order.market, {}).get("price", 3000.0)
            order.status = OrderStatus.FILLED
            order.filled_price = filled_price
            order.filled_at = datetime.utcnow()
            self._orders[order.id] = order

            if order.action in (SignalAction.BUY, SignalAction.SELL):
                self._positions[order.id] = Position(
                    id=order.id,
                    symbol=order.market,
                    direction=order.action,
                    volume=order.volume,
                    entry_price=filled_price,
                    current_price=filled_price,
                    stop_loss=order.stop_loss,
                    take_profit=order.take_profit,
                )

            log.info(f"Paper: {order.action} {order.market} {order.volume} @ {filled_price:.2f}")
            return OrderResult(
                success=True, order_id=order.id,
                filled_price=filled_price, filled_volume=order.volume,
            )

        try:
            symbol = SYMBOL_MAP.get(order.market.replace("/", "").upper(), order.market.replace("/", "").upper())
            side = "BUY" if order.action == SignalAction.BUY else "SELL"

            params = {
                "symbol": symbol,
                "side": side,
                "type": "MARKET",
                "quantity": f"{order.volume:.6f}",
            }

            result = await self._request("POST", "/api/v3/order", params, signed=True)

            filled_price = float(result.get("price", 0))
            broker_order_id = str(result.get("orderId", ""))

            order.status = OrderStatus.FILLED
            order.filled_price = filled_price
            order.filled_at = datetime.utcnow()
            order.broker_order_id = broker_order_id
            self._orders[order.id] = order

            if order.action in (SignalAction.BUY, SignalAction.SELL):
                self._positions[order.id] = Position(
                    id=order.id,
                    symbol=order.market,
                    direction=order.action,
                    volume=order.volume,
                    entry_price=filled_price,
                    current_price=filled_price,
                    stop_loss=order.stop_loss,
                    take_profit=order.take_profit,
                    broker_position_id=broker_order_id,
                )

            log.info(f"Binance: {side} {symbol} {order.volume} @ {filled_price:.2f}")
            return OrderResult(
                success=True, order_id=order.id,
                broker_order_id=broker_order_id,
                filled_price=filled_price, filled_volume=order.volume,
            )

        except Exception as e:
            log.error(f"Binance order failed: {e}")
            return OrderResult(success=False, order_id=order.id, error=str(e))

    async def cancel_order(self, order_id: str) -> bool:
        if order_id in self._positions:
            pos = self._positions.pop(order_id)
            log.info(f"Closed position: {pos.symbol} {pos.direction}")
            return True
        return False

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        pos = self._positions.get(position_id)
        if pos:
            if stop_loss is not None:
                pos.stop_loss = stop_loss
            if take_profit is not None:
                pos.take_profit = take_profit
            return True
        return False

    async def get_positions(self) -> list[Position]:
        return list(self._positions.values())

    async def get_account(self) -> AccountInfo | None:
        if not self._api_key or not self._api_secret:
            total_pnl = sum(p.unrealized_pnl for p in self._positions.values())
            return AccountInfo(
                broker="binance",
                balance=10000.0,
                equity=10000.0 + total_pnl,
                margin=0.0,
                margin_free=10000.0 + total_pnl,
                currency="USDT",
                is_connected=True,
            )

        try:
            # Try spot account first
            account = await self._request("GET", "/api/v3/account", signed=True)
            balance = float(account.get("totalWalletBalance", 0))
            equity = float(account.get("totalMarginBalance", 0))

            # If spot balance is near zero, check margin account
            if balance < 1.0:
                try:
                    margin = await self._request("GET", "/sapi/v1/margin/account", signed=True)
                    for asset in margin.get("userAssets", []):
                        if asset.get("asset") == "USDT":
                            margin_balance = float(asset.get("netAsset", 0))
                            if margin_balance > balance:
                                balance = margin_balance
                                equity = margin_balance
                                log.info(f"Using margin balance: {balance:.2f} USDT")
                                break
                except Exception:
                    pass

            return AccountInfo(
                broker="binance",
                balance=balance,
                equity=equity,
                margin=0.0,
                margin_free=equity,
                currency="USDT",
                is_connected=True,
            )
        except Exception as e:
            log.error(f"Binance account error: {e}")
            return None

    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        binance_tf = TIMEFRAME_MAP.get(timeframe.upper(), "5m")
        clean_symbol = SYMBOL_MAP.get(symbol.replace("/", "").upper(), symbol.replace("/", "").upper())

        try:
            url = f"{self._get_base_url()}/api/v3/klines"
            params = {"symbol": clean_symbol, "interval": binance_tf, "limit": count}

            if self._session is None:
                self._session = aiohttp.ClientSession()

            async with self._session.get(url, params=params) as resp:
                data = await resp.json()

            markets = []
            for k in data:
                markets.append(Market(
                    symbol=symbol,
                    timeframe=timeframe,
                    bid=float(k[3]) - 0.01,
                    ask=float(k[3]) + 0.01,
                    open=float(k[1]),
                    high=float(k[2]),
                    low=float(k[3]),
                    close=float(k[4]),
                    volume=float(k[5]),
                    timestamp=datetime.fromtimestamp(k[0] / 1000, tz=UTC),
                ))

            if markets:
                self._price_cache[symbol] = {"price": markets[-1].close}

            return markets

        except Exception as e:
            log.error(f"Binance market data error: {e}")
            return []

    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        streams = "/".join([f"{s.lower()}@ticker" for s in symbols])
        ws_url = f"{BINANCE_WS_URL}/{streams}"

        try:
            import websockets
            async with websockets.connect(ws_url) as ws:
                async for msg in ws:
                    import json
                    data = json.loads(msg)
                    symbol = data.get("s", "")
                    price = float(data.get("c", 0))
                    self._price_cache[symbol] = {"price": price}
                    yield PriceTick(
                        symbol=symbol,
                        bid=price - 0.01,
                        ask=price + 0.01,
                        timestamp=datetime.now(UTC),
                        volume=float(data.get("v", 0)),
                    )
        except Exception as e:
            log.error(f"Binance WebSocket error: {e}")
