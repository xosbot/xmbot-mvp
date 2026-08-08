from __future__ import annotations

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

log = logging.getLogger("xmbot.broker.binance_futures")

BINANCE_FUTURES_URL = "https://fapi.binance.com"
BINANCE_FUTURES_WS_URL = "wss://fstream.binance.com/ws"

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
    "BTCUSDT": "BTCUSDT",
    "ETHUSDT": "ETHUSDT",
}


class BinanceFuturesBroker(Broker):
    """Binance Futures broker with margin trading support."""

    def __init__(
        self,
        api_key: str = "",
        api_secret: str = "",
        testnet: bool = False,
        leverage: int = 10,
    ) -> None:
        super().__init__("binance_futures")
        self._api_key = api_key
        self._api_secret = api_secret
        self._testnet = testnet
        self._leverage = leverage
        self._session: aiohttp.ClientSession | None = None
        self._positions: dict[str, Position] = {}
        self._orders: dict[str, Order] = {}
        self._price_cache: dict[str, dict] = {}
        self._protective_orders: dict[str, int] = {}

    def _get_base_url(self) -> str:
        if self._testnet:
            return "https://testnet.binancefuture.com"
        return BINANCE_FUTURES_URL

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
            method, url, params=params, headers=headers
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                raise Exception(f"Binance Futures API error: {data}")
            return data

    async def connect(self) -> bool:
        self.status = BrokerStatus.CONNECTING
        try:
            if not self._api_key or not self._api_secret:
                log.warning("No Binance Futures API keys — running in public mode only")
                self.status = BrokerStatus.CONNECTED
                return True

            # Test connection
            account = await self._request("GET", "/fapi/v2/account", signed=True)
            balance = float(account.get("totalWalletBalance", 0))
            log.info(f"Binance Futures connected — balance: {balance:.2f} USDT")

            # Set leverage
            await self._set_default_leverage()
            self.status = BrokerStatus.CONNECTED
            return True
        except Exception as e:
            log.error(f"Binance Futures connection failed: {e}")
            self.status = BrokerStatus.ERROR
            return False

    async def _set_default_leverage(self) -> None:
        """Set default leverage for all symbols."""
        try:
            symbols = list(SYMBOL_MAP.values())
            for symbol in symbols:
                try:
                    await self._request(
                        "POST",
                        "/fapi/v1/leverage",
                        {"symbol": symbol, "leverage": self._leverage},
                        signed=True,
                    )
                except Exception:
                    pass  # Some symbols may not support this leverage
        except Exception as e:
            log.warning(f"Failed to set leverage: {e}")

    async def disconnect(self) -> bool:
        self.status = BrokerStatus.DISCONNECTED
        if self._session:
            await self._session.close()
            self._session = None
        return True

    async def is_connected(self) -> bool:
        return self.status == BrokerStatus.CONNECTED

    async def place_order(self, order: Order) -> OrderResult:
        if not self._api_key or not self._api_secret:
            # Paper trading mode
            filled_price = self._price_cache.get(order.market, {}).get("price", 3000.0)
            order.status = OrderStatus.FILLED
            order.filled_price = filled_price
            order.filled_at = datetime.now(UTC)
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
            symbol = self._clean_symbol(order.market)
            side = "BUY" if order.action == SignalAction.BUY else "SELL"

            # Set position mode (hedge or one-way)
            await self._set_position_mode(symbol)

            # Set leverage for this symbol
            await self._request(
                "POST",
                "/fapi/v1/leverage",
                {"symbol": symbol, "leverage": self._leverage},
                signed=True,
            )

            filled_price, executed_qty, broker_order_id = await self._market_order(
                symbol, side, order.volume
            )

            order.status = OrderStatus.FILLED
            order.filled_price = filled_price
            order.filled_at = datetime.now(UTC)
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

                # Attach protective orders
                if order.stop_loss and order.stop_loss > 0:
                    close_side = "SELL" if order.action == SignalAction.BUY else "BUY"
                    try:
                        await self._attach_protective_order(
                            order.id, symbol, close_side, executed_qty,
                            order.stop_loss, order.take_profit,
                        )
                    except Exception as e:
                        log.error(
                            f"Position {order.id} ({symbol}) protective order failed: {e}"
                        )

            log.info(f"Binance Futures: {side} {symbol} {order.volume} @ {filled_price:.2f}")
            return OrderResult(
                success=True, order_id=order.id,
                broker_order_id=broker_order_id,
                filled_price=filled_price, filled_volume=order.volume,
            )

        except Exception as e:
            log.error(f"Binance Futures order failed: {e}")
            return OrderResult(success=False, order_id=order.id, error=str(e))

    async def _set_position_mode(self, symbol: str) -> None:
        """Set position mode to hedge for a symbol."""
        try:
            await self._request(
                "POST",
                "/fapi/v1/positionSide/dual",
                {"dualSidePosition": "true"},
                signed=True,
            )
        except Exception as e:
            # Position mode might already be set
            if "No need to change" not in str(e):
                log.warning(f"Failed to set position mode: {e}")

    @staticmethod
    def _clean_symbol(market: str) -> str:
        return SYMBOL_MAP.get(market.replace("/", "").upper(), market.replace("/", "").upper())

    async def _market_order(
        self, symbol: str, side: str, quantity: float
    ) -> tuple[float, float, str]:
        """Places a real MARKET order on futures."""
        params = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": f"{quantity:.6f}",
            "positionSide": "LONG" if side == "BUY" else "SHORT",
        }
        result = await self._request("POST", "/fapi/v1/order", params, signed=True)

        executed_qty = float(result.get("executedQty", 0))
        cumulative_quote = float(result.get("cumulativeQuoteQty", 0))
        filled_price = (cumulative_quote / executed_qty) if executed_qty > 0 else 0.0
        return filled_price, executed_qty, str(result.get("orderId", ""))

    async def _attach_protective_order(
        self,
        position_id: str,
        symbol: str,
        close_side: str,
        quantity: float,
        stop_loss: float,
        take_profit: float | None,
    ) -> None:
        """Attach stop-loss and take-profit orders to a futures position."""
        qty_str = f"{quantity:.6f}"
        position_side = "LONG" if close_side == "SELL" else "SHORT"

        # Stop-loss order
        sl_params = {
            "symbol": symbol,
            "side": close_side,
            "type": "STOP_MARKET",
            "stopPrice": f"{stop_loss:.2f}",
            "quantity": qty_str,
            "positionSide": position_side,
            "closePosition": "true",
        }
        sl_result = await self._request("POST", "/fapi/v1/order", sl_params, signed=True)
        self._protective_orders[f"{position_id}_sl"] = sl_result.get("orderId", 0)

        # Take-profit order
        if take_profit and take_profit > 0:
            tp_params = {
                "symbol": symbol,
                "side": close_side,
                "type": "TAKE_PROFIT_MARKET",
                "stopPrice": f"{take_profit:.2f}",
                "quantity": qty_str,
                "positionSide": position_side,
                "closePosition": "true",
            }
            tp_result = await self._request("POST", "/fapi/v1/order", tp_params, signed=True)
            self._protective_orders[f"{position_id}_tp"] = tp_result.get("orderId", 0)

    async def cancel_order(self, order_id: str) -> bool:
        pos = self._positions.get(order_id)
        if not pos:
            return False

        symbol = self._clean_symbol(pos.symbol)
        close_side = "SELL" if pos.direction == SignalAction.BUY else "BUY"
        position_side = "LONG" if close_side == "SELL" else "SHORT"

        # Cancel protective orders
        for key in [f"{order_id}_sl", f"{order_id}_tp"]:
            order_id_prot = self._protective_orders.pop(key, None)
            if order_id_prot:
                try:
                    await self._request(
                        "DELETE",
                        "/fapi/v1/order",
                        {"symbol": symbol, "orderId": order_id_prot},
                        signed=True,
                    )
                except Exception:
                    pass

        # Close position with opposing market order
        try:
            await self._request(
                "POST",
                "/fapi/v1/order",
                {
                    "symbol": symbol,
                    "side": close_side,
                    "type": "MARKET",
                    "quantity": f"{pos.volume:.6f}",
                    "positionSide": position_side,
                },
                signed=True,
            )
        except Exception as e:
            log.error(f"Failed to close position {order_id} ({symbol}): {e}")
            return False

        self._positions.pop(order_id, None)
        log.info(f"Closed futures position: {pos.symbol} {pos.direction}")
        return True

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        pos = self._positions.get(position_id)
        if not pos:
            return False

        symbol = self._clean_symbol(pos.symbol)

        # Cancel existing protective orders
        for key in [f"{position_id}_sl", f"{position_id}_tp"]:
            old_order_id = self._protective_orders.pop(key, None)
            if old_order_id:
                try:
                    await self._request(
                        "DELETE",
                        "/fapi/v1/order",
                        {"symbol": symbol, "orderId": old_order_id},
                        signed=True,
                    )
                except Exception:
                    pass

        # Attach new protective orders
        close_side = "SELL" if pos.direction == SignalAction.BUY else "BUY"
        await self._attach_protective_order(
            position_id, symbol, close_side, pos.volume,
            stop_loss or pos.stop_loss, take_profit or pos.take_profit
        )

        pos.stop_loss = stop_loss or pos.stop_loss
        pos.take_profit = take_profit or pos.take_profit
        return True

    async def get_positions(self) -> list[Position]:
        if not self._api_key or not self._api_secret:
            return list(self._positions.values())

        try:
            account = await self._request("GET", "/fapi/v2/positionRisk", signed=True)
            positions = []

            for pos_data in account:
                size = float(pos_data.get("positionAmt", 0))
                if size == 0:
                    continue

                symbol = pos_data.get("symbol", "")
                entry_price = float(pos_data.get("entryPrice", 0))
                mark_price = float(pos_data.get("markPrice", 0))
                unrealized_pnl = float(pos_data.get("unRealizedProfit", 0))

                positions.append(Position(
                    id=f"{symbol}_{'long' if size > 0 else 'short'}",
                    symbol=symbol,
                    direction=SignalAction.BUY if size > 0 else SignalAction.SELL,
                    volume=abs(size),
                    entry_price=entry_price,
                    current_price=mark_price,
                    stop_loss=0.0,
                    take_profit=0.0,
                    unrealized_pnl=unrealized_pnl,
                    open_time=datetime.now(UTC),
                    broker_position_id=f"{symbol}_{'long' if size > 0 else 'short'}",
                ))

            return positions
        except Exception as e:
            log.error(f"Binance Futures get_positions error: {e}")
            return list(self._positions.values())

    async def get_account(self) -> AccountInfo | None:
        if not self._api_key or not self._api_secret:
            total_pnl = sum(p.unrealized_pnl for p in self._positions.values())
            return AccountInfo(
                broker="binance_futures",
                balance=10000.0,
                equity=10000.0 + total_pnl,
                margin=0.0,
                margin_free=10000.0 + total_pnl,
                currency="USDT",
                is_connected=True,
            )

        try:
            account = await self._request("GET", "/fapi/v2/account", signed=True)
            balance = float(account.get("totalWalletBalance", 0))
            equity = float(account.get("totalCrossWalletBalance", 0))
            margin = float(account.get("totalInitialMargin", 0))
            margin_free = float(account.get("availableBalance", 0))

            return AccountInfo(
                broker="binance_futures",
                balance=balance,
                equity=equity,
                margin=margin,
                margin_free=margin_free,
                currency="USDT",
                is_connected=True,
            )
        except Exception as e:
            log.error(f"Binance Futures account error: {e}")
            return None

    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        binance_tf = TIMEFRAME_MAP.get(timeframe.upper(), "5m")
        clean_symbol = self._clean_symbol(symbol)

        try:
            url = f"{self._get_base_url()}/fapi/v1/klines"
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
            log.error(f"Binance Futures market data error: {e}")
            return []

    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        streams = "/".join([f"{s.lower()}@ticker" for s in symbols])
        ws_url = f"{BINANCE_FUTURES_WS_URL}/{streams}"

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
            log.error(f"Binance Futures WebSocket error: {e}")

    async def get_funding_rate(self, symbol: str) -> dict:
        """Get current funding rate for a futures symbol."""
        try:
            clean_symbol = self._clean_symbol(symbol)
            data = await self._request(
                "GET",
                "/fapi/v1/fundingRate",
                {"symbol": clean_symbol, "limit": 1},
            )
            if data:
                return {
                    "symbol": symbol,
                    "funding_rate": float(data[0].get("fundingRate", 0)),
                    "funding_time": datetime.fromtimestamp(
                        data[0].get("fundingTime", 0) / 1000, tz=UTC
                    ),
                }
            return {"symbol": symbol, "funding_rate": 0, "funding_time": datetime.now(UTC)}
        except Exception as e:
            log.error(f"Failed to get funding rate: {e}")
            return {"symbol": symbol, "funding_rate": 0, "funding_time": datetime.now(UTC)}

    async def get_open_interest(self, symbol: str) -> dict:
        """Get open interest for a futures symbol."""
        try:
            clean_symbol = self._clean_symbol(symbol)
            data = await self._request(
                "GET",
                "/fapi/v1/openInterest",
                {"symbol": clean_symbol},
            )
            return {
                "symbol": symbol,
                "open_interest": float(data.get("openInterest", 0)),
                "timestamp": datetime.now(UTC),
            }
        except Exception as e:
            log.error(f"Failed to get open interest: {e}")
            return {"symbol": symbol, "open_interest": 0, "timestamp": datetime.now(UTC)}
