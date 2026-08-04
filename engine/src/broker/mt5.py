from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from datetime import datetime

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
            authorized = await self._run_sync(self._mt5.login, login=self._login, password=self._password, server=self._server)
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
            "comment": f"xmbot_{order.user_id}" if order.user_id else "xmbot",
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
            error_msg = f"Order failed: retcode={result.retcode if result else 'N/A'}, comment={result.comment if result else 'N/A'}"
            log.error(f"MT5 {error_msg}")
            return OrderResult(success=False, order_id=order.id, error=error_msg)

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
