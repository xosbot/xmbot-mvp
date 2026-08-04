"""Natural language trade journal using AI."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime

from .base import AIProvider, AIResponse

log = logging.getLogger("xmbot.ai.journal")


@dataclass
class JournalEntry:
    """A single trade journal entry."""
    trade_id: str
    symbol: str
    action: str
    entry_price: float
    exit_price: float | None = None
    volume: float = 0.0
    pnl: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    ai_analysis: str = ""
    lessons_learned: str = ""
    emotional_state: str = ""
    market_conditions: str = ""
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "trade_id": self.trade_id,
            "symbol": self.symbol,
            "action": self.action,
            "entry_price": self.entry_price,
            "exit_price": self.exit_price,
            "volume": self.volume,
            "pnl": self.pnl,
            "timestamp": self.timestamp.isoformat(),
            "ai_analysis": self.ai_analysis,
            "lessons_learned": self.lessons_learned,
            "emotional_state": self.emotional_state,
            "market_conditions": self.market_conditions,
            "tags": self.tags,
        }


class TradeJournal:
    """AI-powered natural language trade journal.

    Records trades and generates insights using AI analysis.
    Provides learning opportunities and pattern recognition.
    """

    def __init__(self, ai_provider: AIProvider | None = None) -> None:
        self.ai = ai_provider
        self._entries: list[JournalEntry] = []
        self._insights: list[dict] = []

    async def record_trade(
        self,
        trade_id: str,
        symbol: str,
        action: str,
        entry_price: float,
        exit_price: float | None = None,
        volume: float = 0.0,
        market_data: list | None = None,
    ) -> JournalEntry:
        """Record a new trade and generate AI analysis."""
        pnl = 0.0
        if exit_price is not None:
            if action.upper() == "BUY":
                pnl = (exit_price - entry_price) * volume * 100
            else:
                pnl = (entry_price - exit_price) * volume * 100

        entry = JournalEntry(
            trade_id=trade_id,
            symbol=symbol,
            action=action,
            entry_price=entry_price,
            exit_price=exit_price,
            volume=volume,
            pnl=pnl,
        )

        # Generate AI analysis if available
        if self.ai and market_data:
            analysis = await self._analyze_trade(entry, market_data)
            entry.ai_analysis = analysis.get("analysis", "")
            entry.lessons_learned = analysis.get("lessons", "")
            entry.market_conditions = analysis.get("conditions", "")

        self._entries.append(entry)
        log.info(f"Journal: Recorded trade {trade_id} ({action} {symbol})")

        return entry

    async def generate_daily_summary(self) -> str:
        """Generate a daily trading summary using AI."""
        if not self.ai:
            return self._generate_basic_summary()

        today = datetime.now(UTC).date()
        today_entries = [
            e for e in self._entries
            if e.timestamp.date() == today
        ]

        if not today_entries:
            return "No trades recorded today."

        trades_text = "\n".join([
            f"- {e.action} {e.symbol} @ {e.entry_price:.2f} -> {e.exit_price or 'OPEN':.2f} "
            f"P&L: ${e.pnl:+.2f}"
            for e in today_entries
        ])

        total_pnl = sum(e.pnl for e in today_entries)
        winning = sum(1 for e in today_entries if e.pnl > 0)
        losing = sum(1 for e in today_entries if e.pnl < 0)

        system = (
            "You are a trading performance analyst. Generate a concise daily summary "
            "with key insights and learning opportunities."
        )
        prompt = (
            f"Today's Trades:\n{trades_text}\n\n"
            f"Summary:\n- Total P&L: ${total_pnl:+.2f}\n"
            f"- Winning: {winning}, Losing: {losing}\n\n"
            "Provide: performance highlights, areas for improvement, and tomorrow's focus."
        )

        response = await self.ai.generate(prompt, system)

        if response.error:
            return self._generate_basic_summary()

        return response.content

    async def generate_weekly_review(self) -> str:
        """Generate a weekly performance review."""
        if not self.ai:
            return self._generate_basic_summary()

        week_entries = [
            e for e in self._entries
            if (datetime.now(UTC) - e.timestamp).days <= 7
        ]

        if not week_entries:
            return "No trades recorded this week."

        trades_text = "\n".join([
            f"- {e.timestamp.strftime('%m/%d')} {e.action} {e.symbol} "
            f"@ {e.entry_price:.2f} P&L: ${e.pnl:+.2f}"
            for e in week_entries
        ])

        total_pnl = sum(e.pnl for e in week_entries)
        winning = sum(1 for e in week_entries if e.pnl > 0)
        win_rate = (winning / len(week_entries) * 100) if week_entries else 0

        system = (
            "You are a trading performance analyst. Generate a comprehensive weekly review "
            "with patterns, strengths, and areas for improvement."
        )
        prompt = (
            f"Weekly Trades:\n{trades_text}\n\n"
            f"Weekly Stats:\n- Total P&L: ${total_pnl:+.2f}\n"
            f"- Win Rate: {win_rate:.1f}%\n"
            f"- Total Trades: {len(week_entries)}\n\n"
            "Provide: weekly performance analysis, pattern recognition, "
            "strategy effectiveness, and recommendations for next week."
        )

        response = await self.ai.generate(prompt, system)

        if response.error:
            return self._generate_basic_summary()

        return response.content

    def get_entries(
        self,
        symbol: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[JournalEntry]:
        """Get journal entries with optional filters."""
        entries = self._entries.copy()

        if symbol:
            entries = [e for e in entries if e.symbol == symbol]
        if start_date:
            entries = [e for e in entries if e.timestamp >= start_date]
        if end_date:
            entries = [e for e in entries if e.timestamp <= end_date]

        return entries

    def get_stats(self) -> dict:
        """Get aggregate trading statistics."""
        if not self._entries:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0.0,
                "total_pnl": 0.0,
                "avg_pnl": 0.0,
                "best_trade": 0.0,
                "worst_trade": 0.0,
            }

        winning = [e for e in self._entries if e.pnl > 0]
        losing = [e for e in self._entries if e.pnl < 0]
        pnls = [e.pnl for e in self._entries]

        return {
            "total_trades": len(self._entries),
            "winning_trades": len(winning),
            "losing_trades": len(losing),
            "win_rate": len(winning) / len(self._entries) * 100,
            "total_pnl": sum(pnls),
            "avg_pnl": sum(pnls) / len(pnls),
            "best_trade": max(pnls) if pnls else 0,
            "worst_trade": min(pnls) if pnls else 0,
        }

    async def _analyze_trade(self, entry: JournalEntry, market_data: list) -> dict:
        """Analyze a trade using AI."""
        try:
            data_summary = self._format_data(market_data[-20:])

            system = (
                "You are a trading mentor. Analyze this trade and provide insights "
                "for improvement. Be specific and actionable."
            )
            prompt = (
                f"Trade Analysis:\n"
                f"- Action: {entry.action}\n"
                f"- Symbol: {entry.symbol}\n"
                f"- Entry: ${entry.entry_price:.2f}\n"
                f"- Exit: ${entry.exit_price or 'OPEN'}\n"
                f"- P&L: ${entry.pnl:+.2f}\n\n"
                f"Market Data:\n{data_summary}\n\n"
                "Provide:\n"
                "1. Trade analysis (what went right/wrong)\n"
                "2. Key lessons learned\n"
                "3. Market conditions during trade"
            )

            response = await self.ai.generate(prompt, system)

            if response.error:
                return {"analysis": "", "lessons": "", "conditions": ""}

            return {
                "analysis": response.content[:500],
                "lessons": response.content[:300],
                "conditions": "AI analyzed",
            }

        except Exception as e:
            log.error(f"Trade analysis error: {e}")
            return {"analysis": "", "lessons": "", "conditions": ""}

    def _format_data(self, market_data: list) -> str:
        """Format market data for analysis."""
        if not market_data:
            return "No data"

        lines = []
        for m in market_data:
            lines.append(
                f"{m.timestamp.strftime('%H:%M')} O:{m.open:.2f} H:{m.high:.2f} "
                f"L:{m.low:.2f} C:{m.close:.2f}"
            )
        return "\n".join(lines)

    def _generate_basic_summary(self) -> str:
        """Generate basic summary without AI."""
        stats = self.get_stats()
        return (
            f"Trading Summary:\n"
            f"- Total Trades: {stats['total_trades']}\n"
            f"- Win Rate: {stats['win_rate']:.1f}%\n"
            f"- Total P&L: ${stats['total_pnl']:+.2f}\n"
            f"- Best Trade: ${stats['best_trade']:+.2f}\n"
            f"- Worst Trade: ${stats['worst_trade']:+.2f}"
        )
