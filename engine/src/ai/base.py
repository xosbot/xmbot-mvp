from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

log = logging.getLogger("xmbot.ai")


@dataclass
class AIResponse:
    content: str
    model: str
    tokens_used: int = 0
    error: str | None = None
    raw: dict | None = None


class AIProvider(ABC):
    def __init__(self, model: str, api_key: str) -> None:
        self.model = model
        self.api_key = api_key

    @abstractmethod
    async def generate(self, prompt: str, system: str | None = None) -> AIResponse:
        ...

    @abstractmethod
    async def chat(self, messages: list[dict]) -> AIResponse:
        ...

    async def analyze_market(
        self, market_data: str, context: str | None = None
    ) -> AIResponse:
        system = "You are a professional market analyst. Analyze the data and provide clear, actionable insights."
        prompt = f"Market Data:\n{market_data}\n"
        if context:
            prompt += f"\nContext: {context}\n"
        prompt += "\nProvide: trend direction, key levels, risk assessment, and trade recommendation."
        return await self.generate(prompt, system)

    async def validate_trade(
        self, signal_details: str, market_context: str
    ) -> AIResponse:
        system = "You are a risk manager. Validate or reject the proposed trade based on market conditions."
        prompt = f"Proposed Trade:\n{signal_details}\n\nMarket Context:\n{market_context}\n\nDecision:"
        return await self.generate(prompt, system)

    async def generate_report(
        self, market: str, period: str, data: str
    ) -> AIResponse:
        system = "You are a research analyst. Generate a concise market report."
        prompt = f"Market: {market}\nPeriod: {period}\nData:\n{data}\n\nReport:"
        return await self.generate(prompt, system)
