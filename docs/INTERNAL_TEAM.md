# XMBot — Internal Team Documentation

**Version:** 1.0
**Last Updated:** July 24, 2026
**Status:** MVP Complete, Ready for Deployment

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Status](#current-status)
3. [Tech Stack](#tech-stack)
4. [Development Guide](#development-guide)
5. [Deployment](#deployment)
6. [Trading Strategy](#trading-strategy)
7. [API Reference](#api-reference)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Incident Response](#incident-response)
10. [Roadmap](#roadmap)
11. [Contributing](#contributing)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        XMBot Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│  │ Telegram  │────▶│  Next.js │────▶│  Python  │               │
│  │   Bot     │     │ Frontend │     │  Engine  │               │
│  └──────────┘     └──────────┘     └──────────┘               │
│       │                │                  │                     │
│       ▼                ▼                  ▼                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│  │ Telegram │     │ PostgreSQL│    │  Broker  │               │
│  │   API    │     │ Database │     │  (MT5/   │               │
│  └──────────┘     └──────────┘     │  Paper)  │               │
│                                     └──────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AI Providers                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │  Claude  │  │  Gemini  │  │  OpenAI  │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Market Data (Binance/MT5)
    │
    ▼
Technical Analysis Agent (RSI + Supertrend + ADX)
    │
    ▼
Risk Engine (2% rule, daily limits)
    │
    ▼
Human Gate (Telegram notification)
    │
    ▼
User Approval/Rejection
    │
    ▼
Broker Execution (Paper/MT5)
    │
    ▼
Trade Logging & PnL Tracking
```

---

## Current Status

### Completed Features

| Track | Feature | Status |
|-------|---------|--------|
| A1 | Market dataclass (open field) | ✅ |
| A2 | ATR-based stop loss (3.0x ATR) | ✅ |
| A3 | Trailing stop mechanism | ✅ |
| A4 | Risk engine (PnL tracking) | ✅ |
| A5 | Risk-based position sizing (2%) | ✅ |
| A6 | Multi-timeframe confirmation | ✅ |
| A7 | Trading session filter | ✅ |
| A8 | Backtesting framework | ✅ |
| B1 | Engine proxy (auth, timeout) | ✅ |
| B2 | Engine APIs (status, positions) | ✅ |
| B3 | Cashfree webhook (HMAC) | ✅ |
| B4 | Admin users API | ✅ |
| B5 | Dashboard polling (10s) | ✅ |
| B6 | Mobile responsive layout | ✅ |
| B7 | Telegram integration | ✅ |
| C1 | AI registry integration | ✅ |
| C2 | Market regime detection | ✅ |
| C3 | Post-trade analysis | ✅ |
| C4 | Daily reports | ✅ |
| C5 | AI cost controls | ✅ |
| C6 | Frontend AI settings | ✅ |

### Backtest Results

| Metric | Optimized | Default |
|--------|-----------|---------|
| Total Trades | 1,083 | 1,479 |
| Win Rate | 64.0% | 63.6% |
| Total Return | **+84.3%** | +52.7% |
| Max Drawdown | 4.3% | 2.0% |
| Walk-Forward | +19% | — |

### Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Pre-existing TS errors | Low | Need `npm install --legacy-peer-deps` |
| Yahoo Finance limits | Low | Using Binance as alternative |
| No automated tests | Medium | Backtest framework needs pytest |

---

## Tech Stack

### Backend (Engine)

| Component | Technology | Version |
|-----------|------------|---------|
| Language | Python | 3.12 |
| Framework | FastAPI | 0.110+ |
| Server | Uvicorn | 0.27+ |
| HTTP Client | httpx | 0.27+ |
| Validation | Pydantic | 2.0+ |
| Database | SQLAlchemy | 2.0+ |
| Monitoring | Sentry | 2.0+ |

### Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16 |
| Language | TypeScript | 5.x |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 15+ (Supabase) |
| Auth | NextAuth | v5 beta |
| UI | shadcn/ui | Latest |
| Payments | Cashfree PG SDK | Latest |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Container | Docker |
| Orchestration | Docker Compose |
| Reverse Proxy | Caddy |
| Domain | xmbot.online |
| Hosting | VPS (Hetzner/DigitalOcean) |

### AI Providers

| Provider | Model | Cost |
|----------|-------|------|
| Claude | claude-sonnet-4-20250514 | ~$0.30/mo |
| Gemini | gemini-2.5-flash | ~$0.05/mo |
| OpenAI | gpt-4o-mini | ~$0.10/mo |

---

## Development Guide

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis (optional)
- Docker (for deployment)

### Local Setup

#### 1. Clone Repository

```bash
git clone <repo-url>
cd XMBot
```

#### 2. Engine Setup

```bash
cd engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your config
python -m src.main
```

#### 3. Frontend Setup

```bash
cd xmbot-mvp
npm install --legacy-peer-deps
cp .env.example .env
# Edit .env with your config
npm run dev
```

#### 4. Database Setup

```bash
# Using Supabase or local PostgreSQL
npx prisma generate
npx prisma db push
```

### Project Structure

```
XMBot/
├── engine/                    # Python trading engine
│   ├── src/
│   │   ├── agents/           # Trading agents
│   │   │   ├── technical.py  # RSI + Supertrend + ADX
│   │   │   ├── regime.py     # Market regime detection
│   │   │   └── analysis.py   # Post-trade analysis
│   │   ├── ai/               # AI providers
│   │   │   ├── providers/    # Claude, Gemini, OpenAI
│   │   │   ├── registry.py   # Provider registry
│   │   │   └── costs.py      # Cost tracking
│   │   ├── broker/           # Broker integrations
│   │   │   ├── paper.py      # Paper trading
│   │   │   └── mt5.py        # MetaTrader 5
│   │   ├── core/             # Core engine
│   │   │   ├── engine.py     # Main engine loop
│   │   │   ├── config.py     # Configuration
│   │   │   ├── types.py      # Data models
│   │   │   └── session.py    # Trading sessions
│   │   ├── risk/             # Risk management
│   │   │   └── engine.py     # Risk engine
│   │   ├── api/              # FastAPI routes
│   │   ├── telegram/         # Telegram bot
│   │   └── backtest/         # Backtesting framework
│   ├── tests/                # Test files
│   ├── requirements.txt
│   └── Dockerfile
│
├── xmbot-mvp/                # Next.js frontend
│   ├── app/                  # App router
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   └── admin/            # Admin pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   ├── prisma/               # Database schema
│   └── package.json
│
├── docker-compose.yml        # Orchestration
├── Caddyfile                 # Reverse proxy
└── .env                      # Environment variables
```

### Code Conventions

#### Python (Engine)

- Use type hints everywhere
- Follow PEP 8
- Use dataclasses for data models
- Use async/await for I/O operations
- Log with `logging` module, not print
- Use `snake_case` for functions/variables
- Use `PascalCase` for classes

#### TypeScript (Frontend)

- Use strict TypeScript
- Prefer `const` over `let`
- Use interfaces over types
- Follow Next.js App Router conventions
- Use `camelCase` for functions/variables
- Use `PascalCase` for components

---

## Deployment

### Production Setup

#### 1. VPS Requirements

- Ubuntu 22.04+
- 2GB RAM minimum
- 20GB SSD
- Docker + Docker Compose installed
- Domain DNS configured (xmbot.online → VPS IP)

#### 2. Environment Variables

Create `.env` in project root:

```bash
# Core
XMBOT_ENV=production
DATABASE_URL=postgresql://xmbot:password@localhost:5432/xmbot

# Telegram
TELEGRAM_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# AI (at least one required)
CLAUDE_API_KEY=your_key
GEMINI_API_KEY=your_key

# Risk Limits
MAX_DAILY_LOSS=10000
MAX_POSITIONS=20

# Monitoring
LOG_LEVEL=INFO
SENTRY_DSN=your_dsn
```

#### 3. Deploy

```bash
# Clone on VPS
git clone <repo-url>
cd XMBot

# Configure
cp .env.example .env
nano .env  # Edit with production values

# Start
docker-compose up -d

# Verify
curl http://localhost:8080/health
```

#### 4. SSL/TLS

Caddy auto-provisions SSL via Let's Encrypt. Ensure:
- Domain DNS points to VPS IP
- Ports 80 and 443 are open
- Caddy has write access to `/etc/caddy/`

### Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| engine | 8080 | Trading engine + API |
| web | 3000 → 3006 | Next.js frontend |
| caddy | 80, 443 | Reverse proxy, SSL |

### Updating

```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

---

## Trading Strategy

### Signal Generation

**Primary Strategy: RSI + Supertrend + ADX**

```
Entry Conditions:
├── BUY Signal:
│   ├── Supertrend flips from -1 to +1 (bullish)
│   └── OR RSI crosses above 50 (momentum)
│
├── SELL Signal:
│   ├── Supertrend flips from +1 to -1 (bearish)
│   └── OR RSI crosses below 50 (momentum)
│
└── Filter:
    └── ADX > 20 (trending market)
```

### Risk Management

| Rule | Value | Description |
|------|-------|-------------|
| Risk per trade | 2% | Max 2% of account per trade |
| Stop loss | 3.0x ATR | Dynamic based on volatility |
| Take profit | 2.0x SL | 2:1 reward-to-risk ratio |
| Max daily loss | $10,000 | Circuit breaker |
| Max positions | 20 | Diversification limit |
| Session filter | London/NY | Skip low-volume Asian session |

### Parameters (Optimized)

| Parameter | Value | Range Tested |
|-----------|-------|--------------|
| ADX threshold | 20 | 15-35 |
| SL multiplier | 3.0x | 1.0-4.0x |
| TP ratio | 2.0x | 1.5-3.0x |
| RSI period | 14 | 10-20 |
| ATR period | 14 | 10-20 |
| Supertrend mult | 2.5 | 2.0-3.0 |

### Trading Sessions

| Session | Hours (UTC) | Status |
|---------|-------------|--------|
| London | 07:00-16:00 | ✅ Active |
| New York | 12:00-21:00 | ✅ Active |
| Asian | 00:00-07:00 | ❌ Skipped |

---

## API Reference

### Engine Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/engine/status` | Engine health status |
| GET | `/api/engine/positions` | Open positions |
| GET | `/api/engine/account` | Account balance |
| POST | `/api/engine/signal/:id/approve` | Approve signal |
| POST | `/api/engine/signal/:id/reject` | Reject signal |

### Sync Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync/trades` | Get trade history |
| GET | `/api/sync/metrics` | Get performance metrics |
| POST | `/api/sync/trades` | Sync trades to DB |

### Config Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get user config |
| PUT | `/api/config` | Update user config |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/config` | Get AI provider config |
| PUT | `/api/ai/config` | Update AI provider |
| POST | `/api/ai/regime` | Get market regime |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/webhook` | Cashfree webhook |
| GET | `/api/payment/status/:id` | Payment status |

---

## Monitoring & Alerts

### Health Checks

```bash
# Engine health
curl http://localhost:8080/health

# Frontend health
curl http://localhost:3000

# Docker status
docker-compose ps
```

### Logs

```bash
# Engine logs
docker-compose logs -f engine

# Frontend logs
docker-compose logs -f web

# All logs
docker-compose logs -f
```

### Metrics to Watch

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Engine health | Down for 1min | Restart service |
| Daily loss | > $5,000 | Notify, consider pause |
| Win rate | < 50% over 100 trades | Review strategy |
| Max drawdown | > 5% | Pause trading |
| API errors | > 10/hour | Check provider status |

### Sentry Integration

```python
# In engine
import sentry_sdk

sentry_sdk.init(
    dsn="your-dsn",
    environment="production",
    traces_sample_rate=0.1,
)

# Capture errors
sentry_sdk.capture_exception(e)
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Engine down, trading halted | Immediate |
| P2 | High loss, strategy misbehaving | 1 hour |
| P3 | Feature broken, non-critical | 4 hours |
| P4 | Minor bug, cosmetic | 24 hours |

### Incident Playbook

#### P1: Engine Down

```bash
# 1. Check status
docker-compose ps
curl http://localhost:8080/health

# 2. Check logs
docker-compose logs --tail=100 engine

# 3. Restart
docker-compose restart engine

# 4. Verify
curl http://localhost:8080/health

# 5. Notify team
# Send Telegram message
```

#### P2: High Loss

```bash
# 1. Pause trading
curl -X POST http://localhost:8080/api/engine/pause

# 2. Review recent trades
curl http://localhost:8080/api/sync/trades?limit=20

# 3. Check risk limits
curl http://localhost:8080/api/engine/account

# 4. Adjust parameters if needed
# Edit config, restart engine

# 5. Resume when safe
curl -X POST http://localhost:8080/api/engine/resume
```

#### P3: Feature Broken

```bash
# 1. Identify issue
# Check logs, reproduce locally

# 2. Fix in feature branch
git checkout -b fix/issue-description
# Make changes

# 3. Test
npm run test  # or pytest

# 4. Deploy
git checkout main
git merge fix/issue-description
docker-compose up -d
```

---

## Roadmap

### Q3 2026 (Aug-Sep): LAUNCH

- [ ] Deploy to production
- [ ] Set up monitoring (Sentry, health checks)
- [ ] Onboard first 20 beta users
- [ ] Gather feedback, fix bugs
- [ ] Target: 20 users, $800 MRR

### Q4 2026 (Oct-Dec): GROW

- [ ] Marketing push (Twitter, YouTube)
- [ ] Referral program
- [ ] Add MT5 broker support
- [ ] Improve win rate to 65%+
- [ ] Target: 100 users, $5K MRR

### Q1 2027 (Jan-Mar): SCALE

- [ ] Mobile app (React Native)
- [ ] Multi-pair support (BTC, EUR)
- [ ] API access for developers
- [ ] Advanced backtesting dashboard
- [ ] Target: 300 users, $15K MRR

### Q2 2027 (Apr-Jun): EXPAND

- [ ] RL overlay for position sizing
- [ ] Copy-trading feature
- [ ] B2B offering for funds
- [ ] Institutional-grade reporting
- [ ] Target: 500 users, $25K MRR

---

## Marketing & Branding Plan

### Brand Identity

#### Brand Positioning

**Tagline:** "Trade Gold. Trust the Bot. You Decide."

**Value Proposition:**
XMBot is the only AI-powered gold trading platform that gives you complete control. Our bot identifies opportunities, but you approve every trade. No surprises. No hidden algorithms. Just transparent, data-driven trading.

#### Brand Personality

| Trait | Description |
|-------|-------------|
| **Trustworthy** | Backtested results, transparent signals |
| **Empowering** | Human-in-the-loop, you're always in control |
| **Intelligent** | AI-powered analysis, not just gut feeling |
| **Accessible** | Telegram-first, works on any device |
| **Professional** | Institutional-grade technology for retail traders |

#### Visual Identity

| Element | Specification |
|---------|---------------|
| **Primary Color** | #1E3A5F (Deep Blue - trust, stability) |
| **Secondary Color** | #F4B942 (Gold - luxury, gold trading) |
| **Accent Color** | #2ECC71 (Green - profit, success) |
| **Font (Heading)** | Inter Bold |
| **Font (Body)** | Inter Regular |
| **Logo** | Gold bull icon + "XMBot" text |
| **Icon Style** | Minimalist, modern, flat design |

### Target Audience

#### Primary Segments

| Segment | Demographics | Pain Points | Channels |
|---------|--------------|-------------|----------|
| **Active Day Traders** | 25-45, $50K+ income, tech-savvy | Time-consuming analysis, emotional decisions | Twitter, YouTube, TradingView |
| **Crypto-Native Gold Traders** | 20-35, crypto investors, risk-takers | Looking for stable assets, gold exposure | Twitter, Reddit, Discord |
| **Indian Retail Traders** | 22-40, INR income, mobile-first | Limited access to global markets, language barriers | Telegram, YouTube (Hindi), Instagram |
| **Passive Income Seekers** | 30-50, professionals, busy | Want automated income, not full-time trading | LinkedIn, Facebook, Email |

#### Buyer Personas

**Persona 1: "Trader Raj" (Indian Market)**
- Age: 28, Mumbai
- Income: ₹15L/year
- Tech: Mobile-first, uses Telegram daily
- Pain: Wants to trade gold but limited time
- Channel: Telegram groups, YouTube (Hindi)

**Persona 2: "Crypto Carlos" (Global)**
- Age: 32, US
- Income: $80K/year
- Tech: Desktop + mobile, uses Discord
- Pain: Volatile crypto, wants stability
- Channel: Twitter, Reddit r/cryptocurrency

**Persona 3: "Busy Professional" (India + Global)**
- Age: 35, Bangalore/Remote
- Income: $100K/year
- Tech: All devices, uses WhatsApp/Telegram
- Pain: No time to analyze charts
- Channel: LinkedIn, email newsletters

### Marketing Channels

#### Phase 1: Launch (Month 1-3)

| Channel | Strategy | Budget | KPI |
|---------|----------|--------|-----|
| **Telegram Groups** | Join gold/crypto groups, share insights | $0 | 100 group members |
| **Twitter/X** | Daily market updates, signal previews | $0 | 500 followers |
| **YouTube** | Tutorial videos, backtest walkthrough | $0 | 100 subscribers |
| **Reddit** | r/gold, r/trading, r/algotrading | $0 | 50 upvotes |
| **Product Hunt** | Launch day push | $0 | Top 10 daily |

#### Phase 2: Growth (Month 4-6)

| Channel | Strategy | Budget | KPI |
|---------|----------|--------|-----|
| **Twitter Ads** | Targeted ads to traders | $500/mo | 50 signups/mo |
| **YouTube Ads** | Pre-roll on trading videos | $300/mo | 30 signups/mo |
| **Influencers** | Partner with trading YouTubers | $500/mo | 100 signups/mo |
| **Content SEO** | Blog posts on gold trading | $0 | 1K organic visitors/mo |
| **Email Newsletter** | Weekly market insights | $0 | 500 subscribers |

#### Phase 3: Scale (Month 7-12)

| Channel | Strategy | Budget | KPI |
|---------|----------|--------|-----|
| **Google Ads** | "Gold trading bot" keywords | $1,000/mo | 100 signups/mo |
| **Facebook/Instagram** | Retargeting, lookalike audiences | $500/mo | 50 signups/mo |
| **Podcast Sponsorship** | Trading/finance podcasts | $500/mo | 30 signups/mo |
| **Referral Program** | 20% commission for referrals | $0 | 20% of signups |
| **Partnerships** | Broker integrations, affiliates | $0 | 50 signups/mo |

### Content Strategy

#### Content Calendar (Monthly)

| Week | Content Type | Platform | Topic |
|------|--------------|----------|-------|
| 1 | Blog Post | Website | "How to Trade Gold with AI" |
| 1 | Twitter Thread | Twitter | Weekly market analysis |
| 2 | YouTube Video | YouTube | Backtest walkthrough |
| 2 | Telegram Post | Telegram | Signal preview |
| 3 | Blog Post | Website | "Risk Management 101" |
| 3 | Twitter Thread | Twitter | Trading tips |
| 4 | YouTube Video | YouTube | User testimonials |
| 4 | Email Newsletter | Email | Monthly performance report |

#### Content Pillars

1. **Education**: How to trade gold, risk management, technical analysis
2. **Proof**: Backtest results, user testimonials, live trading demos
3. **Transparency**: Signal explanations, win/loss breakdowns, strategy logic
4. **Community**: User stories, Q&A sessions, market discussions

#### SEO Keywords

| Keyword | Volume | Difficulty | Priority |
|---------|--------|------------|----------|
| gold trading bot | 1,200/mo | Medium | High |
| XAUUSD bot | 800/mo | Low | High |
| automated gold trading | 600/mo | Medium | High |
| gold trading signals | 2,400/mo | High | Medium |
| AI trading bot | 3,600/mo | High | Medium |
| Telegram trading bot | 1,800/mo | Medium | Medium |

### Referral Program

#### Structure

| Tier | Referrals | Reward |
|------|-----------|--------|
| **Bronze** | 1-5 | Free month |
| **Silver** | 6-15 | 2 free months |
| **Gold** | 16-30 | 5 free months |
| **Platinum** | 31+ | Lifetime free |

#### Mechanics

1. User gets unique referral link
2. Friend signs up using link
3. Friend gets 14-day free trial
4. Referrer gets credit after friend pays
5. Rewards stack (10 referrals = 2 free months)

### Launch Plan

#### Pre-Launch (2 weeks before)

- [ ] Create landing page with email capture
- [ ] Set up Twitter/YouTube/Telegram accounts
- [ ] Prepare launch day content
- [ ] Reach out to 10 trading influencers
- [ ] Set up Product Hunt page

#### Launch Day

- [ ] Post on Product Hunt (8am PST)
- [ ] Tweet launch announcement (9am PST)
- [ ] Send email to waitlist (10am PST)
- [ ] Post in Telegram groups (11am PST)
- [ ] Go live on YouTube (12pm PST)

#### Post-Launch (1 week after)

- [ ] Respond to all comments/questions
- [ ] Share user testimonials
- [ ] Publish backtest results blog post
- [ ] Run Twitter poll for feedback
- [ ] Schedule user onboarding calls

### Metrics & KPIs

#### North Star Metric

**Monthly Active Users (MAU)** — Users who execute at least 1 trade per month

#### Supporting Metrics

| Category | Metric | Target (Month 6) |
|----------|--------|------------------|
| **Acquisition** | Website visitors | 10,000/mo |
| **Acquisition** | Signups | 500/mo |
| **Activation** | Trial → Paid conversion | 20% |
| **Revenue** | MRR | $10,000 |
| **Revenue** | ARPU | $50 |
| **Retention** | Monthly churn | <8% |
| **Referral** | Referral rate | 15% |

### Budget Allocation (Year 1)

| Category | Q3 2026 | Q4 2026 | Q1 2027 | Q2 2027 | Total |
|----------|---------|---------|---------|---------|-------|
| **Ads** | $0 | $1,500 | $2,000 | $2,500 | $6,000 |
| **Influencers** | $0 | $500 | $1,000 | $1,500 | $3,000 |
| **Content** | $0 | $200 | $300 | $400 | $900 |
| **Tools** | $0 | $100 | $100 | $100 | $300 |
| **Total** | **$0** | **$2,300** | **$3,400** | **$4,500** | **$10,200** |

---

## Contributing

### Branch Strategy

```
main          ← Production
├── develop   ← Development
│   ├── feature/*  ← New features
│   ├── fix/*      ← Bug fixes
│   └── refactor/* ← Code cleanup
```

### PR Process

1. Create feature branch from `develop`
2. Make changes, write tests
3. Run linter and type checker
4. Create PR with description
5. Review (self-review OK for solo)
6. Merge to `develop`
7. Deploy to staging
8. Test
9. Merge to `main`
10. Deploy to production

### Commit Messages

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add tests
chore: Maintenance tasks
```

### Code Review Checklist

- [ ] Type hints present
- [ ] Error handling added
- [ ] Logs added for debugging
- [ ] Tests added/updated
- [ ] No secrets in code
- [ ] Documentation updated
- [ ] Performance considered
- [ ] Security reviewed

---

## Appendix

### Key Files Reference

| File | Purpose |
|------|---------|
| `engine/src/core/engine.py` | Main engine loop |
| `engine/src/agents/technical.py` | Signal generation |
| `engine/src/risk/engine.py` | Risk management |
| `engine/src/backtest/engine.py` | Backtesting |
| `xmbot-mvp/app/api/engine/` | API endpoints |
| `docker-compose.yml` | Deployment |
| `.env.example` | Environment config |

### Useful Commands

```bash
# Engine
python -m src.main                    # Start engine
python -m src.backtest.engine         # Run backtest
python -m src.backtest.optimize       # Optimize params

# Frontend
npm run dev                           # Development
npm run build                         # Production build
npm run start                         # Production start

# Docker
docker-compose up -d                  # Start all
docker-compose down                   # Stop all
docker-compose logs -f engine         # Engine logs
docker-compose exec engine bash       # Shell into engine
```

### Contact

- **Slack**: #xmbot-dev
- **Email**: dev@xmbot.online
- **Telegram**: @xmbot_support

---

**Document maintained by:** XMBot Development Team
**Last reviewed:** July 24, 2026
**Next review:** August 24, 2026
