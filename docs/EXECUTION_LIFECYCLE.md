# Execution lifecycle

## Current lifecycle audit

Before Sprint 1, an agent produced a dataclass `Signal`, the risk engine checked
it, the in-process human gate awaited a Telegram decision, and `Engine` created
an `Order` dataclass and called the active broker directly. The result was only
recorded in in-memory objects, JSON sync/risk files, and dashboard stores. A
position disappearing from `get_positions()` was treated as closed using its
last observed price and unrealized P&L.

That flow has four critical gaps:

1. There is no durable intent committed before the broker call.
2. A timeout cannot be distinguished from a broker rejection, so safe retry and
   crash recovery are impossible.
3. Partial fills and broker execution IDs have no durable representation.
4. Disappearance is not proof of closure and unrealized P&L is not realized P&L.

The legacy engine database models also use integer user IDs, while the Next.js
application uses string IDs. Sprint 1 therefore uses string `user_id` ownership
columns without coupling the new financial schema to either legacy user table.
Identity consolidation requires a separate, reviewed migration.

## Sprint 1 durable model

Migration `888e939179cd` introduces:

- `broker_accounts`: per-customer broker account boundary.
- `trading_signals` and `trade_approvals`: durable decisions before execution.
- `order_intents`: the committed instruction and globally unique client order ID.
- `broker_orders`: broker acknowledgement/raw response.
- `executions`: one immutable-source record per fill/deal.
- `financial_positions`: the internal position view reconciled with the broker.
- `ledger_events`: append-only lifecycle and anomaly audit records.

Prices, quantities, fees, risk, and P&L use fixed-precision `NUMERIC` columns.
Raw broker payloads are retained as JSON. Correlation IDs connect signal, intent,
and ledger records through logs and future API requests. PostgreSQL rejects
updates and deletes to `ledger_events`; SQLAlchemy provides the same guard in
tests and non-PostgreSQL development databases.

## Target transaction boundaries

Sprint 2 must integrate these records into execution using two explicit durable
transactions:

1. Insert signal/approval as applicable, `OrderIntent`, and
   `ORDER_INTENT_CREATED`; commit before contacting the broker.
2. After broker acknowledgement, insert/update `BrokerOrder`, update intent
   state, insert acknowledgement/fill ledger events, and commit.

If submission outcome is uncertain, mark `SUBMISSION_UNKNOWN`, query the broker
by deterministic client order ID, and block resubmission until absence is proven.
No current broker adapter is yet wired to this model; existing paper and live
behavior remains unchanged in Sprint 1.

## Broker-authoritative closure rule

The current inferred-closure path is documented as unsafe and remains a known
blocker. Sprint 3 must replace it: disappearance triggers reconciliation and
actual deal-history retrieval. Until fills, fees, and realized P&L are available,
the durable position must be `RECONCILIATION_REQUIRED`; risk counters, analytics,
journaling, and AI must not receive guessed closure values.
