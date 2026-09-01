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
