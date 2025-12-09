#!/bin/bash
# Script 2: Install and set up PostgreSQL database

set -e

echo "=========================================="
echo "Installing and Setting up PostgreSQL"
echo "=========================================="

# Check if PostgreSQL is already installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    echo "✓ PostgreSQL installed"
else
    echo "✓ PostgreSQL already installed"
fi

# Start PostgreSQL service
echo "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to be ready
sleep 2

# Check PostgreSQL version
echo "PostgreSQL version:"
psql --version

# Create database and user (drop if exists to avoid errors on re-run)
echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS voting_tracker_db;
DROP USER IF EXISTS voting_admin;

-- Create new database and user
CREATE DATABASE voting_tracker_db;
CREATE USER voting_admin WITH PASSWORD 'voting_secure_pass';
ALTER ROLE voting_admin SET client_encoding TO 'utf8';
ALTER ROLE voting_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE voting_admin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE voting_tracker_db TO voting_admin;

-- Grant schema permissions for PostgreSQL 15+
\c voting_tracker_db
GRANT ALL ON SCHEMA public TO voting_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voting_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voting_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO voting_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO voting_admin;
\q
EOF

# Configure PostgreSQL to allow local connections
echo "Configuring PostgreSQL authentication..."
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA_FILE="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

if [ -f "$PG_HBA_FILE" ]; then
    # Backup original
    sudo cp "$PG_HBA_FILE" "$PG_HBA_FILE.backup"
    
    # Ensure local connections are allowed
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/g' "$PG_HBA_FILE"
    
    # Reload PostgreSQL
    sudo systemctl reload postgresql
    echo "✓ PostgreSQL authentication configured"
fi

# Test database connection
echo "Testing database connection..."
if PGPASSWORD=voting_secure_pass psql -h localhost -U voting_admin -d voting_tracker_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful"
else
    echo "⚠ Warning: Could not connect to database. You may need to configure pg_hba.conf manually"
fi

echo ""
echo "=========================================="
echo "✓ PostgreSQL setup completed!"
echo "=========================================="
echo "Database: voting_tracker_db"
echo "User: voting_admin"
echo "Password: voting_secure_pass"
echo "Host: localhost"
echo "Port: 5432"
echo ""
echo "Connection string:"
echo "postgresql://voting_admin:voting_secure_pass@localhost:5432/voting_tracker_db"
echo "=========================================="
