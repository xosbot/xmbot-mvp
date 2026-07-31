export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: "introducing-xmbot",
    title: "Introducing XMBot: AI-Powered Gold Trading with Human-in-the-Loop",
    excerpt: "We're launching XMBot — a multi-agent AI system that analyzes XAUUSD 24/5 and sends trading signals to your Telegram. You approve every trade.",
    date: "2026-01-15",
    author: "XMBot Team",
    category: "Product",
    content: `
## The Problem

Most trading bots are black boxes. They trade your money without your input, and when they fail, you lose everything. The promise of "automated passive income" has burned countless traders.

## Our Approach

XMBot takes a fundamentally different approach: **AI analyzes, you decide.**

Our multi-agent system uses three specialized AI agents:

1. **Technical Analysis Agent** — Scans XAUUSD M5 with RSI + Supertrend + ADX
2. **AI Validator** — Confirms signals via Gemini/Claude with market context
3. **Risk Manager** — Enforces 2% max risk per trade, daily limits, and position sizing

## How It Works

When the AI identifies a trading opportunity, it sends a rich signal card to your Telegram with:
- Entry price
- Stop loss
- Take profit
- Confidence score
- Risk amount

You review the analysis and tap **Approve** or **Reject**. The trade only executes after your explicit approval.

## Backtested Results

We validated XMBot on 6 months of XAUUSD M5 data:
- **64% win rate** over 1,083 trades
- **+84.3% return** on $10,000 initial capital
- **4.3% max drawdown** with risk management
- **Walk-forward analysis** shows +19% on unseen data

## Beta Launch

We're opening the beta with 50% off for early adopters. Join now at [xmbot.online/register](https://xmbot.online/register).
    `,
  },
  {
    slug: "backtest-results-explained",
    title: "XMBot Backtest Results: What 1,083 Trades Taught Us",
    excerpt: "Deep dive into our 6-month backtest on XAUUSD M5 — win rate, profit factor, drawdown, and what walk-forward analysis reveals.",
    date: "2026-01-10",
    author: "XMBot Team",
    category: "Strategy",
    content: `
## Methodology

We backtested the RSI Sniper + ADX Filter strategy on XAUUSD M5 data from July–December 2025. The test used:
- $10,000 initial capital
- 2% max risk per trade
- 0.05 lot default size
- RSI oversold/overbought filters
- ADX trend strength confirmation

## Key Metrics

| Metric | Value |
|--------|-------|
| Total Trades | 1,083 |
| Win Rate | 64% |
| Total Return | +84.3% |
| Max Drawdown | 4.3% |
| Profit Factor | 2.1x |
| Sharpe Ratio | 1.8 |

## Walk-Forward Analysis

To validate the strategy isn't overfitted, we ran walk-forward analysis on unseen data. The result: **+19% return** on the out-of-sample period, confirming the strategy generalizes.

## Risk Management Impact

Without the 2% risk rule, the same strategy would have seen 12%+ drawdown. The risk manager is what makes this sustainable.

## Disclaimer

Past performance does not guarantee future results. Trading involves significant risk of loss.
    `,
  },
  {
    slug: "risk-management-guide",
    title: "Risk Management in Algorithmic Trading: A Practical Guide",
    excerpt: "Why risk management matters more than win rate, and how XMBot enforces it at the engine level.",
    date: "2026-01-05",
    author: "XMBot Team",
    category: "Education",
    content: `
## The #1 Rule of Trading

The most important rule in trading isn't about picking winners — it's about managing losers. A strategy with 50% win rate can be profitable with proper risk management. A strategy with 80% win rate can blow up without it.

## The 2% Rule

XMBot enforces a strict 2% maximum risk per trade. This means:
- On a $10,000 account, maximum loss per trade is $200
- Even 10 consecutive losses only draw down 20%
- The account survives enough trades for the edge to play out

## Why Engine-Level Enforcement Matters

Most platforms "recommend" risk settings. XMBot **enforces** them at the engine level:
- Position sizing is calculated automatically
- You cannot accidentally over-leverage
- Daily loss limits trigger automatic pausing
- Max drawdown protection kicks in at configured thresholds

## The Math

With 2% risk per trade and a 64% win rate:
- Expected value per trade: +0.28%
- After 100 trades: +32% expected return
- Max theoretical drawdown: ~15% (unlikely with 64% win rate)

This is why risk management beats win rate every time.
    `,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getBlogPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
