#!/bin/bash
# Production startup for XMBot Engine
# Sets default env vars, validates config, starts with auto-restart

set -euo pipefail

APP_NAME="xmbot-engine"
MAX_RESTARTS=3
RESTART_DELAY=5
PID_FILE="./data/engine.pid"
LOG_FILE="./data/engine.log"

# Source .env if present
if [ -f .env ]; then
    echo "[$(date)] Sourcing .env file"
    set -a
    . .env
    set +a
fi

# Default DATA_DIR
DATA_DIR="${DATA_DIR:-./data}"
mkdir -p "$DATA_DIR"

# Validate critical env vars in production
if [ "${XMBOT_ENV:-}" = "production" ]; then
    REQUIRED_VARS=(
        "TELEGRAM_TOKEN"
    )
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var:-}" ]; then
            echo "[ERROR] Production requires: $var"
            exit 1
        fi
    done
fi

# Validate Python deps
echo "[$(date)] Validating Python dependencies"
python -c "import fastapi, uvicorn, httpx, pydantic, sqlalchemy, sentry_sdk; print('All dependencies OK')" 2>&1 || {
    echo "[ERROR] Missing Python dependencies. Run: pip install -r requirements.txt"
    exit 1
}

cleanup() {
    echo "[$(date)] Shutting down $APP_NAME gracefully..."
    if [ -f "$PID_FILE" ]; then
        kill -TERM "$(cat "$PID_FILE")" 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT

restart_count=0
while [ $restart_count -le $MAX_RESTARTS ]; do
    echo "[$(date)] Starting $APP_NAME (attempt $((restart_count + 1)))"
    echo $$ > "$PID_FILE"

    python src/main.py "$@" 2>&1 | tee -a "$LOG_FILE"
    exit_code=${PIPESTATUS[0]}

    if [ $exit_code -eq 0 ]; then
        echo "[$(date)] $APP_NAME exited normally"
        break
    fi

    restart_count=$((restart_count + 1))
    if [ $restart_count -le $MAX_RESTARTS ]; then
        echo "[$(date)] $APP_NAME crashed (exit $exit_code). Restarting in ${RESTART_DELAY}s..."
        sleep "$RESTART_DELAY"
    else
        echo "[$(date)] $APP_NAME crashed $MAX_RESTARTS times. Giving up."
        exit 1
    fi
done
