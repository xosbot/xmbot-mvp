#!/bin/bash
# XMBot Production Deployment Script
# Run this on your VPS after cloning the repo

set -e

echo "🚀 XMBot Production Deployment"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please copy .env.production to .env and configure it:"
    echo "  cp .env.production .env"
    echo "  nano .env"
    exit 1
fi

# Check if required vars are set
source .env

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured${NC}"
    echo "Please edit .env and set your database URL"
    exit 1
fi

if [ -z "$TELEGRAM_TOKEN" ] || [ "$TELEGRAM_TOKEN" = "YOUR_BOT_TOKEN_FROM_BOTFATHER" ]; then
    echo -e "${YELLOW}⚠️  Warning: TELEGRAM_TOKEN not set. Telegram alerts will be disabled.${NC}"
fi

echo -e "${GREEN}✓ Configuration validated${NC}"

# Stop existing containers
echo ""
echo "📦 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start services
echo ""
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo ""
echo "🏥 Checking service health..."

# Engine health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Engine: Healthy${NC}"
else
    echo -e "${RED}✗ Engine: Unhealthy${NC}"
    echo "Checking logs..."
    docker-compose logs --tail=20 engine
fi

# Frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: Healthy${NC}"
else
    echo -e "${RED}✗ Frontend: Unhealthy${NC}"
    echo "Checking logs..."
    docker-compose logs --tail=20 web
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your app is live at: https://xmbot.online"
echo ""
echo "📊 Useful commands:"
echo "  docker-compose logs -f          # View all logs"
echo "  docker-compose logs -f engine   # View engine logs"
echo "  docker-compose restart          # Restart all services"
echo "  docker-compose down             # Stop all services"
echo ""
echo "📝 Next steps:"
echo "  1. Open https://xmbot.online"
echo "  2. Create an account"
echo "  3. Connect your Telegram bot"
echo "  4. Start with paper trading"
echo ""