# MT5 integration

## Sprint 3 audit

The original adapter submitted a market request with one process-wide login,
fixed magic number, and a user-derived comment. It read `positions_get()` and
`account_info()`, but did not read active orders, order history, or deal history.
It therefore could not recover a lost response or prove a closing price/P&L.

The engine detected `previous_position_ids - current_position_ids`, copied the
last quote and `old_pos.unrealized_pnl` into a closed-trade dictionary, and sent
that estimate to `RiskEngine.record_pnl()`. Startup connected the broker and
immediately launched strategy loops without durable-state reconciliation. A
single global MetaTrader5 module/session also meant accounts were not isolated.

## Python API capability used

The adapter now uses these MetaTrader5 Python integration calls:

- `orders_get()` for active orders.
- `history_orders_get(from, to)` for historical order identity/state.
- `history_deals_get(from, to)` for actual fills/deals and financial fields.
- `positions_get()` for live positions.
- `account_info()` for the connected account snapshot.

Tests use a realistic fake module because MetaTrader5 and a terminal are not
available in Linux CI. Broker/demo behavior must be validated separately.

## Identity mapping

XMBot hashes the deterministic client order ID into a 28-character
`XMB-<24 hex>` comment and keeps the configured magic number. Lookups compare
the requested client ID to that token across active orders, order history, and
deal history. The hash is one-way: PostgreSQL retains the full client ID while
MT5 carries only the correlation token.

MT5 comments can be altered/truncated by some servers or execution paths. The
demo validation must prove preservation for the selected broker. Until then,
`supports_idempotent_execution` remains false by default.

## Deal and P&L semantics

Deal entry values are explicitly classified as `IN`, `OUT`, `INOUT`, `OUT_BY`,
or `UNKNOWN`. An `IN` deal has no realized P&L. For exit/reversal deals XMBot
stores:

```text
gross_profit = deal.profit
commission   = deal.commission  # broker-signed
swap         = deal.swap        # broker-signed
fee          = deal.fee         # broker-signed
net_realized = profit + commission + swap + fee
```

Costs are not subtracted a second time. Raw named-tuple fields are retained for
audit. Each external deal is constrained once per broker account.

## Account mode and isolation

Position tickets are authoritative in hedging accounts. Netting accounts may
reuse a symbol-level position while deals alter or reverse it. The normalization
represents `INOUT`, but automated reversal resolution is not yet approved.

The MetaTrader5 Python module controls a terminal/session at process scope. The
production topology must use one isolated terminal and execution worker per MT5
broker account. A global process must not switch between customer logins.

## Demo validation

Run on an isolated Windows MT5 demo worker with no production credentials:

1. Configure terminal path, login, server, and encrypted credential injection.
2. Apply migrations and create the real `BrokerAccount` ownership record.
3. Verify comment/magic preservation for entry, pending, partial close, SL, TP,
   manual close, restart, and rejected orders.
4. Simulate a lost response and prove lookup finds the existing order/deals.
5. Stop the engine, trigger a close, restart, and verify missed deal ingestion.
6. Compare stored profit, commission, swap, and fee with MT5 account history.
7. Verify unknown manual orders/positions make reconciliation `UNSAFE`.
8. Only after evidence is reviewed may demo configuration set
   `idempotency_verified=True`. This is not live-money approval.

## Sprint 3 completion: multi-deal accounting

XMBot reconstructs a position from every durable MT5 deal sharing the same broker account and MT5 position identifier. `IN` deals add Decimal exposure; `OUT` and `OUT_BY` deals reduce it. A remainder is `PARTIALLY_CLOSED`; only zero produces `CLOSED`. Missing identifiers, `INOUT`, unknown semantics, or inconsistent quantities produce `RECONCILIATION_REQUIRED`.

MT5 financial values remain signed. Net realized P&L is `profit + commission + swap + fee`, so negative costs are added once rather than subtracted twice.

Run the read-only demo harness with:

```bash
cd engine
XMBOT_MT5_DEMO_ACK=I_UNDERSTAND_DEMO_ONLY MT5_LOGIN=... MT5_PASSWORD=... MT5_SERVER=... python scripts/validate_mt5_demo.py
```

It rejects accounts not verifiably reported as demo and prints the manual minimum-volume checks still required. It never enables execution; `idempotency_verified` remains false by default.
