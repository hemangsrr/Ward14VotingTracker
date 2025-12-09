#!/bin/bash
# Stop all services

set -e

echo "=========================================="
echo "Stopping All Services"
echo "=========================================="

# Stop backend screen
if screen -list | grep -q "backend"; then
    echo "Stopping backend..."
    screen -S backend -X quit
    echo "✓ Backend stopped"
else
    echo "Backend not running"
fi

# Stop frontend screen
if screen -list | grep -q "frontend"; then
    echo "Stopping frontend..."
    screen -S frontend -X quit
    echo "✓ Frontend stopped"
else
    echo "Frontend not running"
fi

echo ""
echo "=========================================="
echo "✓ All services stopped"
echo "=========================================="
echo ""
echo "Nginx is still running. To stop Nginx:"
echo "  sudo systemctl stop nginx"
echo ""
