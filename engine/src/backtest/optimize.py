"""Parameter optimization for XMBot strategy."""
import sys
import csv
import json
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional
from itertools import product

sys.path.insert(0, '.')

from src.core.types import Market, AgentConfig, Signal, SignalAction
from src.agents.technical import TechnicalAnalysisAgent
from src.backtest.portfolio import BacktestPortfolio, BacktestResult


def load_csv(filepath: str) -> list[Market]:
    markets = []
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ts = int(row['time'])
            close = float(row['close'])
            markets.append(Market(
                symbol="XAUUSD",
                timeframe="M5",
                timestamp=datetime.fromtimestamp(ts, tz=timezone.utc),
                bid=close,
                ask=close + 0.3,
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=close,
                volume=float(row.get('volume', 0)),
            ))
    return markets


def run_backtest(
    market_data: list[Market],
    adx_threshold: float = 30.0,
    atr_sl_multiplier: float = 1.5,
    tp_ratio: float = 2.0,
    risk_per_trade: float = 0.02,
    min_sl_distance: float = 5.0,
) -> BacktestResult:
    config = AgentConfig(name='backtest', timeframe='M5')
    agent = TechnicalAnalysisAgent(
        config=config,
        adx_threshold=adx_threshold,
        atr_sl_multiplier=atr_sl_multiplier,
        tp_ratio=tp_ratio,
        min_sl_distance=min_sl_distance,
        risk_per_trade_pct=risk_per_trade * 100,
    )

    portfolio = BacktestPortfolio(10000.0, risk_per_trade)

    if len(market_data) < 100:
        return portfolio.get_results()

    for i in range(100, len(market_data)):
        window = market_data[i - 100:i]
        current = market_data[i]

        if portfolio._open_trade is not None:
            portfolio.check_exit(
                current.close,
                current.timestamp,
                high=current.high,
                low=current.low,
            )

        signal = agent.analyze_with_confirmation(window, h1_data=None)
        if signal is None:
            continue

        portfolio.open_trade(signal, current.timestamp)

    if portfolio._open_trade is not None:
        last = market_data[-1]
        portfolio._close_trade(last.close, last.timestamp, "End of Data")

    return portfolio.get_results()


def main():
    print("Loading M5 data (60 days)...")
    m5_data = load_csv('/mnt/d/TRADING/XAUUSD_M5_60days.csv')
    print(f"Loaded {len(m5_data)} M5 candles")

    # Parameter grid
    adx_thresholds = [20, 25, 30, 35, 40]
    sl_multipliers = [1.0, 1.5, 2.0, 2.5]
    tp_ratios = [1.5, 2.0, 2.5, 3.0]
    risk_levels = [0.01, 0.02, 0.03]

    best_result = None
    best_params = None
    best_score = -float('inf')
    results = []

    total = len(adx_thresholds) * len(sl_multipliers) * len(tp_ratios) * len(risk_levels)
    print(f"\nTesting {total} parameter combinations...")

    count = 0
    for adx, sl_mult, tp_ratio, risk in product(
        adx_thresholds, sl_multipliers, tp_ratios, risk_levels
    ):
        count += 1
        result = run_backtest(
            m5_data,
            adx_threshold=adx,
            atr_sl_multiplier=sl_mult,
            tp_ratio=tp_ratio,
            risk_per_trade=risk,
        )

        # Score: balance return and risk
        score = result.total_pnl
        if result.total_trades < 5:
            score = -1000  # Penalize too few trades

        results.append({
            'adx': adx, 'sl_mult': sl_mult, 'tp_ratio': tp_ratio, 'risk': risk,
            'trades': result.total_trades, 'win_rate': result.win_rate,
            'pnl': result.total_pnl, 'pf': result.profit_factor,
            'score': score,
        })

        if score > best_score:
            best_score = score
            best_result = result
            best_params = {'adx': adx, 'sl_mult': sl_mult, 'tp_ratio': tp_ratio, 'risk': risk}

        if count % 50 == 0:
            print(f"  Progress: {count}/{total}")

    # Sort by score
    results.sort(key=lambda x: x['score'], reverse=True)

    print("\n" + "="*70)
    print("TOP 10 PARAMETER COMBINATIONS")
    print("="*70)
    print(f"{'ADX':>5} {'SL-mult':>8} {'TP-ratio':>9} {'Risk':>6} {'Trades':>7} {'WinRate':>8} {'PnL':>10} {'PF':>6}")
    print("-"*70)
    for r in results[:10]:
        print(f"{r['adx']:>5} {r['sl_mult']:>8.1f} {r['tp_ratio']:>9.1f} {r['risk']:>6.2f} "
              f"{r['trades']:>7} {r['win_rate']:>7.1f}% ${r['pnl']:>+9.2f} {r['pf']:>6.2f}")

    print("\n" + "="*70)
    print("BEST RESULT")
    print("="*70)
    print(f"Parameters: ADX={best_params['adx']}, SL-mult={best_params['sl_mult']}, "
          f"TP-ratio={best_params['tp_ratio']}, Risk={best_params['risk']}")
    print(best_result.summary())

    # Save results
    with open('/mnt/d/TRADING/backtest_optimization_results.json', 'w') as f:
        json.dump({'best_params': best_params, 'top_10': results[:10], 'total_tested': total}, f, indent=2)
    print("\nResults saved to /mnt/d/TRADING/backtest_optimization_results.json")


if __name__ == '__main__':
    main()
