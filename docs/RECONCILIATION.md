# Reconciliation

`ReconciliationService` compares durable broker orders and financial positions
with broker open orders and positions. Each run writes
`BROKER_RECONCILIATION_STARTED`; mismatches are append-only
`BROKER_RECONCILIATION_MISMATCH` ledger events.

Health is `HEALTHY`, `DEGRADED`, or `UNSAFE`. Unknown broker activity,
unavailable broker state, disappeared durable positions, and unresolved
submissions are critical and produce `UNSAFE`. The execution preflight refuses
new orders for unsafe users. Startup reconciliation runs after connection and
before agent loops; unsafe startup disconnects the broker and leaves the engine
stopped.

Implemented mismatch detection includes unknown orders/positions, disappeared
positions, quantity/entry/SL/TP differences, unresolved submissions, and broker
unavailability. Unknown manual activity is never adopted or closed.

Position disappearance now changes a durable open position to
`RECONCILIATION_REQUIRED`. It does not create a closed trade, infer an exit
price, call the journal/AI, or update risk P&L. Automatic deal-to-position closure
finalization remains incomplete; therefore MT5 stays live-disabled.

## Durable overlap and issue resolution

Each account stores a successful-history watermark. Reconciliation requests deals from five minutes before it (or 30 days on first run), while external execution uniqueness absorbs overlap. The cursor advances only after successful processing.

Mismatch IDs are stable hashes of account, type, entity IDs, and symbol. Original issues and ledger events remain append-only. A complete later snapshot resolves absent issues and emits `BROKER_RECONCILIATION_RESOLVED` referencing the original ID. Broker-read failure never resolves prior issues; health is derived from all open durable issues.
