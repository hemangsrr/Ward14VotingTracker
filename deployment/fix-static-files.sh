#!/bin/bash
# Fix static files - recollect and update Nginx configuration

set -e

echo "=========================================="
echo "Fixing Static Files"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

cd "$BACKEND_DIR"

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Clear existing static files
echo "Clearing existing static files..."
rm -rf staticfiles/*

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify static files were collected
if [ -d "staticfiles/admin" ]; then
    echo "✓ Admin static files collected"
    ls -la staticfiles/admin/ | head -10
else
    echo "✗ ERROR: Admin static files not found!"
    exit 1
fi

# Set proper permissions
echo "Setting permissions..."
chmod -R 755 staticfiles/
chmod -R 755 media/ 2>/dev/null || mkdir -p media/ && chmod -R 755 media/

deactivate

# Update Nginx configuration with correct paths
echo "Updating Nginx configuration..."
ACTUAL_STATIC_PATH="$BACKEND_DIR/staticfiles/"
ACTUAL_MEDIA_PATH="$BACKEND_DIR/media/"

# Check if Nginx config exists
if [ -f /etc/nginx/sites-available/voting-tracker ]; then
    # Backup current config
    sudo cp /etc/nginx/sites-available/voting-tracker /etc/nginx/sites-available/voting-tracker.backup
    
    # Update paths (handle both placeholder and old paths)
    sudo sed -i "s|alias .*/staticfiles/;|alias $ACTUAL_STATIC_PATH;|g" /etc/nginx/sites-available/voting-tracker
    sudo sed -i "s|alias .*/media/;|alias $ACTUAL_MEDIA_PATH;|g" /etc/nginx/sites-available/voting-tracker
    
    echo "✓ Nginx configuration updated"
    echo "Static path: $ACTUAL_STATIC_PATH"
    echo "Media path: $ACTUAL_MEDIA_PATH"
else
    echo "⚠ Nginx config not found, run ./7-setup-nginx.sh"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✓ Static files fixed!"
echo "=========================================="
echo ""
echo "Static files location: $BACKEND_DIR/staticfiles/"
echo "Admin CSS should now load properly"
echo ""
echo "Test by visiting: http://YOUR_SERVER_IP/admin/"
echo ""
