"""WebSocket endpoints for real-time data streaming."""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

log = logging.getLogger("xmbot.api.websocket")

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manage WebSocket connections for real-time streaming."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._streaming = False

    async def connect(self, websocket: WebSocket, channel: str) -> None:
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        log.info(f"WebSocket connected to channel: {channel}")

    def disconnect(self, websocket: WebSocket, channel: str) -> None:
        if channel in self.active_connections:
            self.active_connections[channel] = [
                ws for ws in self.active_connections[channel] if ws != websocket
            ]
            if not self.active_connections[channel]:
                del self.active_connections[channel]
        log.info(f"WebSocket disconnected from channel: {channel}")

    async def broadcast(self, channel: str, message: dict) -> None:
        if channel not in self.active_connections:
            return

        dead_connections = []
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)

        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect(ws, channel)

    @property
    def connection_count(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())


manager = ConnectionManager()


@router.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket, symbols: str = "XAUUSD"):
    """WebSocket endpoint for real-time price streaming.

    Query params:
        symbols: Comma-separated list of symbols (default: XAUUSD)
    """
    channel = "prices"
    await manager.connect(websocket, channel)

    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        symbol_list = ["XAUUSD"]

    try:
        # Import here to avoid circular imports
        from ..server import engine_ref

        while True:
            if engine_ref and engine_ref.broker:
                try:
                    positions = await engine_ref.broker.get_positions()
                    account = await engine_ref.broker.get_account()

                    # Get latest prices for requested symbols
                    prices = {}
                    for symbol in symbol_list:
                        market_data = await engine_ref.broker.get_market_data(symbol, "M1", 1)
                        if market_data:
                            latest = market_data[-1]
                            prices[symbol] = {
                                "bid": latest.bid,
                                "ask": latest.ask,
                                "last": latest.close,
                                "timestamp": datetime.now(UTC).isoformat(),
                            }

                    await websocket.send_json({
                        "type": "prices",
                        "data": prices,
                        "account": {
                            "balance": account.balance if account else 0,
                            "equity": account.equity if account else 0,
                        } if account else None,
                        "positions": [
                            {
                                "symbol": p.symbol,
                                "direction": p.direction.value,
                                "volume": p.volume,
                                "unrealized_pnl": p.unrealized_pnl,
                            }
                            for p in positions
                        ],
                        "timestamp": datetime.now(UTC).isoformat(),
                    })
                except Exception as e:
                    log.error(f"Price streaming error: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e),
                    })

            await asyncio.sleep(1)  # Update every second

    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        log.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, channel)


@router.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    """WebSocket endpoint for real-time trade signal streaming."""
    channel = "signals"
    await manager.connect(websocket, channel)

    try:
        from ..server import engine_ref

        while True:
            if engine_ref:
                pending = engine_ref.gate.pending_count
                await websocket.send_json({
                    "type": "status",
                    "data": {
                        "running": engine_ref.running,
                        "paused": engine_ref.paused,
                        "pending_signals": pending,
                        "agents": list(engine_ref.agents.keys()),
                    },
                    "timestamp": datetime.now(UTC).isoformat(),
                })

            await asyncio.sleep(5)  # Update every 5 seconds

    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        log.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, channel)


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status."""
    return {
        "active_connections": manager.connection_count,
        "channels": list(manager.active_connections.keys()),
    }
