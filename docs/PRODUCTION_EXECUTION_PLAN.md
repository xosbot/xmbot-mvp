# Production execution plan

This is the working plan that turns the findings in the
[production-readiness review](PRODUCTION_READINESS_REVIEW.md) into deliverable
engineering work. It deliberately starts with product and safety decisions—not
an Android UI or live broker deployment—because those decisions determine the
identity, tenancy, API, and execution boundaries.

## Immediate next step: a two-day production inception

Business direction has now fixed the initial product and execution scope in
[ADR 0001](adr/0001-product-and-execution-scope.md) and
[ADR 0002](adr/0002-mt5-broker-tenancy.md). The session should validate those
decisions with legal/risk owners and complete the open cloud decision in
[ADR 0003](adr/0003-cloud-selection.md), rather than reopening the product brief.

Schedule one working session with the business owner, trading/risk owner,
engineering lead, security owner, and jurisdiction-specific legal/compliance
counsel. By the end of the second day, record and approve:

1. Launch countries and the legal classification of the service (signals,
   advisory, copy trading, or discretionary execution).
2. Launch broker, market, and account model. Explicitly decide whether every
   customer has a separately isolated broker account.
3. Whether human approval is mandatory for every order and what happens when an
   approval expires or the notification channel is unavailable.
4. Initial risk limits, including per-order, daily-loss, drawdown, exposure,
   stale-price, and global/per-account kill-switch behavior.
5. The first release boundary: internal staff, paper/sandbox trading only,
   customer count, and an explicit maximum of zero live-money exposure until a
   later go/no-go review.
6. Cloud provider/region, data residency, uptime target, RTO/RPO, support hours,
   and named incident owner.
7. Android scope: customer app only; sign-in/MFA, read-only portfolio, trade
   history, notifications, and biometric signal approval. Keep admin and broker
   secret entry out of the first app release.

**Output:** short approved ADRs for service scope, tenancy/execution isolation,
identity, risk/approval policy, deployment, and mobile architecture. Engineering
does not enable live trading while any of these is unresolved.

## First engineering milestone: safe paper-trading vertical slice

After inception, build one end-to-end slice in this order:

```text
OpenAPI contract
  -> platform authentication and tenant authorization
  -> durable order command + idempotency record
  -> transactional outbox
  -> account-isolated paper execution worker
  -> durable order/fill/audit events
  -> read model
  -> web and Android generated clients
```

The milestone is successful when one sandbox customer can submit the same
approved paper order more than once but receive exactly one broker execution,
observe the result in both web and Android, and reconstruct every decision from
the audit log.

## Ten-working-day foundation backlog

| Order | Work item | Deliverable | Acceptance check |
| --- | --- | --- | --- |
| 1 | Capture decisions | Six approved ADRs from the inception list | Owners and approval dates are recorded |
| 2 | Freeze unsafe launch paths | Production config refuses empty secrets, development passwords, and live broker mode without an explicit release gate | Negative startup tests pass |
| 3 | Remediate dependencies | Upgrade Auth.js/Next.js/payment dependency trees and rebuild lockfile | Production audit has no critical/high findings, or a signed time-bounded exception |
| 4 | Establish migrations | Baseline reviewed Prisma migrations; remove `db push` from production deployment | Empty and existing test databases migrate successfully |
| 5 | Define public API | Versioned `/api/v1` OpenAPI contract for auth, sessions, portfolio, orders/approvals, trades, and status | Contract lint and compatibility checks run in CI |
| 6 | Establish identity | Access/rotating refresh tokens, revocation, MFA/step-up, device sessions, and role/tenant claims | Cross-tenant and revoked-token tests fail closed |
| 7 | Create durable ledger | Decimal-valued order, fill, approval, risk-decision, webhook, and audit records with idempotency keys | Duplicate/concurrent command tests produce one execution |
| 8 | Isolate execution | One worker/broker session per account boundary; global and account kill switches | Two-tenant and kill-switch integration tests pass |
| 9 | Add operational baseline | Structured logs, correlation IDs, private metrics, readiness/liveness, alerts, backups, and restore runbook | Restore and broker-disconnect drills pass in staging |
| 10 | Scaffold Android | Kotlin/Compose modules and generated staging API client; no embedded secrets | Secret scan, unit tests, and debug build pass |

Items 1–5 are the first sprint. Items 6–10 follow as contracts stabilize; Android
screen development should not get ahead of the authentication and API contract.

## Definition of done for a closed beta

The beta remains paper/broker-sandbox only until all of these are true:

- No unresolved P0 finding from the production-readiness review.
- Legal/compliance signs off on the product, customer agreement, risk
  disclosure, jurisdictions, brokers, and marketing claims.
- Critical/high dependency, image, and secret scans pass or have an explicitly
  accepted, expiring exception.
- Tenant isolation, authorization, idempotency, reconciliation, risk limits,
  and both kill switches have automated integration tests.
- Database migration, backup restore, broker disconnect, stale market data,
  notification failure, and rollback drills pass in staging.
- Dashboards, alerts, SLOs, incident runbooks, on-call ownership, and customer
  support escalation are operational.
- Android is distributed through an internal Play track, uses Keystore-backed
  token storage and biometric step-up, and contains no service or broker secret.
- A named release owner records an explicit go/no-go decision.

## Live-money gate

A successful closed beta does **not** automatically permit live trading. Run a
separate review after a representative paper/sandbox soak period. The review
must examine reconciliation accuracy, rejected/duplicate order rates, alert and
incident history, risk-limit behavior, security test results, support readiness,
and legal/compliance approval. Start any approved pilot with capped users and
exposure, a rollback plan, and staffed monitoring.

## Recommended first ticket

**Title:** Approve production scope and architecture ADRs

**Owner:** Business owner, facilitated by the engineering lead  
**Timebox:** Two working days  
**Blocked by:** Named legal/compliance and trading-risk reviewers  
**Done when:** The seven inception decisions are recorded, reviewers approve
them, and the release is explicitly marked `paper/sandbox only`.

Only after this ticket closes should the team start the API-contract and
production-configuration tickets. This is the shortest safe path to both a
production deployment and an Android app.
