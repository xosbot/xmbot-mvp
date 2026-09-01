# Production trading runbook

MT5 is demo-only. Do not override an `UNSAFE` reconciliation result by restarting
or retrying an order.

## Unknown position or order

1. Pause the affected account/worker.
2. Record the MT5 login, symbol, ticket, time, volume, magic, and comment—never
   credentials.
3. Compare terminal active state and history with OrderIntent/BrokerOrder and
   ledger records.
4. Determine whether it is a customer manual trade or missing XMBot record.
5. Do not adopt, cancel, or close it automatically. Escalate to the trading-risk
   operator and resolve using an audited procedure.

## Submission unknown

Search active orders, history orders, positions, and deals using the XMBot
comment token and stored client ID. Never retry while any source is unavailable
or ambiguous. Preserve the intent as `SUBMISSION_UNKNOWN` or
`RECONCILIATION_REQUIRED`.

## Position disappeared or deal history failed

Keep the account unsafe. Retrieve the complete position deal chain and verify
quantities, entry types, profit, commission, swap, and fee. Never use the last
quote/unrealized P&L. If history remains unavailable, contact the broker and do
not resume trading.

## Engine restart

Confirm migrations, database availability, the expected isolated MT5 terminal
login/server, active orders, positions, and recent deals. Start the worker and
verify startup reconciliation becomes healthy before allowing strategies.

## Resume

Resume only after every critical mismatch has an audited resolution, broker and
database state agree, and a second operator confirms tickets and exposure. A
restart alone is not a resolution.
