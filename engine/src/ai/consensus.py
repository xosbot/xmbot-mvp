"""Multi-model consensus for trade validation."""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

from .base import AIProvider, AIResponse

log = logging.getLogger("xmbot.ai.consensus")


@dataclass
class ConsensusResult:
    """Result from multi-model consensus voting."""
    verdict: str  # SAFE, RISKY, SKIP
    confidence: float  # 0.0 - 1.0
    votes: list[dict] = field(default_factory=list)
    reasoning: str = ""
    models_used: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict,
            "confidence": self.confidence,
            "votes": self.votes,
            "reasoning": self.reasoning,
            "models_used": self.models_used,
        }


class ConsensusValidator:
    """Validate trades using multiple AI models and vote on the outcome.

    Queries multiple AI providers in parallel and aggregates their verdicts
    using a weighted voting system based on model confidence.
    """

    def __init__(self, registry, min_votes: int = 2) -> None:
        self.registry = registry
        self.min_votes = min_votes
        self._model_weights: dict[str, float] = {
            "gemini-2.5-flash": 1.0,
            "claude-sonnet-4-20250514": 1.1,
            "gpt-4o": 1.0,
        }

    def set_model_weight(self, model: str, weight: float) -> None:
        """Set voting weight for a specific model."""
        self._model_weights[model] = weight

    async def validate_trade(
        self,
        signal_details: str,
        market_context: str,
        providers: list[str] | None = None,
    ) -> ConsensusResult:
        """Validate a trade using multiple AI models.

        Args:
            signal_details: Trade signal details
            market_context: Current market context
            providers: Specific providers to use (None = all available)

        Returns:
            ConsensusResult with aggregated verdict
        """
        # Select providers
        if providers:
            selected = [self.registry.get(p) for p in providers if self.registry.get(p)]
        else:
            selected = [self.registry.get(p) for p in self.registry.available]

        if not selected:
            return ConsensusResult(
                verdict="SKIP",
                confidence=0.0,
                reasoning="No AI providers available",
            )

        # Query all providers in parallel
        tasks = [
            self._query_provider(provider, signal_details, market_context)
            for provider in selected
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Aggregate votes
        return self._aggregate_votes(results)

    async def _query_provider(
        self,
        provider: AIProvider,
        signal_details: str,
        market_context: str,
    ) -> dict:
        """Query a single AI provider for trade validation."""
        try:
            response = await provider.validate_trade(signal_details, market_context)

            if response.error:
                return {
                    "model": response.model,
                    "verdict": "SKIP",
                    "confidence": 0.0,
                    "reasoning": f"Error: {response.error}",
                    "error": True,
                }

            # Parse verdict from response
            content = response.content.upper()
            if "VERDICT: SAFE" in content:
                verdict = "SAFE"
                confidence = 0.8
            elif "VERDICT: RISKY" in content:
                verdict = "RISKY"
                confidence = 0.8
            else:
                # Try to infer from content
                if any(word in content for word in ["SAFE", "APPROVE", "GOOD", "SOLID"]):
                    verdict = "SAFE"
                    confidence = 0.6
                elif any(word in content for word in ["RISKY", "REJECT", "AVOID", "DANGER"]):
                    verdict = "RISKY"
                    confidence = 0.6
                else:
                    verdict = "SKIP"
                    confidence = 0.3

            # Extract reasoning
            reasoning = response.content[:200]

            return {
                "model": response.model,
                "verdict": verdict,
                "confidence": confidence,
                "reasoning": reasoning,
                "error": False,
            }

        except Exception as e:
            log.error(f"Provider {provider.model} failed: {e}")
            return {
                "model": provider.model,
                "verdict": "SKIP",
                "confidence": 0.0,
                "reasoning": f"Exception: {str(e)}",
                "error": True,
            }

    def _aggregate_votes(self, results: list) -> ConsensusResult:
        """Aggregate votes from multiple providers."""
        valid_votes = [r for r in results if isinstance(r, dict) and not r.get("error")]

        if not valid_votes:
            return ConsensusResult(
                verdict="SKIP",
                confidence=0.0,
                reasoning="All providers failed",
                votes=[r for r in results if isinstance(r, dict)],
            )

        # Calculate weighted scores
        safe_score = 0.0
        risky_score = 0.0
        total_weight = 0.0

        for vote in valid_votes:
            weight = self._model_weights.get(vote["model"], 1.0)
            total_weight += weight

            if vote["verdict"] == "SAFE":
                safe_score += weight * vote["confidence"]
            elif vote["verdict"] == "RISKY":
                risky_score += weight * vote["confidence"]

        # Determine consensus
        if total_weight == 0:
            verdict = "SKIP"
            confidence = 0.0
        elif safe_score > risky_score and safe_score / total_weight > 0.5:
            verdict = "SAFE"
            confidence = safe_score / total_weight
        elif risky_score > safe_score and risky_score / total_weight > 0.5:
            verdict = "RISKY"
            confidence = risky_score / total_weight
        else:
            verdict = "SKIP"
            confidence = 0.5

        # Build reasoning
        models_used = [v["model"] for v in valid_votes]
        reasoning_parts = [v["reasoning"][:100] for v in valid_votes[:3]]
        reasoning = " | ".join(reasoning_parts) if reasoning_parts else "No reasoning available"

        return ConsensusResult(
            verdict=verdict,
            confidence=confidence,
            votes=valid_votes,
            reasoning=reasoning,
            models_used=models_used,
        )
