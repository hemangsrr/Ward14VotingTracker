#!/bin/bash
# Script 4: Set up React frontend

set -e

echo "=========================================="
echo "Setting up React Frontend"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/Frontend"

cd "$FRONTEND_DIR"

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Build the frontend
echo "Building frontend for production..."
npm run build

echo ""
echo "=========================================="
echo "✓ Frontend setup completed!"
echo "Build output: $FRONTEND_DIR/dist"
echo "=========================================="
