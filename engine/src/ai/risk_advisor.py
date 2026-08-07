"""AI-powered risk management advisor."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from .base import AIProvider

log = logging.getLogger("xmbot.ai.risk")


@dataclass
class RiskSuggestion:
    """AI-generated risk management suggestion."""
    category: str  # position_sizing, stop_loss, portfolio, timing
    suggestion: str
    priority: str  # high, medium, low
    reasoning: str
    confidence: float
    timestamp: datetime | None = None

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "suggestion": self.suggestion,
            "priority": self.priority,
            "reasoning": self.reasoning,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class RiskAdvisor:
    """AI-powered risk management advisor.

    Analyzes trading patterns and market conditions to provide
    proactive risk management suggestions.
    """

    def __init__(self, ai_provider: AIProvider | None = None) -> None:
        self.ai = ai_provider
        self._suggestions: list[RiskSuggestion] = []
        self._risk_limits: dict = {
            "max_daily_loss": 500.0,
            "max_position_size": 0.5,
            "max_drawdown_percent": 15.0,
            "max_correlated_positions": 3,
        }

    async def analyze_risk(
        self,
        current_positions: list,
        account_balance: float,
        daily_pnl: float,
        recent_trades: list,
        market_data: list | None = None,
    ) -> list[RiskSuggestion]:
        """Analyze current risk exposure and generate suggestions.

        Args:
            current_positions: List of open positions
            account_balance: Current account balance
            daily_pnl: Today's P&L
            recent_trades: Recent trade history
            market_data: Optional market data for context

        Returns:
            List of risk suggestions
        """
        suggestions = []

        # Analyze position concentration
        position_suggestion = await self._analyze_position_concentration(
            current_positions, account_balance
        )
        if position_suggestion:
            suggestions.append(position_suggestion)

        # Analyze daily loss
        loss_suggestion = await self._analyze_daily_loss(daily_pnl, account_balance)
        if loss_suggestion:
            suggestions.append(loss_suggestion)

        # Analyze drawdown
        drawdown_suggestion = await self._analyze_drawdown(
            current_positions, account_balance
        )
        if drawdown_suggestion:
            suggestions.append(drawdown_suggestion)

        # Get AI-powered suggestions if available
        if self.ai:
            ai_suggestions = await self._get_ai_suggestions(
                current_positions, account_balance, daily_pnl,
                recent_trades, market_data
            )
            suggestions.extend(ai_suggestions)

        # Store suggestions
        self._suggestions.extend(suggestions)

        # Keep only last 100 suggestions
        if len(self._suggestions) > 100:
            self._suggestions = self._suggestions[-100:]

        return suggestions

    def update_limits(self, limits: dict) -> None:
        """Update risk limits."""
        self._risk_limits.update(limits)
        log.info(f"Risk limits updated: {self._risk_limits}")

    def get_suggestions(
        self,
        category: str | None = None,
        priority: str | None = None,
    ) -> list[RiskSuggestion]:
        """Get filtered suggestions."""
        suggestions = self._suggestions.copy()

        if category:
            suggestions = [s for s in suggestions if s.category == category]
        if priority:
            suggestions = [s for s in suggestions if s.priority == priority]

        return suggestions

    async def _analyze_position_concentration(
        self,
        positions: list,
        balance: float,
    ) -> RiskSuggestion | None:
        """Analyze position concentration risk."""
        if not positions:
            return None

        # Calculate total exposure
        total_exposure = sum(
            getattr(p, 'volume', 0) * getattr(p, 'entry_price', 0)
            for p in positions
        )

        if balance <= 0:
            return None

        exposure_ratio = total_exposure / balance

        if exposure_ratio > 2.0:
            return RiskSuggestion(
                category="position_sizing",
                suggestion="Reduce overall position exposure",
                priority="high",
                reasoning=f"Total exposure ({exposure_ratio:.1f}x balance) exceeds safe limits",
                confidence=0.9,
                timestamp=datetime.now(UTC),
            )
        elif exposure_ratio > 1.5:
            return RiskSuggestion(
                category="position_sizing",
                suggestion="Monitor position exposure closely",
                priority="medium",
                reasoning=f"Total exposure ({exposure_ratio:.1f}x balance) approaching limits",
                confidence=0.7,
                timestamp=datetime.now(UTC),
            )

        return None

    async def _analyze_daily_loss(
        self,
        daily_pnl: float,
        balance: float,
    ) -> RiskSuggestion | None:
        """Analyze daily loss against limits."""
        if balance <= 0:
            return None

        loss_percent = abs(daily_pnl) / balance * 100 if daily_pnl < 0 else 0

        if loss_percent > self._risk_limits["max_drawdown_percent"]:
            return RiskSuggestion(
                category="portfolio",
                suggestion="Consider stopping trading for the day",
                priority="high",
                reasoning=f"Daily loss ({loss_percent:.1f}%) exceeds max drawdown limit",
                confidence=0.95,
                timestamp=datetime.now(UTC),
            )
        elif loss_percent > self._risk_limits["max_drawdown_percent"] * 0.7:
            return RiskSuggestion(
                category="portfolio",
                suggestion="Reduce position sizes for remaining trades",
                priority="medium",
                reasoning=f"Daily loss ({loss_percent:.1f}%) approaching limit",
                confidence=0.8,
                timestamp=datetime.now(UTC),
            )

        return None

    async def _analyze_drawdown(
        self,
        positions: list,
        balance: float,
    ) -> RiskSuggestion | None:
        """Analyze current drawdown."""
        if not positions or balance <= 0:
            return None

        total_unrealized = sum(
            getattr(p, 'unrealized_pnl', 0) for p in positions
        )

        if total_unrealized < 0:
            drawdown_percent = abs(total_unrealized) / balance * 100
            if drawdown_percent > 10:
                return RiskSuggestion(
                    category="portfolio",
                    suggestion="Review open positions for potential stops",
                    priority="high",
                    reasoning=f"Unrealized drawdown ({drawdown_percent:.1f}%) is significant",
                    confidence=0.85,
                    timestamp=datetime.now(UTC),
                )

        return None

    async def _get_ai_suggestions(
        self,
        positions: list,
        balance: float,
        daily_pnl: float,
        recent_trades: list,
        market_data: list | None,
    ) -> list[RiskSuggestion]:
        """Get AI-powered risk suggestions."""
        if not self.ai:
            return []

        try:
            # Build context
            positions_text = "\n".join([
                f"- {getattr(p, 'symbol', 'N/A')} {getattr(p, 'direction', 'N/A')} "
                f"Volume: {getattr(p, 'volume', 0)} P&L: ${getattr(p, 'unrealized_pnl', 0):+.2f}"
                for p in positions[:5]
            ]) if positions else "No open positions"

            trades_text = "\n".join([
                f"- {t.get('action', 'N/A')} {t.get('symbol', 'N/A')} "
                f"P&L: ${t.get('pnl', 0):+.2f}"
                for t in recent_trades[-5:]
            ]) if recent_trades else "No recent trades"

            system = (
                "You are a risk management advisor. Analyze the trading situation "
                "and provide specific, actionable risk management suggestions. "
                "Be concise and focus on the most important risks."
            )
            prompt = (
                f"Current Situation:\n"
                f"- Account Balance: ${balance:,.2f}\n"
                f"- Daily P&L: ${daily_pnl:+,.2f}\n"
                f"- Open Positions:\n{positions_text}\n"
                f"- Recent Trades:\n{trades_text}\n\n"
                "Provide 1-3 specific risk management suggestions with priorities."
            )

            response = await self.ai.generate(prompt, system)

            if response.error:
                return []

            # Parse suggestions from response
            suggestions = self._parse_suggestions(response.content)
            return suggestions

        except Exception as e:
            log.error(f"AI risk suggestion error: {e}")
            return []

    def _parse_suggestions(self, content: str) -> list[RiskSuggestion]:
        """Parse AI response into risk suggestions."""
        suggestions = []

        # Simple parsing - look for suggestion patterns
        lines = content.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Look for numbered items or bullet points
            if any(line.startswith(prefix) for prefix in ["1.", "2.", "3.", "-", "•"]):
                # Determine priority
                if any(word in line.lower() for word in ["critical", "urgent", "immediately"]):
                    priority = "high"
                elif any(word in line.lower() for word in ["consider", "monitor", "watch"]):
                    priority = "medium"
                else:
                    priority = "low"

                # Determine category
                if any(word in line.lower() for word in ["position", "size", "lot"]):
                    category = "position_sizing"
                elif any(word in line.lower() for word in ["stop", "loss", "exit"]):
                    category = "stop_loss"
                elif any(word in line.lower() for word in ["timing", "session", "market"]):
                    category = "timing"
                else:
                    category = "portfolio"

                suggestions.append(RiskSuggestion(
                    category=category,
                    suggestion=line.lstrip("1234567890.-• "),
                    priority=priority,
                    reasoning="AI recommendation",
                    confidence=0.7,
                    timestamp=datetime.now(UTC),
                ))

        return suggestions[:3]  # Limit to 3 suggestions
