from __future__ import annotations

from collections import namedtuple
from decimal import Decimal
from types import SimpleNamespace

import pytest

from src.broker.mt5 import MT5Broker
from src.broker.mt5_identity import (
    MT5_COMMENT_MAX_LENGTH,
    encode_mt5_order_identity,
    is_xmbot_mt5_identity,
    mt5_identity_matches,
)
from src.core.types import Order, SignalAction

OrderRow = namedtuple(
    "OrderRow",
    "ticket state type volume_initial volume_current price_current symbol comment",
)
DealRow = namedtuple(
    "DealRow",
    "ticket order position_id time time_msc type entry magic volume price commission swap profit fee symbol comment",
)


class FakeMT5:
    ORDER_TYPE_BUY = 0
    ORDER_TYPE_SELL = 1
    ORDER_TYPE_BUY_LIMIT = 2
    ORDER_TYPE_SELL_LIMIT = 3
    ORDER_TYPE_BUY_STOP = 4
    ORDER_TYPE_SELL_STOP = 5
    ORDER_TYPE_BUY_STOP_LIMIT = 6
    ORDER_TYPE_SELL_STOP_LIMIT = 7
    ORDER_STATE_STARTED = 0
    ORDER_STATE_PLACED = 1
    ORDER_STATE_CANCELED = 2
    ORDER_STATE_PARTIAL = 3
    ORDER_STATE_FILLED = 4
    ORDER_STATE_REJECTED = 5
    ORDER_STATE_EXPIRED = 6
    DEAL_TYPE_BUY = 0
    DEAL_TYPE_SELL = 1
    DEAL_ENTRY_IN = 0
    DEAL_ENTRY_OUT = 1
    DEAL_ENTRY_INOUT = 2
    DEAL_ENTRY_OUT_BY = 3
    TRADE_ACTION_DEAL = 1
    ORDER_TIME_GTC = 0
    ORDER_FILLING_IOC = 1
    TRADE_RETCODE_DONE = 10009

    def __init__(self, orders=(), deals=()):
        self.orders = list(orders)
        self.deals = list(deals)
        self.order_send_calls = 0

    def terminal_info(self):
        return object()

    def orders_get(self, **kwargs):
        ticket = kwargs.get("ticket")
        symbol = kwargs.get("symbol")
        return tuple(
            item
            for item in self.orders
            if (ticket is None or item.ticket == ticket)
            and (symbol is None or item.symbol == symbol)
        )

    def history_orders_get(self, *_args):
        return tuple(self.orders)

    def history_deals_get(self, *_args):
        return tuple(self.deals)

    def symbol_info_tick(self, _symbol):
        return SimpleNamespace(ask=2650.1, bid=2649.9)

    def order_send(self, _request):
        self.order_send_calls += 1
        return SimpleNamespace(
            retcode=self.TRADE_RETCODE_DONE,
            order=999,
            price=2650.1,
            volume=0.1,
        )

    def last_error(self):
        return (0, "ok")


def connected_broker(fake: FakeMT5) -> MT5Broker:
    broker = MT5Broker(idempotency_verified=True)
    broker._mt5 = fake
    broker._connected = True
    return broker


def test_mt5_identity_is_deterministic_and_comment_safe() -> None:
    identity = encode_mt5_order_identity("XMB-BUY-client-order")
    assert identity == encode_mt5_order_identity("XMB-BUY-client-order")
    assert len(identity) <= MT5_COMMENT_MAX_LENGTH
    assert is_xmbot_mt5_identity(identity)
    assert mt5_identity_matches(identity, "XMB-BUY-client-order")
    assert not mt5_identity_matches(identity, "different")


@pytest.mark.asyncio
async def test_mt5_lookup_and_deal_financial_normalization() -> None:
    client_id = "XMB-BUY-client-order"
    comment = encode_mt5_order_identity(client_id)
    order = OrderRow(101, 4, 0, 0.1, 0, 2650.1, "XAUUSD", comment)
    deal = DealRow(
        501,
        101,
        301,
        1_700_000_000,
        1_700_000_000_000,
        1,
        1,
        999001,
        0.1,
        2660.0,
        -0.5,
        -0.2,
        10.0,
        -0.1,
        "XAUUSD",
        comment,
    )
    broker = connected_broker(FakeMT5([order], [deal]))

    snapshot = await broker.get_order_by_client_id(client_id, "XAUUSD")
    executions = await broker.get_executions(client_order_id=client_id, symbol="XAUUSD")

    assert snapshot is not None
    assert snapshot.status == "FILLED"
    assert snapshot.filled_quantity == Decimal("0.1")
    assert len(executions) == 1
    execution = executions[0]
    assert execution.entry_type == "OUT"
    assert execution.position_id == "301"
    assert execution.gross_profit == Decimal("10.0")
    assert execution.commission == Decimal("-0.5")
    assert execution.swap == Decimal("-0.2")
    assert execution.fee == Decimal("-0.1")
    assert execution.realized_pnl == Decimal("9.2")


@pytest.mark.asyncio
async def test_mt5_existing_identity_prevents_duplicate_native_order() -> None:
    client_id = "XMB-BUY-client-order"
    native = OrderRow(
        101,
        FakeMT5.ORDER_STATE_FILLED,
        FakeMT5.ORDER_TYPE_BUY,
        0.1,
        0,
        2650.1,
        "XAUUSD",
        encode_mt5_order_identity(client_id),
    )
    fake = FakeMT5([native])
    broker = connected_broker(fake)
    result = await broker.place_order(
        Order(
            id="intent-1",
            signal_id="signal-1",
            action=SignalAction.BUY,
            market="XAUUSD",
            volume=0.1,
            price=2650,
            stop_loss=2640,
            client_order_id=client_id,
        )
    )

    assert result.success
    assert result.broker_order_id == "101"
    assert fake.order_send_calls == 0


def test_mt5_unknown_order_state_is_not_assumed_acknowledged() -> None:
    broker = connected_broker(FakeMT5())
    assert broker._normalize_order_state(9999) == "UNKNOWN"


def test_mt5_deal_entry_semantics_are_explicit() -> None:
    broker = connected_broker(FakeMT5())
    assert broker._deal_entry_name(FakeMT5.DEAL_ENTRY_IN) == "IN"
    assert broker._deal_entry_name(FakeMT5.DEAL_ENTRY_OUT) == "OUT"
    assert broker._deal_entry_name(FakeMT5.DEAL_ENTRY_INOUT) == "INOUT"
    assert broker._deal_entry_name(FakeMT5.DEAL_ENTRY_OUT_BY) == "OUT_BY"
    assert broker._deal_entry_name(999) == "UNKNOWN"
