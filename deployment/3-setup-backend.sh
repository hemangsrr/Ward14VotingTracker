#!/bin/bash
# Script 3: Set up Django backend with virtual environment

set -e

echo "=========================================="
echo "Setting up Django Backend"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

cd "$BACKEND_DIR"

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn

# Create .env file for production
echo "Creating .env file..."
cat > .env << EOF
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DEBUG=False
ALLOWED_HOSTS=*
POSTGRES_DB=voting_tracker_db
POSTGRES_USER=voting_admin
POSTGRES_PASSWORD=voting_secure_pass
EOF

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser
echo "Creating superuser..."
python manage.py shell << PYEOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
PYEOF

# Initialize app settings
echo "Initializing app settings..."
python manage.py shell << PYEOF
from voters.models import AppSettings
settings = AppSettings.load()
print(f'App settings initialized: Voting enabled = {settings.voting_enabled}')
PYEOF

# Import voters from CSV
echo "Importing voters from CSV files..."
if [ -f "$PROJECT_ROOT/Chuduvalathur Ward List/VotersList_Ward14_en.csv" ] && [ -f "$PROJECT_ROOT/Chuduvalathur Ward List/VotersList_Ward14_ml.csv" ]; then
    python manage.py import_voters \
        --en-file "$PROJECT_ROOT/Chuduvalathur Ward List/VotersList_Ward14_en.csv" \
        --ml-file "$PROJECT_ROOT/Chuduvalathur Ward List/VotersList_Ward14_ml.csv"
    echo "Voter import completed"
else
    echo "Warning: CSV files not found, skipping voter import"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

deactivate

echo ""
echo "=========================================="
echo "✓ Backend setup completed!"
echo "Virtual environment: $BACKEND_DIR/venv"
echo "Superuser: admin / admin123"
echo "=========================================="
