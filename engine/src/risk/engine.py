from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

from ..core.persistence import Persistence
from ..core.types import (
    Order,
    RiskVerdict,
    Signal,
    UserConfig,
)

log = logging.getLogger("xmbot.risk")


class RiskEngine:
    def __init__(
        self,
        global_max_daily_loss: float = 10000.0,
        global_max_positions: int = 20,
        persistence: Persistence | None = None,
    ) -> None:
        self._global_max_daily_loss = global_max_daily_loss
        self._global_max_positions = global_max_positions
        self._persistence = persistence
        self._daily_pnl: dict[str, float] = {}
        self._daily_trades: dict[str, int] = {}
        self._peak_balance: dict[str, float] = {}
        self._recorded_execution_ids: set[str] = set()
        self._last_reset: datetime | None = datetime.now(UTC)
        self._lock = asyncio.Lock()
        self._load_state()

    def _load_state(self) -> None:
        """Restore risk counters saved before a restart, so the daily-loss
        circuit breaker survives a redeploy instead of silently resetting."""
        if not self._persistence:
            return
        data = self._persistence.load()
        if not data:
            return

        saved_date = data.get("date")
        today = datetime.now(UTC).date().isoformat()
        if saved_date == today:
            self._daily_pnl = dict(data.get("daily_pnl", {}))
            self._daily_trades = dict(data.get("daily_trades", {}))
            self._recorded_execution_ids = set(data.get("recorded_execution_ids", []))
            log.info(
                f"Risk: restored daily state from {saved_date} ({len(self._daily_pnl)} user(s))"
            )
        # Peak balance is an all-time high-water mark for drawdown checks,
        # not a daily counter — restore it regardless of the saved date.
        self._peak_balance = dict(data.get("peak_balance", {}))

    async def _save_state(self) -> None:
        if not self._persistence:
            return
        await self._persistence.save(
            {
                "date": datetime.now(UTC).date().isoformat(),
                "daily_pnl": self._daily_pnl,
                "daily_trades": self._daily_trades,
                "peak_balance": self._peak_balance,
                "recorded_execution_ids": sorted(self._recorded_execution_ids),
            }
        )

    async def check_signal(
        self, signal: Signal, user_config: UserConfig, open_position_count: int = 0,
        user_position_count: int = 0, account_balance: float = 0.0, volume: float = 0.0,
    ) -> RiskVerdict:
        async with self._lock:
            if self._maybe_reset_daily():
                await self._save_state()

            if not await self._check_global_limits(open_position_count):
                return RiskVerdict.BLOCK

            if not await self._check_user_limits(signal, user_config, user_position_count):
                return RiskVerdict.BLOCK

            if account_balance > 0 and not self._check_risk_amount(signal, user_config, account_balance, volume):
                return RiskVerdict.BLOCK

            return RiskVerdict.PASS

    async def record_trade(self, order: Order) -> None:
        async with self._lock:
            self._daily_trades.setdefault(order.user_id, 0)
            self._daily_trades[order.user_id] += 1
            await self._save_state()

    async def record_pnl(self, user_id: str, pnl: float) -> None:
        """Called when a position closes to update daily PnL tracking."""
        async with self._lock:
            self._daily_pnl.setdefault(user_id, 0.0)
            self._daily_pnl[user_id] += pnl
            log.info(f"Risk: Recorded PnL for {user_id}: {pnl:+.2f} (daily total: {self._daily_pnl[user_id]:+.2f})")
            await self._save_state()

    async def record_pnl_once(self, user_id: str, pnl: float, execution_id: str) -> None:
        """Atomically persist a broker execution dedupe key with its P&L.

        The JSON risk snapshot uses atomic file replacement. If the process dies
        after this method returns but before PostgreSQL is marked, replay sees
        the execution ID and safely becomes a no-op.
        """
        async with self._lock:
            if execution_id in self._recorded_execution_ids:
                return
            previous = self._daily_pnl.get(user_id, 0.0)
            self._daily_pnl[user_id] = previous + pnl
            self._recorded_execution_ids.add(execution_id)
            try:
                await self._save_state()
            except Exception:
                self._daily_pnl[user_id] = previous
                self._recorded_execution_ids.discard(execution_id)
                raise
            log.info(
                "Risk: recorded broker execution %s for %s: %+.2f",
                execution_id,
                user_id,
                pnl,
            )

    async def check_drawdown(self, user_id: str, current_balance: float, max_drawdown_percent: float = 15.0) -> bool:
        """Check if max drawdown is exceeded. Returns True if limit breached."""
        async with self._lock:
            peak = self._peak_balance.get(user_id, current_balance)
            if current_balance >= peak:
                self._peak_balance[user_id] = current_balance
                peak = current_balance
                await self._save_state()

            if peak <= 0:
                return False

            drawdown_pct = (peak - current_balance) / peak * 100
            if drawdown_pct >= max_drawdown_percent:
                log.warning(f"Drawdown limit breached for {user_id}: {drawdown_pct:.1f}% >= {max_drawdown_percent}%")
                return True
            return False

    def update_global_limits(
        self, max_daily_loss: float | None = None, max_positions: int | None = None
    ) -> None:
        if max_daily_loss is not None:
            self._global_max_daily_loss = max_daily_loss
        if max_positions is not None:
            self._global_max_positions = max_positions
        log.info(
            f"Risk: global limits updated — max_daily_loss={self._global_max_daily_loss}, "
            f"max_positions={self._global_max_positions}"
        )

    def get_daily_stats(self, user_id: str) -> dict:
        return {
            "daily_pnl": self._daily_pnl.get(user_id, 0.0),
            "daily_trades": self._daily_trades.get(user_id, 0),
            "peak_balance": self._peak_balance.get(user_id, 0.0),
        }

    def _maybe_reset_daily(self) -> bool:
        now = datetime.now(UTC)
        if self._last_reset is None or now.date() > self._last_reset.date():
            log.info("Risk: Daily reset — clearing PnL and trade counters")
            self._daily_pnl.clear()
            self._daily_trades.clear()
            self._last_reset = now
            return True
        return False

    async def _check_global_limits(self, open_position_count: int) -> bool:
        if open_position_count >= self._global_max_positions:
            log.warning(f"Global position limit reached: {open_position_count}")
            return False
        return True

    async def _check_user_limits(self, signal: Signal, config: UserConfig, user_position_count: int = 0) -> bool:
        user_pnl = self._daily_pnl.get(signal.user_id, 0.0)
        if user_pnl <= -config.max_daily_loss:
            log.warning(f"User {signal.user_id} daily loss limit reached: {user_pnl:.2f}")
            return False

        user_trades = self._daily_trades.get(signal.user_id, 0)
        agent_config = config.agent_configs.get(signal.agent)
        if agent_config and user_trades >= agent_config.max_daily_trades:
            log.warning(f"User {signal.user_id} daily trade limit reached: {user_trades}")
            return False

        # Per-user max positions check
        if user_position_count >= config.max_positions:
            log.warning(f"User {signal.user_id} max positions reached: {user_position_count}/{config.max_positions}")
            return False

        return True

    def _check_risk_amount(self, signal: Signal, config: UserConfig, account_balance: float, volume: float) -> bool:
        """Hard gate: block if dollar risk exceeds risk_per_trade_pct of balance.

        risk_amount = |entry - SL| * volume * contract_size
        max_allowed = account_balance * risk_per_trade_pct / 100

        `volume` must be the lot size the engine actually intends to trade
        (from Engine._calculate_volume) — sizing already targets risk_pct, but
        can be pushed over it when clamped up to the minimum tradable lot
        size, which is exactly the case this gate exists to catch.
        """
        risk_pct = getattr(config, 'risk_per_trade_pct', 2.0)
        max_risk_dollars = account_balance * risk_pct / 100.0

        from ..core.instruments import get_contract_size
        contract_size = get_contract_size(signal.market)
        price_risk = abs(signal.entry_price - signal.stop_loss)
        estimated_risk = price_risk * volume * contract_size

        if estimated_risk > max_risk_dollars:
            log.warning(
                f"Risk blocked: estimated ${estimated_risk:.2f} > max ${max_risk_dollars:.2f} "
                f"({risk_pct}% of ${account_balance:.2f})"
            )
            return False
        return True
