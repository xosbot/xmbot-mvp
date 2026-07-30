#!/bin/bash
# VPS Setup Script for XMBot
# Run this on a fresh Ubuntu 22.04 server

set -e

echo "🔧 XMBot VPS Setup"
echo "=================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Update system
echo ""
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo ""
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Docker Compose
echo ""
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Install Git
echo ""
echo "📦 Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi

# Configure firewall
echo ""
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

# Create app directory
echo ""
echo "📁 Creating app directory..."
sudo mkdir -p /opt/xmbot
sudo chown $USER:$USER /opt/xmbot
echo -e "${GREEN}✓ Directory created at /opt/xmbot${NC}"

echo ""
echo "================================"
echo -e "${GREEN}✅ VPS setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Clone the repository:"
echo "     cd /opt/xmbot"
echo "     git clone <your-repo-url> ."
echo ""
echo "  2. Configure environment:"
echo "     cp .env.production .env"
echo "     nano .env"
echo ""
echo "  3. Deploy:"
echo "     ./deploy.sh"
echo ""
echo "  4. Point your domain (xmbot.online) to this server's IP"
echo ""