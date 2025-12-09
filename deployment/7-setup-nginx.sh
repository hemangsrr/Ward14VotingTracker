#!/bin/bash
# Script 7: Configure Nginx

set -e

echo "=========================================="
echo "Configuring Nginx"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/voting-tracker << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    # Django static files
    location /static/ {
        alias /home/ubuntu/Ward14VotingTracker/BackEnd/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django media files
    location /media/ {
        alias /home/ubuntu/Ward14VotingTracker/BackEnd/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django API and admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # React frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
    }
}
EOF

# Update the static files path in the nginx config to match actual location
ACTUAL_STATIC_PATH="$BACKEND_DIR/staticfiles"
ACTUAL_MEDIA_PATH="$BACKEND_DIR/media"

sudo sed -i "s|/home/ubuntu/Ward14VotingTracker/BackEnd/staticfiles/|$ACTUAL_STATIC_PATH/|g" /etc/nginx/sites-available/voting-tracker
sudo sed -i "s|/home/ubuntu/Ward14VotingTracker/BackEnd/media/|$ACTUAL_MEDIA_PATH/|g" /etc/nginx/sites-available/voting-tracker

# Enable the site
echo "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/voting-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=========================================="
echo "✓ Nginx configured and started!"
echo "Application accessible on port 80"
echo "=========================================="
