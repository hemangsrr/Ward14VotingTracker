#!/bin/bash
# Fix permissions for Nginx to access static files

set -e

echo "=========================================="
echo "Fixing Permissions for Static Files"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

echo "Backend directory: $BACKEND_DIR"

# Make parent directories readable by Nginx (www-data)
echo "Setting directory permissions..."

# Get the full path components
CURRENT_PATH="$BACKEND_DIR"
while [ "$CURRENT_PATH" != "/" ]; do
    echo "Setting execute permission on: $CURRENT_PATH"
    sudo chmod o+x "$CURRENT_PATH" 2>/dev/null || true
    CURRENT_PATH=$(dirname "$CURRENT_PATH")
done

# Set permissions on static and media directories
echo "Setting permissions on staticfiles..."
sudo chmod -R 755 "$BACKEND_DIR/staticfiles"
sudo chmod -R 755 "$BACKEND_DIR/media" 2>/dev/null || mkdir -p "$BACKEND_DIR/media" && sudo chmod -R 755 "$BACKEND_DIR/media"

# Verify permissions
echo ""
echo "Verifying permissions..."
ls -la "$BACKEND_DIR" | grep -E "staticfiles|media"
ls -la "$BACKEND_DIR/staticfiles/" | head -5

# Test if www-data can read the files
echo ""
echo "Testing Nginx access..."
if sudo -u www-data test -r "$BACKEND_DIR/staticfiles/admin/css/base.css" 2>/dev/null; then
    echo "✓ www-data can read static files"
else
    echo "✗ www-data cannot read static files"
    echo "Attempting alternative fix..."
    
    # Alternative: change ownership to www-data
    sudo chown -R www-data:www-data "$BACKEND_DIR/staticfiles"
    sudo chown -R www-data:www-data "$BACKEND_DIR/media" 2>/dev/null || true
    
    if sudo -u www-data test -r "$BACKEND_DIR/staticfiles/admin/css/base.css" 2>/dev/null; then
        echo "✓ Fixed! www-data can now read static files"
    else
        echo "✗ Still having issues. Manual intervention needed."
    fi
fi

# Reload Nginx
echo ""
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✓ Permissions fixed!"
echo "=========================================="
echo ""
echo "Test static file access:"
echo "curl -I http://localhost/static/admin/css/base.css"
echo ""
