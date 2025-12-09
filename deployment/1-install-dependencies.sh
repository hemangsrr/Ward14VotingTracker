#!/bin/bash
# Script 1: Install all system dependencies

set -e

echo "=========================================="
echo "Installing System Dependencies"
echo "=========================================="

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Python and development tools
echo "Installing Python and build tools..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpq-dev \
    postgresql \
    postgresql-contrib \
    nginx \
    screen \
    git \
    curl

# Install Node.js 18.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo ""
echo "=========================================="
echo "Verifying Installations"
echo "=========================================="
python3 --version
pip3 --version
node --version
npm --version
psql --version
nginx -v

echo ""
echo "=========================================="
echo "✓ All dependencies installed successfully!"
echo "=========================================="
