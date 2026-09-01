from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from ..core.types import (
    AccountInfo,
    BrokerExecution,
    BrokerOrderSnapshot,
    Market,
    Order,
    OrderResult,
    Position,
    PriceTick,
    SignalAction,
)
from .base import Broker, BrokerStatus
from .mt5_identity import encode_mt5_order_identity, mt5_identity_matches

log = logging.getLogger("xmbot.broker.mt5")

_MT5 = None

def _get_mt5():
    global _MT5
    if _MT5 is not None:
        return _MT5 if _MT5 is not False else None
    try:
        import MetaTrader5 as mt5
        _MT5 = mt5
        return _MT5
    except ImportError:
        log.warning("MetaTrader5 not installed. MT5 broker unavailable.")
        _MT5 = False
        return None


class MT5Broker(Broker):
    def __init__(
        self,
        path: str = "",
        login: int = 0,
        password: str = "",
        server: str = "",
        symbol: str = "XAUUSD",
        magic_number: int = 999001,
        deviation: int = 20,
        idempotency_verified: bool = False,
    ) -> None:
        super().__init__("mt5")
        self._path = path
        self._login = login
        self._password = password
        self._server = server
        self._symbol = symbol
        self._magic_number = magic_number
        self._deviation = deviation
        self._connected = False
        self._mt5 = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._idempotency_verified = idempotency_verified

    @property
    def supports_idempotent_execution(self) -> bool:
        # Enabling this requires a separately executed MT5 demo validation.
        return self._idempotency_verified

    async def _run_sync(self, func, *args, **kwargs):
        loop = self._loop or asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))

    async def connect(self) -> bool:
        self._loop = asyncio.get_running_loop()
        self._mt5 = _get_mt5()
        if not self._mt5:
            log.error("MetaTrader5 package not installed")
            return False

        if self._path:
            result = await self._run_sync(self._mt5.initialize, path=self._path)
        else:
            result = await self._run_sync(self._mt5.initialize)

        if not result:
            error = await self._run_sync(self._mt5.last_error)
            log.error(f"MT5 initialize failed: {error}")
            self.status = BrokerStatus.ERROR
            return False

        if self._login and self._password:
            authorized = await self._run_sync(
                self._mt5.login, login=self._login, password=self._password, server=self._server
            )
            if not authorized:
                error = await self._run_sync(self._mt5.last_error)
                log.error(f"MT5 login failed: {error}")
                await self._run_sync(self._mt5.shutdown)
                self.status = BrokerStatus.ERROR
                return False

        await self._run_sync(self._mt5.symbol_select, self._symbol, True)
        self._connected = True
        self.status = BrokerStatus.CONNECTED
        account = await self._run_sync(self._mt5.account_info)
        if account:
            log.info(f"MT5 connected — account {account.login} balance=${account.balance:.2f}")
        else:
            log.info("MT5 connected")
        return True

    async def disconnect(self) -> bool:
        if self._mt5:
            await self._run_sync(self._mt5.shutdown)
        self._connected = False
        self.status = BrokerStatus.DISCONNECTED
        return True

    async def is_connected(self) -> bool:
        if not self._mt5:
            return False
        if not self._connected:
            return False
        info = await self._run_sync(self._mt5.terminal_info)
        return info is not None

    async def _mt5_call(self, name, *args, **kwargs):
        func = getattr(self._mt5, name, None)
        if func is None:
            raise AttributeError(f"MT5 has no method {name}")
        return await self._run_sync(func, *args, **kwargs)

    async def place_order(self, order: Order) -> OrderResult:
        if not await self.is_connected():
            return OrderResult(success=False, order_id=order.id, error="Not connected")

        if not order.client_order_id:
            return OrderResult(success=False, order_id=order.id, error="Missing client_order_id")
        existing = await self.get_order_by_client_id(order.client_order_id, order.market)
        if existing is not None:
            return OrderResult(
                success=True,
                order_id=order.id,
                broker_order_id=existing.broker_order_id,
                filled_price=float(existing.average_fill_price or 0),
                filled_volume=float(existing.filled_quantity),
            )

        mt5 = self._mt5
        mt5_order_type = mt5.ORDER_TYPE_BUY if order.action == SignalAction.BUY else mt5.ORDER_TYPE_SELL
        tick = await self._run_sync(mt5.symbol_info_tick, order.market)
        if not tick:
            return OrderResult(success=False, order_id=order.id, error="No tick data")

        price = tick.ask if order.action == SignalAction.BUY else tick.bid
        sl = order.stop_loss if order.stop_loss > 0 else 0.0
        tp = order.take_profit if order.take_profit and order.take_profit > 0 else 0.0

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": order.market,
            "volume": order.volume,
            "type": mt5_order_type,
            "price": price,
            "sl": sl,
            "tp": tp,
            "deviation": self._deviation,
            "magic": self._magic_number,
            "comment": encode_mt5_order_identity(order.client_order_id),
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = await self._run_sync(mt5.order_send, request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            log.info(f"MT5 order filled: {order.action} {order.market} {order.volume} @ {result.price}")
            return OrderResult(
                success=True,
                order_id=order.id,
                broker_order_id=str(result.order),
                filled_price=result.price,
                filled_volume=result.volume,
            )
        else:
            retcode = result.retcode if result else "N/A"
            comment = result.comment if result else "N/A"
            error_msg = f"Order failed: retcode={retcode}, comment={comment}"
            log.error(f"MT5 {error_msg}")
            return OrderResult(success=False, order_id=order.id, error=error_msg)

    async def get_order_by_client_id(
        self, client_order_id: str, symbol: str | None = None
    ) -> BrokerOrderSnapshot | None:
        self._require_connected()
        candidates = list(await self._run_sync(self._mt5.orders_get, symbol=symbol) or [])
        date_to = datetime.now(UTC)
        candidates.extend(
            list(await self._run_sync(self._mt5.history_orders_get, date_to - timedelta(days=30), date_to) or [])
        )
        for native in candidates:
            if mt5_identity_matches(getattr(native, "comment", None), client_order_id):
                return self._normalize_order(native, client_order_id)

        deals = await self.get_executions(client_order_id=client_order_id, symbol=symbol)
        if not deals:
            return None
        quantity = sum((deal.quantity for deal in deals), Decimal("0"))
        notional = sum((deal.quantity * deal.price for deal in deals), Decimal("0"))
        first = deals[0]
        return BrokerOrderSnapshot(
            broker_order_id=first.broker_order_id,
            client_order_id=client_order_id,
            symbol=first.symbol,
            side=first.side,
            order_type="MARKET",
            status="FILLED",
            requested_quantity=quantity,
            filled_quantity=quantity,
            average_fill_price=notional / quantity if quantity else None,
            raw_response={"recovered_from_deals": True},
        )

    async def get_order(
        self, broker_order_id: str, symbol: str | None = None
    ) -> BrokerOrderSnapshot | None:
        self._require_connected()
        native = await self._run_sync(self._mt5.orders_get, ticket=int(broker_order_id))
        candidates = list(native or [])
        if not candidates:
            date_to = datetime.now(UTC)
            native = await self._run_sync(
                self._mt5.history_orders_get, date_to - timedelta(days=30), date_to
            )
            candidates = [item for item in (native or []) if str(item.ticket) == broker_order_id]
        if not candidates:
            return None
        comment = getattr(candidates[0], "comment", "")
        return self._normalize_order(candidates[0], comment)

    async def get_open_orders(self) -> list[BrokerOrderSnapshot]:
        self._require_connected()
        return [
            self._normalize_order(native, getattr(native, "comment", ""))
            for native in (await self._run_sync(self._mt5.orders_get) or [])
        ]

    async def get_executions(
        self,
        *,
        broker_order_id: str | None = None,
        client_order_id: str | None = None,
        symbol: str | None = None,
        since: datetime | None = None,
        position_id: str | None = None,
    ) -> list[BrokerExecution]:
        self._require_connected()
        date_to = datetime.now(UTC)
        date_from = since or (date_to - timedelta(days=30))
        native_deals = await self._run_sync(self._mt5.history_deals_get, date_from, date_to)
        if native_deals is None:
            raise RuntimeError(f"MT5 deal history unavailable: {self._mt5.last_error()}")
        matching_order_ids: set[str] = set()
        if client_order_id:
            history_orders = await self._run_sync(self._mt5.history_orders_get, date_from, date_to)
            matching_order_ids = {
                str(item.ticket)
                for item in (history_orders or [])
                if mt5_identity_matches(getattr(item, "comment", None), client_order_id)
            }
        normalized = []
        for deal in native_deals:
            comment = str(getattr(deal, "comment", "") or "")
            if broker_order_id and str(getattr(deal, "order", "")) != broker_order_id:
                continue
            if client_order_id and not (
                mt5_identity_matches(comment, client_order_id)
                or str(getattr(deal, "order", "")) in matching_order_ids
            ):
                continue
            if symbol and getattr(deal, "symbol", None) != symbol:
                continue
            if position_id and str(getattr(deal, "position_id", "")) != position_id:
                continue
            normalized.append(self._normalize_deal(deal, client_order_id or comment))
        return normalized

    def _normalize_order(self, native, client_order_id: str) -> BrokerOrderSnapshot:
        state = self._normalize_order_state(int(getattr(native, "state", -1)))
        side = (
            SignalAction.BUY
            if int(getattr(native, "type", -1)) in self._buy_order_types()
            else SignalAction.SELL
        )
        initial = Decimal(str(getattr(native, "volume_initial", 0)))
        current = Decimal(str(getattr(native, "volume_current", 0)))
        return BrokerOrderSnapshot(
            broker_order_id=str(native.ticket),
            client_order_id=client_order_id,
            symbol=str(native.symbol),
            side=side,
            order_type="MARKET" if int(getattr(native, "type", -1)) in self._market_order_types() else "PENDING",
            status=state,
            requested_quantity=initial,
            filled_quantity=max(Decimal("0"), initial - current),
            average_fill_price=Decimal(str(getattr(native, "price_current", 0) or 0)),
            raw_response=self._asdict(native),
        )

    def _normalize_deal(self, deal, client_order_id: str) -> BrokerExecution:
        profit = Decimal(str(getattr(deal, "profit", 0) or 0))
        commission = Decimal(str(getattr(deal, "commission", 0) or 0))
        swap = Decimal(str(getattr(deal, "swap", 0) or 0))
        fee = Decimal(str(getattr(deal, "fee", 0) or 0))
        entry = self._deal_entry_name(int(getattr(deal, "entry", -1)))
        return BrokerExecution(
            broker_execution_id=str(deal.ticket),
            broker_trade_id=str(getattr(deal, "position_id", "") or "") or None,
            broker_order_id=str(deal.order),
            client_order_id=client_order_id,
            symbol=str(deal.symbol),
            side=(SignalAction.BUY if int(deal.type) == self._mt5.DEAL_TYPE_BUY else SignalAction.SELL),
            quantity=Decimal(str(deal.volume)),
            price=Decimal(str(deal.price)),
            timestamp=datetime.fromtimestamp(
                getattr(deal, "time_msc", int(deal.time) * 1000) / 1000, tz=UTC
            ),
            commission=commission,
            fee=fee,
            realized_pnl=profit + commission + swap + fee if entry != "IN" else None,
            gross_profit=profit,
            swap=swap,
            position_id=str(getattr(deal, "position_id", "") or "") or None,
            entry_type=entry,
            magic=int(getattr(deal, "magic", 0) or 0),
            comment=str(getattr(deal, "comment", "") or ""),
            raw_response=self._asdict(deal),
        )

    def _normalize_order_state(self, state: int) -> str:
        mapping = {
            self._mt5.ORDER_STATE_STARTED: "ACKNOWLEDGED",
            self._mt5.ORDER_STATE_PLACED: "ACKNOWLEDGED",
            self._mt5.ORDER_STATE_PARTIAL: "PARTIALLY_FILLED",
            self._mt5.ORDER_STATE_FILLED: "FILLED",
            self._mt5.ORDER_STATE_CANCELED: "CANCELLED",
            self._mt5.ORDER_STATE_REJECTED: "REJECTED",
            self._mt5.ORDER_STATE_EXPIRED: "CANCELLED",
        }
        return mapping.get(state, "UNKNOWN")

    def _deal_entry_name(self, entry: int) -> str:
        mapping = {
            self._mt5.DEAL_ENTRY_IN: "IN",
            self._mt5.DEAL_ENTRY_OUT: "OUT",
            self._mt5.DEAL_ENTRY_INOUT: "INOUT",
            self._mt5.DEAL_ENTRY_OUT_BY: "OUT_BY",
        }
        return mapping.get(entry, "UNKNOWN")

    def _buy_order_types(self) -> set[int]:
        return {
            self._mt5.ORDER_TYPE_BUY,
            self._mt5.ORDER_TYPE_BUY_LIMIT,
            self._mt5.ORDER_TYPE_BUY_STOP,
            self._mt5.ORDER_TYPE_BUY_STOP_LIMIT,
        }

    def _market_order_types(self) -> set[int]:
        return {self._mt5.ORDER_TYPE_BUY, self._mt5.ORDER_TYPE_SELL}

    def _require_connected(self) -> None:
        if not self._mt5 or not self._connected:
            raise RuntimeError("MT5 is not connected")

    @staticmethod
    def _asdict(value) -> dict:
        return value._asdict() if hasattr(value, "_asdict") else dict(vars(value))

    async def cancel_order(self, order_id: str) -> bool:
        return True

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        if not await self.is_connected():
            return False

        request = {
            "action": self._mt5.TRADE_ACTION_SLTP,
            "position": int(position_id),
            "symbol": self._symbol,
            "sl": stop_loss or 0.0,
            "tp": take_profit or 0.0,
        }
        result = await self._run_sync(self._mt5.order_send, request)
        return result is not None and result.retcode == self._mt5.TRADE_RETCODE_DONE

    async def get_positions(self) -> list[Position]:
        if not await self.is_connected():
            return []

        mt5_positions = await self._run_sync(self._mt5.positions_get, symbol=self._symbol) or []
        tick = await self._run_sync(self._mt5.symbol_info_tick, self._symbol)
        positions = []

        for pos in mt5_positions:
            current = tick.bid if pos.type == self._mt5.ORDER_TYPE_BUY else tick.ask

            positions.append(Position(
                id=str(pos.ticket),
                symbol=pos.symbol,
                direction=SignalAction.BUY if pos.type == self._mt5.ORDER_TYPE_BUY else SignalAction.SELL,
                volume=pos.volume,
                entry_price=pos.price_open,
                current_price=current,
                stop_loss=pos.sl,
                take_profit=pos.tp,
                unrealized_pnl=pos.profit,
                realized_pnl=0.0,
                open_time=datetime.fromtimestamp(pos.time),
                broker_position_id=str(pos.ticket),
            ))

        return positions

    async def get_account(self) -> AccountInfo | None:
        if not await self.is_connected():
            return None

        acct = await self._run_sync(self._mt5.account_info)
        if not acct:
            return None

        return AccountInfo(
            broker="mt5",
            balance=acct.balance,
            equity=acct.equity,
            margin=acct.margin,
            margin_free=acct.margin_free,
            currency=acct.currency,
            leverage=acct.leverage,
            is_connected=True,
            external_account_id=str(acct.login),
        )

    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        if not await self.is_connected():
            return []

        mt5_tf = self._parse_timeframe(timeframe)
        rates = await self._run_sync(self._mt5.copy_rates_from_pos, symbol, mt5_tf, 0, count)
        if rates is None:
            log.warning(f"No MT5 data for {symbol} {timeframe}")
            return []

        markets = []
        for rate in rates:
            markets.append(Market(
                symbol=symbol,
                timeframe=timeframe,
                bid=rate.close - 0.1,
                ask=rate.close + 0.1,
                open=rate.open,
                high=rate.high,
                low=rate.low,
                close=rate.close,
                volume=rate.tick_volume or rate.real_volume,
                timestamp=datetime.fromtimestamp(rate.time),
            ))

        return markets

    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        while await self.is_connected():
            for symbol in symbols:
                tick = await self._run_sync(self._mt5.symbol_info_tick, symbol)
                if tick:
                    yield PriceTick(
                        symbol=symbol,
                        bid=tick.bid,
                        ask=tick.ask,
                        timestamp=datetime.now(),
                        volume=tick.volume or 0,
                    )
            await asyncio.sleep(1)

    def _parse_timeframe(self, tf: str):
        if not self._mt5:
            return None
        mapping = {
            "M1": self._mt5.TIMEFRAME_M1,
            "M5": self._mt5.TIMEFRAME_M5,
            "M15": self._mt5.TIMEFRAME_M15,
            "M30": self._mt5.TIMEFRAME_M30,
            "H1": self._mt5.TIMEFRAME_H1,
            "H4": self._mt5.TIMEFRAME_H4,
            "D1": self._mt5.TIMEFRAME_D1,
        }
        return mapping.get(tf.upper(), self._mt5.TIMEFRAME_M5)
