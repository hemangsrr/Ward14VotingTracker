#!/bin/bash
# Script 6: Start React frontend in a screen session

set -e

echo "=========================================="
echo "Starting React Frontend"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/Frontend"

# Kill existing frontend screen if it exists
if screen -list | grep -q "frontend"; then
    echo "Stopping existing frontend screen..."
    screen -S frontend -X quit || true
fi

# Start frontend in screen
echo "Starting frontend in screen session 'frontend'..."
screen -dmS frontend bash -c "
    cd $FRONTEND_DIR
    npm run preview -- --host 127.0.0.1 --port 5173
"

# Wait a moment for the server to start
sleep 2

# Check if screen is running
if screen -list | grep -q "frontend"; then
    echo ""
    echo "=========================================="
    echo "✓ Frontend started successfully!"
    echo "Screen session: frontend"
    echo "Running on: http://127.0.0.1:5173"
    echo ""
    echo "To view logs: screen -r frontend"
    echo "To detach: Press Ctrl+A then D"
    echo "To stop: screen -S frontend -X quit"
    echo "=========================================="
else
    echo "ERROR: Failed to start frontend"
    exit 1
fi
