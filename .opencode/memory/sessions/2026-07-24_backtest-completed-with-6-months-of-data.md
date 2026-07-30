---
date: 2026-07-24
---

Backtest completed with 6 months of data (51,840 M5 candles from PAXGUSDT/Binance):

**Optimized Parameters:**
- ADX threshold: 20 (was 30)
- SL multiplier: 3.0x ATR (was 1.5x)
- TP ratio: 2.0x SL (unchanged)

**Results:**
- Full backtest: +84.3% return (1,083 trades, 64% win rate)
- Walk-forward validation: +19% return (realistic expectation)
- Max drawdown: 4.3%

**Applied to engine:**
- Updated TechnicalAnalysisAgent default parameters
- Report saved to engine/BACKTEST_RESULTS.md

**RL Analysis:**
- Can improve position sizing and regime detection
- Recommended hybrid approach (RL overlay on rule-based)
- Timeline: 8 weeks for full integration
- Priority: Deploy optimized rule-based first, add RL later
