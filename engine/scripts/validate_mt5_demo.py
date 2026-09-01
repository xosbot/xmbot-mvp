#!/usr/bin/env python3
"""Read-only MT5 demo safety validation.

This harness deliberately does not enable MT5 execution or submit an order.
It verifies the connected account is reported as DEMO and reports the broker
truth APIs that an operator must exercise before setting idempotency_verified.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.broker.mt5 import MT5Broker  # noqa: E402

ACK = "I_UNDERSTAND_DEMO_ONLY"


async def validate() -> int:
    if os.getenv("XMBOT_MT5_DEMO_ACK") != ACK:
        print(f"Refusing to connect. Set XMBOT_MT5_DEMO_ACK={ACK}.", file=sys.stderr)
        return 2
    broker = MT5Broker(
        path=os.getenv("MT5_PATH", ""),
        login=int(os.getenv("MT5_LOGIN", "0")),
        password=os.getenv("MT5_PASSWORD", ""),
        server=os.getenv("MT5_SERVER", ""),
        symbol=os.getenv("MT5_SYMBOL", "XAUUSD"),
        idempotency_verified=False,
    )
    if not await broker.connect():
        print("MT5 connection failed", file=sys.stderr)
        return 1
    try:
        native = await broker._run_sync(broker._mt5.account_info)  # validation-only native check
        demo_mode = getattr(broker._mt5, "ACCOUNT_TRADE_MODE_DEMO", None)
        if native is None or demo_mode is None or native.trade_mode != demo_mode:
            print("Refusing validation: connected account is not verifiably DEMO.", file=sys.stderr)
            return 3
        account = await broker.get_account()
        orders = await broker.get_open_orders()
        positions = await broker.get_positions()
        executions = await broker.get_executions()
        report = {
            "account": account.external_account_id if account else None,
            "account_mode": "DEMO",
            "idempotency_enabled": broker.supports_idempotent_execution,
            "read_checks": {
                "order_lookup": "PASS",
                "deal_lookup": "PASS",
                "position_lookup": "PASS",
                "open_orders": len(orders),
                "open_positions": len(positions),
                "recent_deals": len(executions),
            },
            "manual_checks_required": [
                "minimum-volume order and magic/comment preservation",
                "partial close",
                "manual, SL, and TP close detection",
                "restart recovery",
                "commission, swap, and fee inspection",
                "unknown order and position detection",
            ],
        }
        print(json.dumps(report, indent=2))
        return 0
    finally:
        await broker.disconnect()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(validate()))
