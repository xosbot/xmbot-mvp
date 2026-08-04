"""Post-trade analysis agent using AI."""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from ..ai.base import AIProvider
from ..core.types import Order, SignalAction

log = logging.getLogger("xmbot.agent.analysis")


class PostTradeAnalyzer:
    """Analyze closed trades using AI for learning and improvement.

    This runs after trades are closed to:
    - Evaluate if the trade was well-executed
    - Identify patterns in winning/losing trades
    - Generate insights for strategy improvement
    """

    def __init__(self, ai_provider: AIProvider | None = None) -> None:
        self.ai = ai_provider
        self._trade_log: list[dict] = []

    async def analyze_closed_trade(
        self,
        order: Order,
        market_data_at_entry: list,
        market_data_at_exit: list,
    ) -> dict:
        """Analyze a closed trade."""
        if not self.ai:
            return {"analysis": "AI unavailable", "source": "default"}

        try:
            entry_summary = self._format_data(market_data_at_entry[-10:])
            exit_summary = self._format_data(market_data_at_exit[-5:])

            response = await self.ai.generate(
                self._build_analysis_prompt(order, entry_summary, exit_summary),
                system=self._system_prompt
            )

            if response.error:
                return {"analysis": f"AI error: {response.error}", "source": "error"}

            result = {
                "analysis": response.content,
                "source": "ai",
                "model": response.model,
                "tokens": response.tokens_used,
                "trade_id": order.id,
                "timestamp": datetime.now(UTC).isoformat(),
            }

            self._trade_log.append(result)
            log.info(f"Trade analysis completed for {order.id}")
            return result

        except Exception as e:
            log.error(f"Trade analysis error: {e}")
            return {"analysis": f"Error: {e}", "source": "error"}

    async def generate_performance_summary(self, trades: list[dict]) -> str:
        """Generate a performance summary from trade history."""
        if not self.ai:
            return "AI unavailable for performance summary."

        try:
            trades_text = "\n".join([
                f"- {t.get('action', '?')} {t.get('symbol', '?')} "
                f"@ {t.get('open_price', 0):.2f} -> {t.get('close_price', 0):.2f} "
                f"P&L: ${t.get('profit', 0):+.2f}"
                for t in trades
            ])

            response = await self.ai.generate(
                f"Analyze this trading performance and provide insights:\n\n"
                f"Trades:\n{trades_text}\n\n"
                f"Provide: win rate analysis, common patterns, areas for improvement.",
                system="You are a trading performance analyst. Be concise and actionable."
            )

            return response.content if not response.error else f"Error: {response.error}"

        except Exception as e:
            log.error(f"Performance summary error: {e}")
            return f"Error: {e}"

    def _format_data(self, market_data: list) -> str:
        if not market_data:
            return "No data"
        lines = []
        for m in market_data:
            lines.append(
                f"{m.timestamp.strftime('%H:%M')} O:{m.open:.2f} H:{m.high:.2f} "
                f"L:{m.low:.2f} C:{m.close:.2f}"
            )
        return "\n".join(lines)

    def _build_analysis_prompt(
        self, order: Order, entry_data: str, exit_data: str
    ) -> str:
        pnl = order.filled_price - order.price if order.action == SignalAction.BUY else order.price - order.filled_price
        pnl = pnl * order.volume * 100

        return (
            f"Analyze this closed trade:\n\n"
            f"Trade Details:\n"
            f"- Action: {order.action.value}\n"
            f"- Market: {order.market}\n"
            f"- Entry: ${order.price:.2f}\n"
            f"- Exit: ${order.filled_price:.2f}\n"
            f"- Volume: {order.volume}\n"
            f"- P&L: ${pnl:+.2f}\n\n"
            f"Market at Entry:\n{entry_data}\n\n"
            f"Market at Exit:\n{exit_data}\n\n"
            f"Provide:\n"
            f"1. Was the entry well-timed?\n"
            f"2. Was the exit optimal?\n"
            f"3. Key lessons learned\n"
            f"4. Score (1-10)"
        )

    @property
    def _system_prompt(self) -> str:
        return (
            "You are an expert XAUUSD gold trade analyst. "
            "Review trades objectively and provide actionable feedback. "
            "Be concise - focus on key insights only."
        )
