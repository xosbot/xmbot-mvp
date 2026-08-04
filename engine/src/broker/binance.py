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
        # Exchange-side protection for each open position: either a real OCO
        # (stop-loss + take-profit) or a plain stop-loss order, keyed by
        # position id. Without this, a filled MARKET entry has no stop-loss
        # enforcement at all if the bot process goes down or loses network.
        self._protective_orders: dict[str, int] = {}
        self._protective_is_oco: dict[str, bool] = {}
        self._last_reconciled: dict[str, float] = {}

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

        # Binance's REST API takes params as a query string (or form-encoded
        # body) for every method, signed trading endpoints included — it does
        # not parse a JSON body. A previous `json=params` on POST meant the
        # server saw no params at all and rejected every order.
        async with self._session.request(
            method, url, params=params,
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
            log.info(f"Binance connected — balance: {self._spot_usdt_balance(account):.2f} USDT")
            self.status = BrokerStatus.CONNECTED
            return True
        except Exception as e:
            log.error(f"Binance connection failed: {e}")
            self.status = BrokerStatus.ERROR
            return False

    @staticmethod
    def _spot_usdt_balance(account: dict) -> float:
        """Spot's GET /api/v3/account returns a `balances` array of
        {asset, free, locked} — not the `totalWalletBalance` field that
        exists only on the Futures API. Free + locked is the real spot
        USDT position."""
        for asset in account.get("balances", []):
            if asset.get("asset") == "USDT":
                return float(asset.get("free", 0)) + float(asset.get("locked", 0))
        return 0.0

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
            symbol = self._clean_symbol(order.market)
            side = "BUY" if order.action == SignalAction.BUY else "SELL"

            filled_price, executed_qty, broker_order_id = await self._market_order(
                symbol, side, order.volume
            )

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

                if order.stop_loss and order.stop_loss > 0:
                    close_side = "SELL" if order.action == SignalAction.BUY else "BUY"
                    try:
                        await self._attach_protective_order(
                            order.id, symbol, close_side, executed_qty,
                            order.stop_loss, order.take_profit,
                        )
                    except Exception as e:
                        # The entry filled but the position is now unprotected —
                        # log loudly rather than silently leaving it naked.
                        log.error(
                            f"Position {order.id} ({symbol}) opened but its "
                            f"protective stop-loss order failed: {e}"
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

    @staticmethod
    def _clean_symbol(market: str) -> str:
        return SYMBOL_MAP.get(market.replace("/", "").upper(), market.replace("/", "").upper())

    async def _market_order(
        self, symbol: str, side: str, quantity: float
    ) -> tuple[float, float, str]:
        """Places a real MARKET order, returns (fill_price, executed_qty, order_id)."""
        params = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": f"{quantity:.6f}",
        }
        result = await self._request("POST", "/api/v3/order", params, signed=True)

        # MARKET orders always report price="0.00000000" at the top level —
        # the real (volume-weighted average) fill price has to be derived
        # from cummulativeQuoteQty / executedQty.
        executed_qty = float(result.get("executedQty", 0))
        cumulative_quote = float(result.get("cummulativeQuoteQty", 0))
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
        """Places a real exchange-side stop-loss (OCO with take-profit when
        set, otherwise a plain STOP_LOSS_LIMIT) so the position is protected
        even if this process goes down or loses network."""
        qty_str = f"{quantity:.6f}"
        # A small buffer past the stop trigger so the limit leg actually
        # crosses the book and fills instead of resting unfilled.
        stop_buffer = stop_loss * 0.999 if close_side == "SELL" else stop_loss * 1.001

        if take_profit and take_profit > 0:
            if close_side == "SELL":
                params = {
                    "symbol": symbol, "side": close_side, "quantity": qty_str,
                    "aboveType": "LIMIT_MAKER", "abovePrice": f"{take_profit:.2f}",
                    "belowType": "STOP_LOSS_LIMIT", "belowStopPrice": f"{stop_loss:.2f}",
                    "belowPrice": f"{stop_buffer:.2f}", "belowTimeInForce": "GTC",
                }
            else:
                params = {
                    "symbol": symbol, "side": close_side, "quantity": qty_str,
                    "belowType": "LIMIT_MAKER", "belowPrice": f"{take_profit:.2f}",
                    "aboveType": "STOP_LOSS_LIMIT", "aboveStopPrice": f"{stop_loss:.2f}",
                    "abovePrice": f"{stop_buffer:.2f}", "aboveTimeInForce": "GTC",
                }
            result = await self._request("POST", "/api/v3/orderList/oco", params, signed=True)
            self._protective_orders[position_id] = result["orderListId"]
            self._protective_is_oco[position_id] = True
        else:
            params = {
                "symbol": symbol, "side": close_side, "type": "STOP_LOSS_LIMIT",
                "quantity": qty_str, "stopPrice": f"{stop_loss:.2f}",
                "price": f"{stop_buffer:.2f}", "timeInForce": "GTC",
            }
            result = await self._request("POST", "/api/v3/order", params, signed=True)
            self._protective_orders[position_id] = result["orderId"]
            self._protective_is_oco[position_id] = False

    async def _cancel_protective_order(self, position_id: str, symbol: str) -> None:
        order_id = self._protective_orders.pop(position_id, None)
        is_oco = self._protective_is_oco.pop(position_id, None)
        self._last_reconciled.pop(position_id, None)
        if order_id is None:
            return
        try:
            if is_oco:
                await self._request(
                    "DELETE", "/api/v3/orderList",
                    {"symbol": symbol, "orderListId": order_id}, signed=True,
                )
            else:
                await self._request(
                    "DELETE", "/api/v3/order",
                    {"symbol": symbol, "orderId": order_id}, signed=True,
                )
        except Exception as e:
            # Already filled or cancelled on the exchange — not an error.
            log.info(f"Protective order for {position_id} already inactive: {e}")

    async def cancel_order(self, order_id: str) -> bool:
        """Closes a position: cancels its protective order, then flattens
        with a real opposing MARKET order — previously this only removed
        the position from local tracking without touching the exchange at
        all, leaving the real position open."""
        pos = self._positions.get(order_id)
        if not pos:
            return False

        symbol = self._clean_symbol(pos.symbol)
        await self._cancel_protective_order(order_id, symbol)

        close_side = "SELL" if pos.direction == SignalAction.BUY else "BUY"
        try:
            await self._market_order(symbol, close_side, pos.volume)
        except Exception as e:
            log.error(f"Failed to flatten position {order_id} ({symbol}): {e}")
            return False

        self._positions.pop(order_id, None)
        log.info(f"Closed position: {pos.symbol} {pos.direction}")
        return True

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        """Binance has no in-place "modify SL" primitive — this cancels the
        existing protective order and places a new one at the updated
        levels. Previously this only updated local bookkeeping, so trailing
        stops never actually moved on the exchange."""
        pos = self._positions.get(position_id)
        if not pos:
            return False

        new_stop_loss = stop_loss if stop_loss is not None else pos.stop_loss
        new_take_profit = take_profit if take_profit is not None else pos.take_profit
        if not new_stop_loss or new_stop_loss <= 0:
            return False

        symbol = self._clean_symbol(pos.symbol)
        close_side = "SELL" if pos.direction == SignalAction.BUY else "BUY"

        await self._cancel_protective_order(position_id, symbol)
        try:
            await self._attach_protective_order(
                position_id, symbol, close_side, pos.volume, new_stop_loss, new_take_profit
            )
        except Exception as e:
            log.error(f"Failed to update protective order for {position_id}: {e}")
            return False

        pos.stop_loss = new_stop_loss
        pos.take_profit = new_take_profit
        return True

    async def get_positions(self) -> list[Position]:
        for position_id in list(self._positions.keys()):
            await self._reconcile_position(position_id)
        return list(self._positions.values())

    async def _reconcile_position(
        self, position_id: str, min_interval_seconds: float = 10.0
    ) -> None:
        """Detects when a position's protective order has already filled or
        been cancelled on the exchange (e.g. the stop-loss was hit) and
        drops it from local tracking — otherwise the bot would keep
        believing a position is open long after Binance closed it.
        Throttled since this is called from get_positions(), which the
        agent loop polls every tick."""
        order_id = self._protective_orders.get(position_id)
        if order_id is None:
            return

        now = time.time()
        last = self._last_reconciled.get(position_id, 0)
        if now - last < min_interval_seconds:
            return
        self._last_reconciled[position_id] = now

        pos = self._positions.get(position_id)
        if not pos:
            return
        symbol = self._clean_symbol(pos.symbol)

        try:
            if self._protective_is_oco.get(position_id):
                # Unlike DELETE /api/v3/orderList, the GET variant is queried
                # by orderListId alone — it does not accept `symbol`.
                status = await self._request(
                    "GET", "/api/v3/orderList",
                    {"orderListId": order_id}, signed=True,
                )
                done = status.get("listOrderStatus") == "ALL_DONE"
            else:
                status = await self._request(
                    "GET", "/api/v3/order",
                    {"symbol": symbol, "orderId": order_id}, signed=True,
                )
                done = status.get("status") in ("FILLED", "CANCELED", "EXPIRED", "REJECTED")
        except Exception as e:
            log.warning(f"Failed to reconcile position {position_id}: {e}")
            return

        if done:
            log.info(
                f"Protective order for {position_id} ({symbol}) is done — position closed on exchange"
            )
            self._positions.pop(position_id, None)
            self._protective_orders.pop(position_id, None)
            self._protective_is_oco.pop(position_id, None)
            self._last_reconciled.pop(position_id, None)

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
            balance = self._spot_usdt_balance(account)
            equity = balance  # spot has no separate margin/equity concept

            # If spot balance is near zero, check margin account (production
            # accounts may hold funds there instead — not available on Testnet)
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
