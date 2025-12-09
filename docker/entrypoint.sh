#!/bin/bash
set -e

echo "=========================================="
echo "Ward 14 Voting Tracker - Starting Services"
echo "=========================================="

# Find PostgreSQL version and binaries
PG_VERSION=$(ls /usr/lib/postgresql/ | head -n 1)
PG_BIN="/usr/lib/postgresql/${PG_VERSION}/bin"
echo "Detected PostgreSQL version: ${PG_VERSION}"

# Initialize PostgreSQL if not already initialized
if [ ! -d "/var/lib/postgresql/data/base" ]; then
    echo "Initializing PostgreSQL database..."
    mkdir -p /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql
    su - postgres -c "${PG_BIN}/initdb -D /var/lib/postgresql/data"
    
    # Start PostgreSQL temporarily to create database
    su - postgres -c "${PG_BIN}/pg_ctl -D /var/lib/postgresql/data -l /tmp/postgres.log start"
    
    # Wait for PostgreSQL to start
    echo "Waiting for PostgreSQL to start..."
    sleep 5
    
    # Create database and user
    echo "Creating database and user..."
    su - postgres -c "psql -c \"CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';\""
    su - postgres -c "psql -c \"CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};\""
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};\""
    
    # Stop PostgreSQL
    su - postgres -c "${PG_BIN}/pg_ctl -D /var/lib/postgresql/data stop"
    
    echo "PostgreSQL initialized successfully"
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "${PG_BIN}/pg_ctl -D /var/lib/postgresql/data -l /tmp/postgres.log start"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until su - postgres -c "psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c 'SELECT 1'" > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is ready"

# Run Django migrations
echo "Running Django migrations..."
cd /app/backend
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "Checking for superuser..."
python manage.py shell << EOF
from voters.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
EOF

# Create AppSettings if it doesn't exist
echo "Initializing app settings..."
python manage.py shell << EOF
from voters.models import AppSettings
settings = AppSettings.load()
print(f'App settings initialized: Voting enabled = {settings.voting_enabled}')
EOF

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Stop PostgreSQL (supervisor will restart it)
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data stop"

echo "=========================================="
echo "Starting all services with Supervisor..."
echo "=========================================="

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
