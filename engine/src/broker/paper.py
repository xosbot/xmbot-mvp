from __future__ import annotations

import asyncio
import logging
import random
import uuid
from collections.abc import AsyncIterator
from datetime import datetime

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

log = logging.getLogger("xmbot.broker.paper")


class PaperBroker(Broker):
    def __init__(self, initial_balance: float = 10000.0) -> None:
        super().__init__("paper")
        self._balance = initial_balance
        self._equity = initial_balance
        self._positions: list[Position] = []
        self._orders: list[Order] = []
        self._prices: dict[str, float] = {"XAUUSD": 2650.0}

    async def connect(self) -> bool:
        self.status = BrokerStatus.CONNECTED
        log.info(f"Paper broker connected (balance=${self._balance:.2f})")
        return True

    async def disconnect(self) -> bool:
        self.status = BrokerStatus.DISCONNECTED
        return True

    async def is_connected(self) -> bool:
        return self.status == BrokerStatus.CONNECTED

    async def place_order(self, order: Order) -> OrderResult:
        current_price = self._prices.get(order.market, 2650.0)
        filled_price = current_price + random.uniform(-0.5, 0.5)

        if order.action == SignalAction.BUY:
            self._positions.append(Position(
                id=str(uuid.uuid4()),
                symbol=order.market,
                direction=SignalAction.BUY,
                volume=order.volume,
                entry_price=filled_price,
                current_price=filled_price,
                stop_loss=order.stop_loss,
                take_profit=order.take_profit,
            ))
        elif order.action == SignalAction.SELL:
            self._positions.append(Position(
                id=str(uuid.uuid4()),
                symbol=order.market,
                direction=SignalAction.SELL,
                volume=order.volume,
                entry_price=filled_price,
                current_price=filled_price,
                stop_loss=order.stop_loss,
                take_profit=order.take_profit,
            ))

        order.status = OrderStatus.FILLED
        order.filled_price = filled_price
        order.filled_at = datetime.utcnow()

        self._orders.append(order)

        log.info(f"Paper: {order.action} {order.market} {order.volume} @ {filled_price:.2f}")
        return OrderResult(success=True, order_id=order.id, filled_price=filled_price, filled_volume=order.volume)

    async def cancel_order(self, order_id: str) -> bool:
        before = len(self._positions)
        self._positions = [p for p in self._positions if p.id != order_id]
        return len(self._positions) < before

    async def modify_position(
        self,
        position_id: str,
        stop_loss: float | None = None,
        take_profit: float | None = None,
    ) -> bool:
        for pos in self._positions:
            if pos.id == position_id:
                if stop_loss:
                    pos.stop_loss = stop_loss
                if take_profit:
                    pos.take_profit = take_profit
                return True
        return False

    async def get_positions(self) -> list[Position]:
        self._simulate_price_movement()
        return self._positions

    async def get_account(self) -> AccountInfo | None:
        total_pnl = sum(p.unrealized_pnl for p in self._positions)
        return AccountInfo(
            broker="paper",
            balance=self._balance,
            equity=self._balance + total_pnl,
            margin=0.0,
            margin_free=self._balance + total_pnl,
            is_connected=True,
        )

    async def get_market_data(
        self, symbol: str, timeframe: str, count: int = 100
    ) -> list[Market]:
        base = self._prices.get(symbol, 2650.0)
        markets = []
        for i in range(count):
            volatility = base * 0.001
            o = base + random.uniform(-volatility, volatility)
            h = o + random.uniform(0, volatility)
            low = o - random.uniform(0, volatility)
            c = random.uniform(low, h)
            markets.append(Market(
                symbol=symbol,
                timeframe=timeframe,
                bid=c - 0.1,
                ask=c + 0.1,
                open=o,
                high=h,
                low=low,
                close=c,
                volume=random.uniform(100, 1000),
                timestamp=datetime.utcnow(),
            ))
            base = c
        self._prices[symbol] = base
        return markets

    async def stream_prices(self, symbols: list[str]) -> AsyncIterator[PriceTick]:
        while True:
            for symbol in symbols:
                base = self._prices.get(symbol, 2650.0)
                tick = base + random.uniform(-0.5, 0.5)
                self._prices[symbol] = tick
                yield PriceTick(
                    symbol=symbol,
                    bid=tick - 0.1,
                    ask=tick + 0.1,
                    timestamp=datetime.utcnow(),
                )
            await asyncio.sleep(1)

    def _simulate_price_movement(self) -> None:
        closed: list[str] = []
        for pos in self._positions:
            tick = self._prices.get(pos.symbol, 2650.0)
            change = random.uniform(-2.0, 2.0)
            new_price = tick + change
            self._prices[pos.symbol] = new_price
            pos.current_price = new_price

            if pos.direction == SignalAction.BUY:
                pos.unrealized_pnl = (new_price - pos.entry_price) * pos.volume * 100
            else:
                pos.unrealized_pnl = (pos.entry_price - new_price) * pos.volume * 100

            # Stop-loss check
            if pos.direction == SignalAction.BUY and new_price <= pos.stop_loss:
                pos.unrealized_pnl = 0
                closed.append(pos.id)
                log.info(f"Paper: Position {pos.id} stopped out at {new_price:.2f}")
            elif pos.direction == SignalAction.SELL and new_price >= pos.stop_loss:
                pos.unrealized_pnl = 0
                closed.append(pos.id)
                log.info(f"Paper: Position {pos.id} stopped out at {new_price:.2f}")

            # Take-profit check
            elif pos.take_profit is not None:
                if pos.direction == SignalAction.BUY and new_price >= pos.take_profit:
                    pos.unrealized_pnl = (pos.take_profit - pos.entry_price) * pos.volume * 100
                    closed.append(pos.id)
                    log.info(f"Paper: Position {pos.id} take-profit at {new_price:.2f}")
                elif pos.direction == SignalAction.SELL and new_price <= pos.take_profit:
                    pos.unrealized_pnl = (pos.entry_price - pos.take_profit) * pos.volume * 100
                    closed.append(pos.id)
                    log.info(f"Paper: Position {pos.id} take-profit at {new_price:.2f}")

        self._positions = [p for p in self._positions if p.id not in closed]
