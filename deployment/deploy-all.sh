#!/bin/bash
# Master deployment script - Run all deployment steps

set -e

echo "=========================================="
echo "Ward 14 Voting Tracker - Full Deployment"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Run all deployment scripts in order
echo ""
echo "Step 1/8: Installing dependencies..."
bash "$SCRIPT_DIR/1-install-dependencies.sh"

echo ""
echo "Step 2/8: Installing and setting up PostgreSQL database..."
bash "$SCRIPT_DIR/2-setup-database.sh"

echo ""
echo "Step 3/8: Updating WSGI configuration..."
bash "$SCRIPT_DIR/update-wsgi.sh"

echo ""
echo "Step 4/8: Setting up backend..."
bash "$SCRIPT_DIR/3-setup-backend.sh"

echo ""
echo "Step 5/8: Setting up frontend..."
bash "$SCRIPT_DIR/4-setup-frontend.sh"

echo ""
echo "Step 6/8: Starting backend..."
bash "$SCRIPT_DIR/5-start-backend.sh"

echo ""
echo "Step 7/8: Starting frontend..."
bash "$SCRIPT_DIR/6-start-frontend.sh"

echo ""
echo "Step 8/8: Configuring Nginx..."
bash "$SCRIPT_DIR/7-setup-nginx.sh"

echo ""
echo "=========================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Application is now running!"
echo ""
echo "Access your application:"
echo "  Frontend: http://YOUR_SERVER_IP/"
echo "  Admin: http://YOUR_SERVER_IP/admin/"
echo "  API: http://YOUR_SERVER_IP/api/"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Screen sessions:"
echo "  Backend: screen -r backend"
echo "  Frontend: screen -r frontend"
echo ""
echo "To stop services:"
echo "  screen -S backend -X quit"
echo "  screen -S frontend -X quit"
echo ""
echo "=========================================="
