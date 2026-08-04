from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable

import httpx

from ..core.types import Signal, SignalDecision

log = logging.getLogger("xmbot.telegram")

SignalHandler = Callable[[str, SignalDecision], None]
StatusProvider = Callable[[], Awaitable[dict]]


class TelegramBot:
    def __init__(self, token: str, chat_id: str) -> None:
        self.token = token
        self.chat_id = chat_id
        self._offset = 0
        self._running = False
        self._decision_handlers: dict[str, list[SignalHandler]] = {}
        self._default_handler: SignalHandler | None = None
        self._pending_callbacks: dict[str, str] = {}
        self._status_provider: StatusProvider | None = None
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(15.0))
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    def on_decision(self, signal_id: str, handler: SignalHandler) -> None:
        self._decision_handlers.setdefault(signal_id, []).append(handler)

    def set_default_handler(self, handler: SignalHandler) -> None:
        self._default_handler = handler

    def set_status_provider(self, provider: StatusProvider) -> None:
        """Provider is called on /status to report real engine state instead
        of a hardcoded string."""
        self._status_provider = provider

    async def send_message(
        self,
        text: str,
        buttons: list[list[dict]] | None = None,
        parse_mode: str = "Markdown",
    ) -> bool:
        if not self.token:
            return False

        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        data = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if buttons:
            data["reply_markup"] = json.dumps({"inline_keyboard": buttons})

        try:
            resp = await self.client.post(url, json=data)
            return resp.is_success
        except Exception as e:
            log.error(f"Telegram send error: {e}")
            return False

    async def send_signal(
        self, signal: Signal, user_message: str = ""
    ) -> None:
        # No "Modify" button: there's no follow-up flow to collect a new
        # price/SL from a Telegram reply, so it would silently behave like
        # Approve — worse than not offering the control at all.
        buttons = [
            [
                {"text": "✅ Approve", "callback_data": f"approve_{signal.id}"},
                {"text": "❌ Reject", "callback_data": f"reject_{signal.id}"},
            ],
        ]

        message = user_message or (
            f"📊 *{signal.agent} Trade Signal*\n"
            f"────────────────\n"
            f"*Action:* {signal.action.value} {signal.market}\n"
            f"*Entry:* ${signal.entry_price:.2f}\n"
            f"*SL:* ${signal.stop_loss:.2f} (${signal.risk_amount:.2f} risk)\n"
            + (f"*TP:* ${signal.take_profit:.2f}\n" if signal.take_profit else "")
            + f"*Confidence:* {signal.confidence:.0%}\n"
              f"*Reason:* {signal.reason}\n"
              f"────────────────"
        )

        await self.send_message(message, buttons)

    async def send_alert(self, text: str) -> None:
        await self.send_message(f"⚠️ *Alert*\n{text}")

    async def send_status(self, status_text: str) -> None:
        await self.send_message(f"📡 *Bot Status*\n{status_text}")

    async def start_polling(self, timeout: int = 30) -> None:
        self._running = True
        # getUpdates blocks for `timeout` seconds on Telegram's side, so our
        # client read timeout must be longer than that to avoid ReadTimeout.
        poll_timeout = httpx.Timeout(timeout + 10.0, connect=10.0)
        while self._running:
            try:
                url = f"https://api.telegram.org/bot{self.token}/getUpdates?offset={self._offset}&timeout={timeout}"
                resp = await self.client.get(url, timeout=poll_timeout)
                if not resp.is_success:
                    log.error(f"Polling HTTP {resp.status_code}")
                    await asyncio.sleep(5)
                    continue

                updates = resp.json()
                for update in updates.get("result", []):
                    self._offset = update["update_id"] + 1
                    self._process_update(update)

            except asyncio.CancelledError:
                break
            except Exception as e:
                log.error(f"Polling error: {type(e).__name__}: {e}")
                await asyncio.sleep(5)

    def stop(self) -> None:
        self._running = False

    def _is_authorized(self, sender_id: str) -> bool:
        """Fail closed: only the configured owner chat may issue commands or
        approve/reject signals — checked against the sender, not the chat,
        so this still holds if the bot is ever added to a group."""
        return bool(self.chat_id) and sender_id == str(self.chat_id)

    def _process_update(self, update: dict) -> None:
        if "callback_query" in update:
            self._handle_callback(update["callback_query"])
        elif "message" in update:
            self._handle_message(update["message"])

    def _handle_callback(self, query: dict) -> None:
        sender_id = str(query.get("from", {}).get("id", ""))
        if not self._is_authorized(sender_id):
            log.warning(f"Ignoring Telegram callback from unauthorized sender {sender_id}")
            return

        data = query.get("data", "")
        signal_id = data.split("_", 1)[1] if "_" in data else ""

        if data.startswith("approve_"):
            decision = SignalDecision.APPROVED
        elif data.startswith("reject_"):
            decision = SignalDecision.REJECTED
        elif data.startswith("modify_"):
            decision = SignalDecision.MODIFIED
        else:
            return

        handlers = self._decision_handlers.get(signal_id, [])
        for handler in handlers:
            try:
                handler(signal_id, decision)
            except Exception as e:
                log.error(f"Decision handler error: {e}")

        if self._default_handler:
            try:
                self._default_handler(signal_id, decision)
            except Exception as e:
                log.error(f"Default handler error: {e}")

    def _handle_message(self, message: dict) -> None:
        text = message.get("text", "").strip()
        chat_id = str(message.get("chat", {}).get("id", ""))
        sender_id = str(message.get("from", {}).get("id", ""))

        if not self._is_authorized(sender_id):
            return

        if not text.startswith("/"):
            return

        command = text.split()[0].lower()

        if command == "/start":
            asyncio.create_task(self._cmd_start(chat_id))
        elif command == "/status":
            asyncio.create_task(self._cmd_status(chat_id))
        elif command == "/help":
            asyncio.create_task(self._cmd_help(chat_id))

    async def _cmd_start(self, chat_id: str) -> None:
        welcome = (
            "🤖 *Welcome to XMBot*\n"
            "────────────────\n"
            "I am your trading assistant for XAUUSD.\n\n"
            "*Commands:*\n"
            "• /status — Check bot status\n"
            "• /help — Show this help message\n\n"
            "I will send you trade signals with approve/reject buttons.\n"
            "────────────────"
        )
        await self.send_message(welcome)

    async def _cmd_status(self, chat_id: str) -> None:
        if not self._status_provider:
            await self.send_message(
                "📡 *Bot Status*\n────────────────\nStatus unavailable\n────────────────"
            )
            return

        try:
            data = await self._status_provider()
        except Exception as e:
            log.error(f"Status provider error: {e}")
            await self.send_message("⚠️ Failed to fetch engine status.")
            return

        engine_state = "Running" if data.get("running") else "Stopped"
        if data.get("paused"):
            engine_state += " (paused)"

        status = (
            "📡 *Bot Status*\n"
            "────────────────\n"
            f"*Engine:* {engine_state}\n"
            f"*Broker:* {data.get('broker', 'unknown')} "
            f"({'connected' if data.get('broker_connected') else 'disconnected'})\n"
            f"*Open Positions:* {data.get('open_positions', 0)}\n"
            f"*Pending Signals:* {data.get('pending_signals', 0)}\n"
            "────────────────"
        )
        await self.send_message(status)

    async def _cmd_help(self, chat_id: str) -> None:
        help_text = (
            "❓ *Help*\n"
            "────────────────\n"
            "*Commands:*\n"
            "• /start — Welcome message\n"
            "• /status — Check bot status\n"
            "• /help — Show this help\n\n"
            "*Trade Signals:*\n"
            "When a trade signal is detected, you will receive a message with approve/reject buttons.\n"
            "Tap ✅ to approve or ❌ to reject the trade.\n"
            "────────────────"
        )
        await self.send_message(help_text)
