from __future__ import annotations

import logging
from typing import Optional

import httpx

from ..base import AIProvider, AIResponse


log = logging.getLogger("xmbot.ai.claude")


class ClaudeProvider(AIProvider):
    """
    Anthropic Claude AI provider.

    Uses the Anthropic API for market analysis, trade validation, and chat.
    """

    BASE_URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514") -> None:
        super().__init__(model, api_key)

    async def generate(self, prompt: str, system: Optional[str] = None) -> AIResponse:
        messages = [{"role": "user", "content": prompt}]
        return await self._call_api(messages, system)

    async def chat(self, messages: list[dict]) -> AIResponse:
        formatted = []
        for msg in messages:
            formatted.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })
        return await self._call_api(formatted)

    async def _call_api(self, messages: list[dict], system: Optional[str] = None) -> AIResponse:
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": messages,
        }
        if system:
            payload["system"] = system

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(self.BASE_URL, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()

            content = result.get("content", [{}])[0].get("text", "")
            usage = result.get("usage", {})
            tokens = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)

            return AIResponse(content=content, model=self.model, tokens_used=tokens, raw=result)

        except Exception as e:
            log.error(f"Claude API error: {e}")
            return AIResponse(content="", model=self.model, error=str(e))
