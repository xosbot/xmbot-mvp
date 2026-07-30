#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "╔═══════════════════════════════════════════════╗"
echo "║  XMBot — Setup                                ║"
echo "╚═══════════════════════════════════════════════╝"

# ── 1. Copy .env if missing ──────────────────────────────────────────────────
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[1/4] Created .env from .env.example — edit it with your keys"
else
    echo "[1/4] .env already exists"
fi

# ── 2. Engine Python venv ────────────────────────────────────────────────────
if [ ! -d engine/.venv ]; then
    echo "[2/4] Creating engine Python virtual environment..."
    cd engine
    python3 -m venv .venv
    .venv/bin/pip install -e ".[ai]" --quiet
    cd "$ROOT"
else
    echo "[2/4] Engine venv already exists"
fi

# ── 3. Web app npm install ───────────────────────────────────────────────────
if [ ! -d xmbot-mvp/node_modules ]; then
    echo "[3/4] Installing web app dependencies..."
    cd xmbot-mvp && npm install && cd "$ROOT"
else
    echo "[3/4] Web app dependencies already installed"
fi

# ── 4. Docker build ──────────────────────────────────────────────────────────
echo "[4/4] Building Docker images..."
docker compose build

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Ready!                                       ║"
echo "║                                               ║"
echo "║  Start:  docker compose up -d                  ║"
echo "║  Web:    http://localhost:3000                 ║"
echo "║  Engine: http://localhost:8080/health          ║"
echo "║  DB:     postgresql://xmbot:xmbot_dev@localhost:5432/xmbot  ║"
echo "║                                               ║"
echo "║  First-time DB setup:                          ║"
echo "║    make db-push                                ║"
echo "║    make seed                                   ║"
echo "╚═══════════════════════════════════════════════╝"
