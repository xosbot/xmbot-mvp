from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from ..core.types import (
    Order,
    RiskVerdict,
    Signal,
    UserConfig,
)


log = logging.getLogger("xmbot.risk")


class RiskEngine:
    def __init__(self, global_max_daily_loss: float = 10000.0, global_max_positions: int = 20) -> None:
        self._global_max_daily_loss = global_max_daily_loss
        self._global_max_positions = global_max_positions
        self._daily_pnl: dict[str, float] = {}
        self._daily_trades: dict[str, int] = {}
        self._peak_balance: dict[str, float] = {}
        self._last_reset: Optional[datetime] = None

    async def check_signal(self, signal: Signal, user_config: UserConfig) -> RiskVerdict:
        self._maybe_reset_daily()

        if not await self._check_global_limits():
            return RiskVerdict.BLOCK

        if not await self._check_user_limits(signal, user_config):
            return RiskVerdict.BLOCK

        return RiskVerdict.PASS

    async def record_trade(self, order: Order) -> None:
        self._daily_trades.setdefault(order.user_id, 0)
        self._daily_trades[order.user_id] += 1

    async def record_pnl(self, user_id: str, pnl: float) -> None:
        """Called when a position closes to update daily PnL tracking."""
        self._daily_pnl.setdefault(user_id, 0.0)
        self._daily_pnl[user_id] += pnl
        log.info(f"Risk: Recorded PnL for {user_id}: {pnl:+.2f} (daily total: {self._daily_pnl[user_id]:+.2f})")

    async def check_drawdown(self, user_id: str, current_balance: float, max_drawdown_percent: float = 15.0) -> bool:
        """Check if max drawdown is exceeded. Returns True if limit breached."""
        peak = self._peak_balance.get(user_id, current_balance)
        if current_balance > peak:
            self._peak_balance[user_id] = current_balance
            peak = current_balance

        if peak <= 0:
            return False

        drawdown_pct = (peak - current_balance) / peak * 100
        if drawdown_pct >= max_drawdown_percent:
            log.warning(f"Drawdown limit breached for {user_id}: {drawdown_pct:.1f}% >= {max_drawdown_percent}%")
            return True
        return False

    def get_daily_stats(self, user_id: str) -> dict:
        return {
            "daily_pnl": self._daily_pnl.get(user_id, 0.0),
            "daily_trades": self._daily_trades.get(user_id, 0),
            "peak_balance": self._peak_balance.get(user_id, 0.0),
        }

    def _maybe_reset_daily(self) -> None:
        now = datetime.now(timezone.utc)
        if self._last_reset is None or now.date() > self._last_reset.date():
            log.info(f"Risk: Daily reset — clearing PnL and trade counters")
            self._daily_pnl.clear()
            self._daily_trades.clear()
            self._last_reset = now

    async def _check_global_limits(self) -> bool:
        total_positions = sum(self._daily_trades.values())
        if total_positions >= self._global_max_positions:
            log.warning(f"Global position limit reached: {total_positions}")
            return False
        return True

    async def _check_user_limits(self, signal: Signal, config: UserConfig) -> bool:
        user_pnl = self._daily_pnl.get(signal.user_id, 0.0)
        if user_pnl <= -config.max_daily_loss:
            log.warning(f"User {signal.user_id} daily loss limit reached: {user_pnl:.2f}")
            return False

        user_trades = self._daily_trades.get(signal.user_id, 0)
        agent_config = config.agent_configs.get(signal.agent)
        if agent_config and user_trades >= agent_config.max_daily_trades:
            log.warning(f"User {signal.user_id} daily trade limit reached: {user_trades}")
            return False

        return True
