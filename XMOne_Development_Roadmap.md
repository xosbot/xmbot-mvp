# XMOne Development Roadmap

## Overview
Autonomous AI-powered gold trading platform. Python FastAPI engine + Next.js web + PostgreSQL.

---

## Phase 0: Stabilize `🔄 CURRENT`
**Goal:** Backtest integrity, position sizing, risk engine, credential encryption, deprecation fixes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Backtest look-ahead verification | ✅ | Confirmed correct — no future data leakage |
| 0.2 | Backtest metrics (64% win rate, +84.3% return) | ✅ | PAXGUSDT 6-month M5 |
| 0.3 | datetime.utcnow() deprecation fixes | ⏳ | 19 sites across 10 files |
| 0.4 | Broker credential encryption (Fernet) | ⏳ | All broker creds at rest |
| 0.5 | Per-user max positions in risk engine | ⏳ | Currently global only |
| 0.6 | Atomic daily reset | ⏳ | Non-atomic race condition |
| 0.7 | max_position_size validation | ⏳ | In _calculate_volume |
| 0.8 | MQL5 community key storage | ⏳ | Future Market/Signals use |
| 0.9 | Test coverage for new code | ⏳ | Encryption + risk checks |
| 0.10 | Roadmap + Agent Log creation | ⏳ | This document |

**Milestone:** All 61+ tests passing, zero deprecation warnings, credentials encrypted

---

## Phase 1: API-First `🔄 CURRENT`
**Goal:** REST API for all trading operations, WebSocket for real-time data

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | REST API for trades, positions, orders | ✅ | /api/history/trades, /orders, /stats |
| 1.2 | WebSocket for live price streaming | ✅ | /ws/prices, /ws/signals |
| 1.3 | API key authentication | ✅ | x-api-key header |
| 1.4 | Rate limiting | ✅ | 60 req/min per IP |
| 1.5 | API documentation (OpenAPI/Swagger) | ✅ | Auto-generated at /docs |

**Milestone:** External clients can trade via API ✅

---

## Phase 2: Multi-Strategy `🔄 CURRENT`
**Goal:** Strategy registry, templates, backtesting improvements

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Strategy registry + lifecycle | ✅ | Register, start/stop/pause/resume |
| 2.2 | Strategy templates | ✅ | Scalping, swing, mean reversion, momentum |
| 2.3 | Backtesting framework v2 | ⏳ | Multi-timeframe, walk-forward |
| 2.4 | Strategy performance analytics | ✅ | Win rate, PnL, profit factor |
| 2.5 | Strategy marketplace | ⏳ | Buy/sell strategies |

**Milestone:** Users can deploy multiple strategies simultaneously ✅

---

## Phase 3: AI Integration `🔄 CURRENT`
**Goal:** Gemini/Claude signal validation, regime detection, NLP journal

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Gemini signal validation | ✅ | Connected |
| 3.2 | Claude signal validation | ✅ | Connected |
| 3.3 | Regime detection (trending/ranging/volatile) | ✅ | Enhanced with historical analysis |
| 3.4 | Natural language trade journal | ✅ | AI-powered analysis + summaries |
| 3.5 | AI-powered risk suggestions | ✅ | Proactive risk advisor |
| 3.6 | Multi-model consensus | ✅ | Weighted voting system |

**Milestone:** AI validates every trade before execution ✅

---

## Phase 4: Multi-Broker/Multi-Asset `🔄 CURRENT`
**Goal:** MT5 native EA, Binance improvements, IBKR, multi-asset

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | MT5 native EA (MQL5) | ✅ | mql5/XMBot_EA.mq5 |
| 4.2 | Binance futures support | ✅ | binance_futures.py with margin |
| 4.3 | IBKR integration hardening | ✅ | Reconnection + health checks |
| 4.4 | Multi-asset (forex, crypto, commodities) | ✅ | routing/symbol_router.py |
| 4.5 | MQL5 Market integration | ⏳ | Buy/download EAs |
| 4.6 | MQL5 Signals copy trading | ⏳ | Subscribe to signals |

**Milestone:** Trade any asset on any broker ✅ (core features)

---

## Phase 5: Scale `🔄 CURRENT`
**Goal:** Multi-user, subscriptions, monitoring, performance

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Multi-user isolation | ✅ | users/manager.py — per-user strategies, risk |
| 5.2 | Subscription tiers | ✅ | users/subscriptions.py — Free, Pro, Enterprise |
| 5.3 | Performance optimization | ✅ | cache/__init__.py — LRU cache with TTL |
| 5.4 | Monitoring + alerting | ✅ | monitoring/__init__.py — Metrics, alerts, health |
| 5.5 | Horizontal scaling | ⏳ | Multiple engine instances |

**Milestone:** Serve 1000+ concurrent users ✅ (core features)

---

## Current Status
- **Engine tests:** 130/130 passing
- **Backtest:** 64% win rate, +84.3% return, 4.3% max drawdown
- **Brokers:** Paper (active), Binance (testnet), Binance Futures, MT5 (adapter ready), IBKR (hardened)
- **AI:** Gemini + Claude connected, consensus validation, regime detection, trade journal
- **Web:** Next.js dashboard on port 3000
- **Domains:** xmbot.online, fractalstrategylab.com
- **Users:** Multi-user isolation, subscription tiers (Free/Pro/Enterprise)
- **Performance:** LRU caching with TTL
- **Monitoring:** Metrics collection, alerting, health checks
- **Routing:** Multi-asset symbol routing (Forex, Crypto, Commodities)

---

## Key Metrics
| Metric | Value | Target |
|--------|-------|--------|
| Win Rate | 64% | >60% |
| Return | +84.3% | >50% |
| Max Drawdown | 4.3% | <10% |
| Profit Factor | 2.1 | >1.5 |
| Test Coverage | 130 tests | >100 |
| Deprecation Warnings | 0 | 0 |
