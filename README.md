# XMBot — AI Gold Trading Platform

Multi-agent AI system for XAUUSD trading with human-in-the-loop approval via Telegram.

## Features

- **Multi-Agent Analysis**: Technical Analysis Agent scans XAUUSD M5 with RSI + Supertrend + ADX. AI validates via Gemini/Claude.
- **Human-in-the-Loop**: Every signal requires your approval. Review on Telegram, approve with one tap.
- **Risk Engine**: 2% max risk per trade. Daily loss limits. Max drawdown protection.
- **Backtested Strategy**: 64% win rate, +84.3% return, 4.3% max drawdown on 6 months of data.
- **Telegram Integration**: Signal cards with Approve/Reject buttons. Trade alerts. Performance summaries.
- **Live Dashboard**: Real-time positions, P&L tracking, signal history, engine status.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/xosbot/xmbot-mvp.git
cd xmbot-mvp

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start with Docker
docker compose up -d

# Access the platform
# Web: http://localhost:3000
# Engine: http://localhost:8080
```

## Configuration

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `ENGINE_API_URL`: Engine API URL (default: http://engine:8080)

### Optional
- `BINANCE_API_KEY` / `BINANCE_API_SECRET`: For live trading
- `TELEGRAM_TOKEN`: For Telegram integration
- `GEMINI_API_KEY` / `CLAUDE_API_KEY`: For AI validation

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web App       │────▶│   Engine API    │────▶│   Brokers       │
│   (Next.js)     │     │   (FastAPI)     │     │   (Paper/Binance)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   Telegram      │
│   (Database)    │     │   (Approvals)   │
└─────────────────┘     └─────────────────┘
```

## Strategy

### Entry Conditions
- RSI crosses above 30 (oversold bounce)
- Supertrend turns bullish
- ADX > 25 (strong trend)
- AI confidence > 60%

### Risk Management
- Max risk per trade: 2%
- Daily loss limit: ₹10,000
- Max drawdown: 10%
- Max concurrent positions: 5

## Pricing

| Plan | Price | Duration |
|------|-------|----------|
| Beta | ₹9,999 | 3 months |
| Monthly | ₹2,999 | 1 month |
| Quarterly | ₹7,999 | 3 months |
| Yearly | ₹24,999 | 12 months |

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, uvicorn
- **Database**: PostgreSQL 15, Redis 7
- **AI**: Google Gemini, Anthropic Claude
- **Broker**: Paper Trading, Binance (MT5/IBKR coming soon)
- **Infra**: Docker, Nginx

## License

Private — XMBot Trading Platform. All rights reserved.
