from __future__ import annotations

import asyncio
import logging
import threading
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from ..core.types import (
    AccountInfo,
    Market,
    Order,
    OrderResult,
    Position,
    PriceTick,
    SignalAction,
)
from .base import Broker, BrokerStatus

log = logging.getLogger("xmbot.broker.ibkr")

try:
    from ibapi.client import EClient
    from ibapi.contract import Contract as IBContract
    from ibapi.order import Order as IBOrder
    from ibapi.wrapper import EWrapper

    _IBAPI_AVAILABLE = True
except ImportError:
    # Two distinct no-op stand-ins (not both `object`) so `_IBClient(EWrapper, EClient)`
    # below still defines cleanly when ibapi isn't installed. IBKRBroker.connect()
    # checks _IBAPI_AVAILABLE before ever instantiating _IBClient, so these are never
    # actually used — they only exist to keep the module importable.
    class EWrapper:  # type: ignore[no-redef]
        pass

    class EClient:  # type: ignore[no-redef]
        def __init__(self, wrapper) -> None:
            pass

    _IBAPI_AVAILABLE = False


_BAR_SIZE = {
    "M1": "1 min",
    "M5": "5 mins",
    "M15": "15 mins",
    "M30": "30 mins",
    "H1": "1 hour",
    "H4": "4 hours",
    "D1": "1 day",
}

_BAR_SECONDS = {
    "M1": 60,
    "M5": 300,
    "M15": 900,
    "M30": 1800,
    "H1": 3600,
    "H4": 14400,
    "D1": 86400,
}


class _IBClient(EWrapper, EClient):  # type: ignore[misc]
    """Thin EWrapper/EClient bridge — callbacks (fired on the reader thread) are
    marshaled onto the broker's asyncio event loop via call_soon_threadsafe so the
    rest of IBKRBroker can `await` them like any other broker call."""

    def __init__(self, on_ready_loop_getter):
        EClient.__init__(self, self)
        self._get_loop = on_ready_loop_getter
        self.next_order_id: int | None = None
        self.ready = threading.Event()

        self._positions_queue: asyncio.Queue | None = None
        self._account_queue: asyncio.Queue | None = None
        self._historical_queue: asyncio.Queue | None = None
        self._order_status_queues: dict[int, asyncio.Queue] = {}
        self._tick_queue: asyncio.Queue | None = None

    def _put(self, queue: asyncio.Queue | None, item: Any) -> None:
        if queue is None:
            return
        loop = self._get_loop()
        if loop is None:
            return
        loop.call_soon_threadsafe(queue.put_nowait, item)

    # -- connection lifecycle -------------------------------------------------
    def nextValidId(self, orderId: int) -> None:  # noqa: N802 (ibapi callback name)
        self.next_order_id = orderId
        self.ready.set()

    def error(
        self, reqId: int, errorCode: int, errorString: str, advancedOrderRejectJson: str = ""
    ) -> None:  # noqa: N802, N803
        # IB multiplexes informational messages (market data farm connections, etc.)
        # through error() too — only warn loudly on the codes that matter.
        if errorCode >= 2100 and errorCode < 2200:
            log.debug(f"IBKR info [{errorCode}]: {errorString}")
        else:
            log.warning(f"IBKR error [{reqId}] {errorCode}: {errorString}")

    # -- positions --------------------------------------------------------------
    def position(self, account: str, contract, position: float, avgCost: float) -> None:  # noqa: N802, N803
        self._put(self._positions_queue, ("position", contract, position, avgCost))

    def positionEnd(self) -> None:  # noqa: N802
        self._put(self._positions_queue, ("end", None, None, None))

    # -- account summary ----------------------------------------------------
    def accountSummary(self, reqId: int, account: str, tag: str, value: str, currency: str) -> None:  # noqa: N802, N803
        self._put(self._account_queue, ("row", tag, value, currency))

    def accountSummaryEnd(self, reqId: int) -> None:  # noqa: N802, N803
        self._put(self._account_queue, ("end", None, None, None))

    # -- historical data ------------------------------------------------------
    def historicalData(self, reqId: int, bar) -> None:  # noqa: N802, N803
        self._put(self._historical_queue, ("bar", bar))

    def historicalDataEnd(self, reqId: int, start: str, end: str) -> None:  # noqa: N802, N803
        self._put(self._historical_queue, ("end", None))

    # -- streaming ticks ------------------------------------------------------
    def tickPrice(self, reqId: int, tickType: int, price: float, attrib) -> None:  # noqa: N802, N803
        self._put(self._tick_queue, (reqId, tickType, price))

    # -- order status -----------------------------------------------------------
    def orderStatus(  # noqa: N802
        self, orderId, status, filled, remaining, avgFillPrice,  # noqa: N803
        permId, parentId, lastFillPrice, clientId, whyHeld, mktCapPrice,  # noqa: N803
    ) -> None:
        queue = self._order_status_queues.get(orderId)
        self._put(queue, (status, avgFillPrice, orderId))


class IBKRBroker(Broker):
    """Interactive Brokers, via the ibapi TWS/Gateway socket API.

    Unlike MT5's simple blocking-call SDK, ibapi is callback-driven: EClient.run()
    blocks reading the socket on its own thread and dispatches to EWrapper callbacks
    on that same thread. We bridge those callbacks to asyncio via queues fed through
    call_soon_threadsafe, so callers can `await` a position/account/history request
    the same way they would with any other broker here.

    IB has no single "place order with SL/TP" primitive like MT5's request dict — SL/TP
    is done via bracket orders (a parent entry order plus linked stop-loss and
    take-profit child orders). modify_position() therefore cancels and replaces the
    stop-loss child order rather than mutating a position in place.
    """

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 7497,
        client_id: int = 1,
        symbol: str = "XAUUSD",
        sec_type: str = "CFD",
        exchange: str = "SMART",
        currency: str = "USD",
        connect_timeout: float = 10.0,
        max_reconnect_attempts: int = 5,
        reconnect_delay: float = 5.0,
    ) -> None:
        super().__init__("ibkr")
        self._host = host
        self._port = port
        self._client_id = client_id
        self._symbol = symbol
        self._sec_type = sec_type
        self._exchange = exchange
        self._currency = currency
        self._connect_timeout = connect_timeout
        self._max_reconnect_attempts = max_reconnect_attempts
        self._reconnect_delay = reconnect_delay

        self._client: _IBClient | None = None
        self._thread: threading.Thread | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._connected = False
        self._req_id = 1000
        # order_id -> the (position-representing) stop-loss child order id, so
        # modify_position() knows what to cancel-and-replace.
        self._stop_child_orders: dict[str, int] = {}
        self._reconnect_count = 0
        self._last_health_check = 0.0
        self._health_check_interval = 30.0  # seconds

    def _next_req_id(self) -> int:
        self._req_id += 1
        return self._req_id

    def _contract(self) -> IBContract:
        contract = IBContract()
        contract.symbol = self._symbol
        contract.secType = self._sec_type
        contract.exchange = self._exchange
        contract.currency = self._currency
        return contract

    async def connect(self) -> bool:
        if not _IBAPI_AVAILABLE:
            log.error("ibapi package not installed — install the 'ibkr' extra to use this broker")
            return False

        self._loop = asyncio.get_running_loop()
        self._client = _IBClient(lambda: self._loop)

        try:
            self._client.connect(self._host, self._port, self._client_id)
        except (ConnectionRefusedError, OSError) as e:
            log.error(f"IBKR connect failed — is TWS/Gateway running at {self._host}:{self._port}? ({e})")
            self.status = BrokerStatus.ERROR
            return False

        self._thread = threading.Thread(target=self._client.run, name="ibkr-reader", daemon=True)
        self._thread.start()

        ready = await asyncio.get_running_loop().run_in_executor(
            None, self._client.ready.wait, self._connect_timeout
        )
        if not ready:
            log.error("IBKR handshake timed out (no nextValidId within timeout)")
            self.status = BrokerStatus.ERROR
            await self.disconnect()
            return False

        self._connected = True
        self._reconnect_count = 0
        self.status = BrokerStatus.CONNECTED
        log.info(f"IBKR connected — {self._host}:{self._port} (client {self._client_id})")
        return True

    async def disconnect(self) -> bool:
        if self._client:
            self._client.disconnect()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5.0)
        self._connected = False
        self.status = BrokerStatus.DISCONNECTED
        return True

    async def is_connected(self) -> bool:
        return bool(self._connected and self._client and self._client.isConnected())

    async def _health_check(self) -> bool:
        """Periodic health check to detect connection issues."""
        import time
        now = time.time()
        if now - self._last_health_check < self._health_check_interval:
            return True
        
        self._last_health_check = now
        if not await self.is_connected():
            log.warning("IBKR health check failed — connection lost")
            return False
        return True

    async def _reconnect(self) -> bool:
        """Attempt to reconnect to IBKR."""
        if self._reconnect_count >= self._max_reconnect_attempts:
            log.error(f"IBKR max reconnect attempts ({self._max_reconnect_attempts}) reached")
            self.status = BrokerStatus.ERROR
            return False

        self._reconnect_count += 1
        log.info(f"IBKR reconnecting (attempt {self._reconnect_count}/{self._max_reconnect_attempts})")

        await self.disconnect()
        await asyncio.sleep(self._reconnect_delay)
        return await self.connect()

    async def place_order(self, order: Order) -> OrderResult:
        if not await self.is_connected() or not self._client or self._client.next_order_id is None:
            # Try to reconnect
            if not await self._reconnect():
                return OrderResult(success=False, order_id=order.id, error="Not connected and reconnect failed")

        parent_id = self._client.next_order_id
        self._client.next_order_id += 3  # reserve parent + SL + TP ids

        action = "BUY" if order.action == SignalAction.BUY else "SELL"
        opposite = "SELL" if action == "BUY" else "BUY"
        contract = self._contract()

        parent = IBOrder()
        parent.orderId = parent_id
        parent.action = action
        parent.orderType = "MKT"
        parent.totalQuantity = order.volume
        parent.transmit = False

        stop_loss = IBOrder()
        stop_loss.orderId = parent_id + 1
        stop_loss.action = opposite
        stop_loss.orderType = "STP"
        stop_loss.auxPrice = order.stop_loss
        stop_loss.totalQuantity = order.volume
        stop_loss.parentId = parent_id
        stop_loss.transmit = order.take_profit is None

        orders = [parent, stop_loss]

        if order.take_profit:
            take_profit = IBOrder()
            take_profit.orderId = parent_id + 2
            take_profit.action = opposite
            take_profit.orderType = "LMT"
            take_profit.lmtPrice = order.take_profit
            take_profit.totalQuantity = order.volume
            take_profit.parentId = parent_id
            take_profit.transmit = True
            orders.append(take_profit)

        status_queue: asyncio.Queue = asyncio.Queue()
        self._client._order_status_queues[parent_id] = status_queue

        for ib_order in orders:
            self._client.placeOrder(ib_order.orderId, contract, ib_order)

        try:
            status, fill_price, _ = await asyncio.wait_for(status_queue.get(), timeout=15.0)
        except TimeoutError:
            return OrderResult(success=False, order_id=order.id, error="Order status timed out")
        finally:
            self._client._order_status_queues.pop(parent_id, None)

        self._stop_child_orders[order.id] = stop_loss.orderId

        if status in ("Filled", "Submitted", "PreSubmitted"):
            log.info(f"IBKR order {status.lower()}: {action} {self._symbol} {order.volume}")
            return OrderResult(
                success=True,
                order_id=order.id,
                broker_order_id=str(parent_id),
                filled_price=fill_price or order.price,
                filled_volume=order.volume,
            )
        return OrderResult(success=False, order_id=order.id, error=f"Order status: {status}")

    async def cancel_order(self, order_id: str) -> bool:
        if not self._client:
            return False
        self._client.cancelOrder(int(order_id), "")
        return True

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        # IB has no in-place SL/TP modify — cancel the existing stop-loss child order
        # and submit a fresh one at the new price.
        if not self._client or stop_loss is None:
            return False

        old_stop_id = self._stop_child_orders.get(position_id)
        if old_stop_id is None:
            log.warning(f"IBKR modify_position: no tracked stop order for {position_id}")
            return False

        self._client.cancelOrder(old_stop_id, "")

        positions = await self.get_positions()
        pos = next((p for p in positions if p.id == position_id), None)
        if pos is None:
            return False

        new_stop_id = self._client.next_order_id
        self._client.next_order_id += 1

        stop = IBOrder()
        stop.orderId = new_stop_id
        stop.action = "SELL" if pos.direction == SignalAction.BUY else "BUY"
        stop.orderType = "STP"
        stop.auxPrice = stop_loss
        stop.totalQuantity = pos.volume
        stop.transmit = True

        self._client.placeOrder(new_stop_id, self._contract(), stop)
        self._stop_child_orders[position_id] = new_stop_id
        return True

    async def get_positions(self) -> list[Position]:
        if not self._client or not await self.is_connected():
            return []

        queue: asyncio.Queue = asyncio.Queue()
        self._client._positions_queue = queue
        self._client.reqPositions()

        positions: list[Position] = []
        try:
            while True:
                kind, contract, size, avg_cost = await asyncio.wait_for(queue.get(), timeout=10.0)
                if kind == "end":
                    break
                if contract.symbol != self._symbol or size == 0:
                    continue
                positions.append(
                    Position(
                        id=f"ibkr-{contract.symbol}",
                        symbol=contract.symbol,
                        direction=SignalAction.BUY if size > 0 else SignalAction.SELL,
                        volume=abs(size),
                        entry_price=avg_cost,
                        current_price=avg_cost,
                        stop_loss=0.0,
                        open_time=datetime.now(UTC),
                    )
                )
        except TimeoutError:
            log.warning("IBKR reqPositions timed out")
        finally:
            self._client.cancelPositions()
            self._client._positions_queue = None

        return positions

    async def get_account(self) -> AccountInfo | None:
        if not self._client or not await self.is_connected():
            return None

        req_id = self._next_req_id()
        queue: asyncio.Queue = asyncio.Queue()
        self._client._account_queue = queue
        self._client.reqAccountSummary(
            req_id, "All", "NetLiquidation,AvailableFunds,BuyingPower,TotalCashValue"
        )

        values: dict[str, str] = {}
        currency = self._currency
        try:
            while True:
                kind, tag, value, curr = await asyncio.wait_for(queue.get(), timeout=10.0)
                if kind == "end":
                    break
                values[tag] = value
                currency = curr or currency
        except TimeoutError:
            log.warning("IBKR reqAccountSummary timed out")
        finally:
            self._client.cancelAccountSummary(req_id)
            self._client._account_queue = None

        if not values:
            return None

        balance = float(values.get("TotalCashValue", 0.0))
        equity = float(values.get("NetLiquidation", balance))
        margin_free = float(values.get("AvailableFunds", 0.0))

        return AccountInfo(
            broker="ibkr",
            balance=balance,
            equity=equity,
            margin=max(0.0, equity - margin_free),
            margin_free=margin_free,
            currency=currency,
            is_connected=True,
        )

    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        if not self._client or not await self.is_connected():
            return []

        bar_size = _BAR_SIZE.get(timeframe.upper(), "5 mins")
        seconds_needed = _BAR_SECONDS.get(timeframe.upper(), 300) * count
        duration = f"{max(1, seconds_needed // 86400)} D" if seconds_needed >= 86400 else f"{seconds_needed} S"

        req_id = self._next_req_id()
        queue: asyncio.Queue = asyncio.Queue()
        self._client._historical_queue = queue

        contract = self._contract()
        contract.symbol = symbol
        self._client.reqHistoricalData(
            req_id, contract, "", duration, bar_size, "MIDPOINT", 1, 1, False, []
        )

        markets: list[Market] = []
        try:
            while True:
                kind, bar = await asyncio.wait_for(queue.get(), timeout=15.0)
                if kind == "end":
                    break
                markets.append(
                    Market(
                        symbol=symbol,
                        timeframe=timeframe,
                        bid=bar.close - 0.1,
                        ask=bar.close + 0.1,
                        open=bar.open,
                        high=bar.high,
                        low=bar.low,
                        close=bar.close,
                        volume=bar.volume,
                        timestamp=datetime.now(UTC),
                    )
                )
        except TimeoutError:
            log.warning(f"IBKR reqHistoricalData timed out for {symbol} {timeframe}")
        finally:
            self._client._historical_queue = None

        return markets[-count:]

    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        if not self._client or not await self.is_connected():
            return

        queue: asyncio.Queue = asyncio.Queue()
        self._client._tick_queue = queue
        req_ids: dict[int, str] = {}

        for sym in symbols:
            req_id = self._next_req_id()
            contract = self._contract()
            contract.symbol = sym
            req_ids[req_id] = sym
            self._client.reqMktData(req_id, contract, "", False, False, [])

        last: dict[str, dict[str, float]] = {sym: {} for sym in symbols}
        try:
            while await self.is_connected():
                req_id, tick_type, price = await queue.get()
                sym = req_ids.get(req_id)
                if sym is None:
                    continue
                # tickType 1 = bid, 2 = ask (ibapi.ticktype.TickTypeEnum)
                if tick_type == 1:
                    last[sym]["bid"] = price
                elif tick_type == 2:
                    last[sym]["ask"] = price
                if "bid" in last[sym] and "ask" in last[sym]:
                    yield PriceTick(
                        symbol=sym,
                        bid=last[sym]["bid"],
                        ask=last[sym]["ask"],
                        timestamp=datetime.now(UTC),
                    )
        finally:
            for req_id in req_ids:
                self._client.cancelMktData(req_id)
            self._client._tick_queue = None
