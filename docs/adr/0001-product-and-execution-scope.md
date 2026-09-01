# ADR 0001: Product and autonomous execution scope

- **Status:** Accepted from business direction; legal/compliance validation pending
- **Date:** 2026-09-01

## Decision

XMBot targets global markets, initially prioritizing gold and Bitcoin, followed
by Indian and global equities. It provides three related capabilities:

1. Autonomous strategy execution.
2. On-demand trading/investment advice.
3. Technical and fundamental research reports.

The customer grants an explicit, revocable trading mandate when connecting and
activating a bot. Individual orders do not require approval. Activation must
record the customer, broker account, enabled strategies/instruments, risk and
exposure limits, activation time, disclosures/version accepted, and mandate
version. Material changes require a new confirmation. Pause, revoke, and
emergency-stop actions must take effect immediately and be durably audited.

AI-generated advice or research cannot bypass deterministic strategy, risk,
mandate, market-hours, or execution controls. Research, advice, and execution
events must identify their inputs/model or strategy version and be reproducible
enough for audit and customer support.

## Consequences

- The product requires jurisdiction-by-jurisdiction classification before
  release; “global” is a roadmap, not a single legal launch.
- Autonomous execution makes account isolation, reconciliation, suitability or
  appropriateness, disclosures, surveillance, and kill switches P0 controls.
- Asset classes need separate instrument masters, sessions, corporate-action
  handling, market data entitlements, and risk models.
- The first production candidate remains staff-only paper/sandbox trading.
