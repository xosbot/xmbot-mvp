from __future__ import annotations

import logging

import httpx

from ..base import AIProvider, AIResponse

log = logging.getLogger("xmbot.ai.gemini")


class GeminiProvider(AIProvider):
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        super().__init__(model, api_key)
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def generate(self, prompt: str, system: str | None = None) -> AIResponse:
        contents = []
        if system:
            contents.append({"role": "user", "parts": [{"text": system}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {"contents": contents}
        if system:
            payload["system_instruction"] = {"parts": [{"text": system}]}

        return await self._call_api(payload)

    async def chat(self, messages: list[dict]) -> AIResponse:
        contents = []
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})

        payload = {"contents": contents}
        return await self._call_api(payload)

    async def _call_api(self, payload: dict) -> AIResponse:
        url = f"{self.BASE_URL}/{self.model}:generateContent?key={self.api_key}"

        try:
            resp = await self.client.post(url, json=payload)
            result = resp.json()

            candidates = result.get("candidates", [])
            if not candidates:
                return AIResponse(content="", model=self.model, error="No response from Gemini")

            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            usage = result.get("usageMetadata", {})
            tokens = usage.get("candidatesTokenCount", 0) + usage.get("promptTokenCount", 0)

            return AIResponse(content=text, model=self.model, tokens_used=tokens, raw=result)

        except httpx.HTTPStatusError as e:
            log.error(f"Gemini HTTP {e.response.status_code}: {e.response.text}")
            return AIResponse(content="", model=self.model, error=f"HTTP {e.response.status_code}: {e.response.text}")

        except Exception as e:
            log.error(f"Gemini API error: {e}")
            return AIResponse(content="", model=self.model, error=str(e))

    async def analyze_market(
        self, market_data: str, context: str | None = None
    ) -> AIResponse:
        system = (
            "You are XM1 Trader, an expert gold (XAUUSD) market analyst. "
            "Analyze the data and provide: trend direction, key support/resistance levels, "
            "RSI/ADX interpretation, and a clear trade recommendation."
        )
        prompt = f"Market Data (M5):\n{market_data}\n"
        if context:
            prompt += f"\nContext: {context}\n"
        prompt += "\nProvide your analysis as a concise trading report."
        return await self.generate(prompt, system)

    async def validate_trade(
        self, signal_details: str, market_context: str
    ) -> AIResponse:
        system = (
            "You are a risk manager. Given the proposed trade and current market context, "
            "reply with exactly 'VERDICT: SAFE' if the trade is reasonable, "
            "or 'VERDICT: RISKY' if it should be avoided. Then provide a brief reason."
        )
        prompt = f"Proposed Trade:\n{signal_details}\n\nMarket Context:\n{market_context}\n\nDecision:"
        return await self.generate(prompt, system)
