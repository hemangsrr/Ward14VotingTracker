#!/bin/bash
# Update WSGI to use droplet settings

set -e

echo "Updating WSGI configuration..."

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WSGI_FILE="$PROJECT_ROOT/BackEnd/voting_tracker/wsgi.py"

# Backup original
cp "$WSGI_FILE" "$WSGI_FILE.backup"

# Update to use droplet settings
cat > "$WSGI_FILE" << 'EOF'
"""
WSGI config for voting_tracker project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "voting_tracker.settings_droplet")

application = get_wsgi_application()
EOF

echo "✓ WSGI updated to use droplet settings"
