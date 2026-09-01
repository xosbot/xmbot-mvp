# ADR 0002: MT5-first broker and tenant isolation

- **Status:** Accepted direction; broker partners and hosting topology pending
- **Date:** 2026-09-01

## Decision

MT5 is the first execution integration. Every customer owns and authorizes a
separate broker account. XMBot may recommend one or two broker partners and earn
introducing-broker revenue, but it will not pool customer accounts or share
credentials/sessions between customers.

Each broker account gets an isolated execution boundary with its own mandate,
credentials, MT5 terminal/session, risk state, order queue, reconciliation loop,
and kill switch. The platform API submits idempotent commands; it never controls
a process-global customer broker session. Broker reports and fills are the
execution source of truth.

## Partner and customer safeguards

- Broker choice, commercial relationship, commissions, spreads, conflicts, and
  any customer restrictions must be clearly disclosed.
- Partner selection must score regulation and jurisdiction coverage, execution
  quality, segregation/custody model, API/MT5 reliability, symbol mapping,
  support, reporting, and withdrawal experience—not only IB revenue.
- Maintain a documented best-execution/conflict review and do not route a
  customer where the broker is ineligible for that customer's jurisdiction.
- Broker credentials are encrypted with managed KMS and are never exposed to
  web or Android clients.

## Consequences

The current single engine/broker process is not the target production topology.
MT5 commonly adds terminal/OS and session-operability constraints, so a staging
proof must validate terminal lifecycle, reconnect, duplicate-order prevention,
symbol suffixes, time zones, partial fills, and reconciliation before choosing
the worker hosting model.
