# XMBot production-readiness review

**Review date:** 2026-09-01  
**Decision:** **No-go for live customer funds.** The repository is a useful MVP, but it is not yet a production trading platform.

The actionable follow-up is the [production execution plan](PRODUCTION_EXECUTION_PLAN.md),
starting with its two-day production inception and safe paper-trading vertical slice.

## 1. What exists today

| Area | Location | Responsibility | Current maturity |
| --- | --- | --- | --- |
| Web product | `xmbot-mvp/app`, `components`, `lib` | Marketing, credentials login, dashboard, admin, payments and the engine proxy | MVP |
| Trading engine | `engine/src` | Signals, strategies, risk checks, broker adapters, Telegram approvals and FastAPI | Prototype/MVP |
| Data | `xmbot-mvp/prisma`, PostgreSQL; engine in-memory stores/persistence | Users, subscriptions, bots and web trade records | Split ownership; not production-safe |
| Edge/hosting | `docker-compose.yml`, `Caddyfile`, Dockerfiles, shell scripts | Single-host deployment with TLS reverse proxy | Development/small pilot only |
| Quality | `.github/workflows/ci.yml`, engine tests | Build, type check, lint and engine unit tests | Partial |
| Mobile | None | — | Not started |

The directory named `xmbot-mvp/xmbot-mvp` is the web application, not another repository. This naming makes navigation and automation unnecessarily confusing.

## 2. Current request and data flow

```text
Browser -> Caddy -> Next.js pages/API -> PostgreSQL
                           |
                           +-- shared-key/HMAC -> FastAPI engine -> broker APIs
                                                   |
                                                   +-> Telegram / AI providers
```

Next.js currently acts as both the browser backend and an API gateway. The engine uses one process-wide broker and mutable in-memory user/configuration stores. This is the most important architectural constraint: it is not safe to assume that the current engine provides hard tenant or broker-account isolation.

## 3. Findings, ordered by launch risk

### P0 — blockers before any live-money pilot

1. **No authoritative multi-tenant trading boundary.** A shared engine/broker instance returns account-level data, while some endpoints filter only positions carrying a `user_id`. Account balances and control operations are not tenant-scoped. Separate execution workers (or strictly isolated broker sessions) per account are required.
2. **Control authorization is too coarse.** The shared engine API key authenticates the web service, but engine routes do not enforce user/admin capabilities. A normal authenticated user must never be able to start, stop, or reconfigure a global engine.
3. **State is split and partially volatile.** The web database and engine stores can disagree after restart or partial failure. Orders, fills, approvals, risk decisions and webhook events need an append-only, durable audit trail and idempotency keys.
4. **Dependency vulnerabilities block release.** The production npm audit reported critical/high advisories, including the authentication, Next.js and payment dependency trees. Upgrade and re-audit before exposure.
5. **No migration history.** The Prisma schema exists, but no checked-in migrations exist and deployment uses `prisma db push`. Production needs reviewed forward migrations, backup verification and a rollback/restore procedure.
6. **Secrets and production configuration are not fail-closed.** Several secrets default to empty strings, broker mode is forced to Binance by Compose, and the database has a development-password fallback. Production startup must validate every required setting and refuse unsafe/live defaults.
7. **Financial values use binary floating point.** Prices, quantities, payment amounts and P&L must use bounded decimal types with explicit currency/precision rules across database, API and execution layers.
8. **No regulatory/business launch gate.** Live automated trading needs jurisdiction-specific counsel, customer agreements, risk disclosure, suitability/appropriateness decisions, support escalation and broker/payment contractual review. Product claims must be traceable to reproducible evidence.

### P1 — required before a closed production beta

- Replace in-memory rate limiting with Redis-backed limits; normalize email/IP identifiers and define trusted-proxy handling.
- Adopt mobile-compatible authentication: short-lived access tokens, rotated refresh tokens, revocation, device/session inventory, MFA and step-up authentication for broker or trade actions.
- Add API versioning and an OpenAPI contract. Do not let Android call internal engine endpoints.
- Make payments transactional and idempotent. Persist webhook event IDs, verify allowed timestamp skew, reconcile with the provider, and atomically update payment/subscription state.
- Add account lockout/brute-force monitoring, stronger password policy, email verification enforcement, CSRF review, security event logging and an admin audit log.
- Encrypt broker credentials only with a managed KMS/envelope-encryption design. Never return credentials to clients; define rotation and break-glass procedures.
- Add database indexes and explicit enums/check constraints for trade/order state. Introduce tenant/account foreign keys throughout all trading records.
- Add readiness and liveness probes separately. The public `/health` route should reveal minimal information; metrics must be private and authenticated.
- Add structured logs with correlation IDs, metrics, traces, alert routing, SLOs and runbooks for broker disconnect, rejected orders, stale prices and risk-limit breaches.
- Pin Python dependencies with hashes and use `npm ci` in Docker. Generate SBOMs, scan images/secrets/dependencies and run containers read-only as non-root (the engine currently runs as root).
- Add integration tests against PostgreSQL/Redis, contract tests, migration tests, payment webhook tests, authorization tests, broker sandbox tests, reconciliation tests and failure-injection scenarios.

### P2 — scale and operational hardening

- Managed PostgreSQL/Redis, private networking, WAF/CDN, secret manager, immutable images, staged deployments and automated rollback.
- Queued execution with an outbox/inbox pattern; broker reconciliation as the source of truth; horizontal scaling that never duplicates an order.
- Data retention/deletion policy, disaster-recovery targets, restore drills, incident response and access reviews.
- Performance/load budgets for streaming and market bursts; cost/latency budgets and deterministic fallback when AI providers fail.

## 4. Recommended target repository structure

Keep a monorepo initially, but make ownership and public contracts explicit:

```text
apps/
  web/                 # Next.js UI and browser-facing BFF
  android/             # Kotlin + Jetpack Compose client
services/
  platform-api/        # customer/mobile API, auth, subscription, portfolio
  trading-engine/      # strategies and risk decisions; no public ingress
  execution-worker/    # isolated broker-account execution and reconciliation
packages/
  api-contract/        # versioned OpenAPI and generated clients
  domain/              # shared schemas/terminology, not runtime coupling
infra/
  docker/              # local development only
  terraform/           # cloud resources, IAM, network, databases, KMS
  observability/       # dashboards, alerts and collectors
docs/
  adr/                 # immutable architecture decisions
  runbooks/            # operational and incident procedures
  product/             # approved requirements and regulatory artifacts
```

Do not perform the directory move as a cosmetic refactor. First add contract tests, then move one deployable at a time while CI proves behavior is unchanged.

## 5. Proposed production architecture

```text
Web / Android
    -> API gateway/WAF
    -> Platform API (identity, subscription, portfolio, commands)
       -> PostgreSQL (system of record + outbox)
       -> Redis (rate limit/cache; never order source of truth)
       -> queue
          -> account-isolated execution workers
             -> broker
             -> immutable execution/audit events
       -> read models / websocket gateway

Trading engine -> proposed decisions -> risk service -> approval policy -> execution queue
```

Core rules:

- The broker and durable ledger are authoritative for executions; UI caches are not.
- Every command has `tenant_id`, `account_id`, actor, correlation ID and idempotency key.
- Risk checks are deterministic and cannot be bypassed by AI output.
- AI can advise or explain; it cannot silently expand limits or place an order.
- Production, sandbox and development use separate accounts, credentials, databases and networks.
- A global and per-account kill switch must be independently operable and audited.

## 6. Android recommendation

Use **native Kotlin, Jetpack Compose, a single-activity architecture, coroutines/Flow, Hilt, Retrofit/OkHttp, Room and Android Keystore**. Native Android is recommended because Android is the stated platform and broker approval, biometrics, secure key storage, push reliability and foreground/background lifecycle behavior are business-critical. Reconsider cross-platform only if an iOS delivery date becomes a near-term requirement.

The app should consume only `/api/v1`; it must never contain `XMBOT_API_KEY`, payment secrets, AI keys or broker secrets. Suggested modules:

```text
apps/android/
  app/                 # composition root and navigation
  core/model/          # generated API/domain models
  core/network/        # generated client, auth interceptor, pinning policy
  core/database/       # non-sensitive offline/read cache
  core/security/       # Keystore, biometric gate, token handling
  feature/auth/
  feature/dashboard/
  feature/approvals/
  feature/trades/
  feature/brokers/
  feature/settings/
```

MVP mobile scope: sign-in/MFA, portfolio summary, positions/trade history, signal approval/rejection with biometric step-up, push notifications, engine/account status, subscription status and support. Defer strategy editing, broker-secret entry and admin functions until the security model is approved.

## 7. Delivery plan and acceptance gates

### Phase 0 — product and risk decisions (1–2 weeks)

- Confirm jurisdictions, business model (signals, advisory, copy trading or discretionary execution), supported brokers/instruments and whether approval is mandatory.
- Define roles, tenant/account model, risk policy, RTO/RPO, SLOs, data retention and initial cloud/region.
- Approve ADRs for identity, execution isolation, ledger/event model, mobile stack and deployment platform.

**Exit:** signed product/security/regulatory scope; no unresolved P0 architecture decision.

### Phase 1 — production foundation (2–4 weeks)

- Versioned API contract, durable order/audit model, migrations, idempotency and tenant authorization.
- Dependency remediation, secrets/KMS, hardened images, CI security gates, observability and sandbox environments.
- Broker reconciliation and kill-switch runbooks with automated tests.

**Exit:** all CI/security gates green; restore and broker-failure drills pass; paper/sandbox only.

### Phase 2 — Android vertical slice (2–4 weeks, overlaps Phase 1)

- Create Gradle convention setup and generated API client.
- Deliver secure sign-in, dashboard, push notification and biometric approval end-to-end against staging.
- Add unit, screenshot/UI, accessibility and device/API-level test matrices.

**Exit:** internal Play track build, no embedded secrets, mobile threat-model review passed.

### Phase 3 — controlled beta and live-money gate

- Staff paper-trading soak, invited sandbox beta, then capped live pilot only after legal/security approval.
- Define rollback, customer communication, on-call and incident ownership before each cohort.

**Exit:** explicit go/no-go record. Passing automated tests alone is never approval to trade live funds.

## 8. Decisions needed from the business

1. **Service classification and geography:** Which countries and exactly what service is sold?
2. **Execution model:** Signal-only, mandatory human approval, or autonomous execution?
3. **Broker scope:** XM/MT5, Binance, or both at launch? Spot, futures, forex/CFD?
4. **Tenancy:** One broker account per customer or managed/shared accounts?
5. **Mobile scope:** Customer-only Android, or admin/operations too? Is iOS expected within 12 months?
6. **Cloud constraints:** Preferred provider/region, budget and required data residency?
7. **Reliability:** Target uptime, RTO/RPO, support hours and maximum acceptable stale-market/order latency?
8. **Launch cohort:** Internal paper trading, sandbox customers and maximum initial live exposure?

Development should begin with Phase 0 and the platform API contract, not with UI screens or live broker connectivity. That sequence prevents the web and Android clients from cementing unsafe internal APIs.
