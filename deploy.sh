#!/bin/bash
# XMBot MVP — VPS Setup Script
# Run this on the VPS to deploy xmbot-mvp

set -euo pipefail

APP_DIR="/xos/services/xmbot"
REPO_URL="https://github.com/xosbot/xmbot-mvp.git"
BRANCH="main"

echo "[$(date)] Starting XMBot MVP deployment..."

# Clone or update repo
if [ -d "$APP_DIR" ]; then
    echo "[$(date)] Updating existing repo..."
    cd "$APP_DIR"
    git pull origin "$BRANCH"
else
    echo "[$(date)] Cloning repo..."
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Create .env if not exists
if [ ! -f .env ]; then
    echo "[$(date)] Creating .env from template..."
    cp .env.example .env
    
    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 16)
    
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    
    echo "[$(date)] .env created — edit it to add API keys"
fi

# Build and start services
echo "[$(date)] Building Docker images..."
docker compose build

echo "[$(date)] Starting services..."
docker compose up -d

# Wait for health checks
echo "[$(date)] Waiting for services to be healthy..."
sleep 10

# Check health
echo "[$(date)] Checking health..."
curl -s http://localhost:8080/health | python3 -m json.tool || echo "Engine not ready yet"

echo "[$(date)] Deployment complete!"
echo ""
echo "Services:"
echo "  Engine API:  http://localhost:8080"
echo "  Web App:     http://localhost:3000"
echo "  Caddy:       http://localhost:80"
echo ""
echo "Next steps:"
echo "  1. Edit .env to add Binance API keys"
echo "  2. Run: docker compose restart engine"
echo "  3. Point DNS to this VPS"
