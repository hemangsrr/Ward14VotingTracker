#!/bin/bash
# Script 5: Start Django backend in a screen session

set -e

echo "=========================================="
echo "Starting Django Backend"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

# Kill existing backend screen if it exists
if screen -list | grep -q "backend"; then
    echo "Stopping existing backend screen..."
    screen -S backend -X quit || true
fi

# Start backend in screen
echo "Starting backend in screen session 'backend'..."
screen -dmS backend bash -c "
    cd $BACKEND_DIR
    source venv/bin/activate
    gunicorn voting_tracker.wsgi:application \
        --bind 127.0.0.1:8000 \
        --workers 3 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        --log-level info
"

# Wait a moment for the server to start
sleep 2

# Check if screen is running
if screen -list | grep -q "backend"; then
    echo ""
    echo "=========================================="
    echo "✓ Backend started successfully!"
    echo "Screen session: backend"
    echo "Running on: http://127.0.0.1:8000"
    echo ""
    echo "To view logs: screen -r backend"
    echo "To detach: Press Ctrl+A then D"
    echo "To stop: screen -S backend -X quit"
    echo "=========================================="
else
    echo "ERROR: Failed to start backend"
    exit 1
fi
