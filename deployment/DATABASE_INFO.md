# PostgreSQL Database Setup

## Overview

The deployment automatically installs and configures PostgreSQL on your droplet.

## Database Credentials

```
Database: voting_tracker_db
User: voting_admin
Password: voting_secure_pass
Host: localhost
Port: 5432
```

**Connection String:**
```
postgresql://voting_admin:voting_secure_pass@localhost:5432/voting_tracker_db
```

## What Gets Installed

Script `2-setup-database.sh` performs the following:

1. **Checks for PostgreSQL** - Installs if not present
2. **Starts PostgreSQL service** - Enables auto-start on boot
3. **Creates database** - `voting_tracker_db`
4. **Creates user** - `voting_admin` with password
5. **Grants permissions** - Full access to database and schema
6. **Configures authentication** - Allows local password connections
7. **Tests connection** - Verifies everything works

## Manual Database Access

### Connect to Database
```bash
# As postgres user
sudo -u postgres psql

# As voting_admin user
PGPASSWORD=voting_secure_pass psql -h localhost -U voting_admin -d voting_tracker_db
```

### Common Commands
```sql
-- List all databases
\l

-- Connect to voting tracker database
\c voting_tracker_db

-- List all tables
\dt

-- Count voters
SELECT COUNT(*) FROM voters_voter;

-- Check database size
SELECT pg_size_pretty(pg_database_size('voting_tracker_db'));

-- Exit
\q
```

## Backup and Restore

### Create Backup
```bash
# Backup entire database
sudo -u postgres pg_dump voting_tracker_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
sudo -u postgres pg_dump voting_tracker_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Backup
```bash
# Restore from backup
sudo -u postgres psql voting_tracker_db < backup_20241209_120000.sql

# Restore from compressed backup
gunzip -c backup_20241209_120000.sql.gz | sudo -u postgres psql voting_tracker_db
```

### Automated Backups
Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * sudo -u postgres pg_dump voting_tracker_db | gzip > /home/ubuntu/backups/voting_tracker_$(date +\%Y\%m\%d).sql.gz

# Create backups directory
mkdir -p /home/ubuntu/backups
```

## Changing Database Password

### 1. Change PostgreSQL Password
```bash
sudo -u postgres psql << EOF
ALTER USER voting_admin WITH PASSWORD 'new_secure_password';
EOF
```

### 2. Update Django Configuration
```bash
# Edit .env file
nano ~/Ward14VotingTracker/BackEnd/.env

# Change this line:
POSTGRES_PASSWORD=new_secure_password
```

### 3. Restart Backend
```bash
cd ~/Ward14VotingTracker/deployment
./stop-all.sh
./5-start-backend.sh
```

## Troubleshooting

### PostgreSQL Not Starting
```bash
# Check status
sudo systemctl status postgresql

# View logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Restart service
sudo systemctl restart postgresql
```

### Connection Refused
```bash
# Check if PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure this line exists:
# local   all             all                                     md5

# Reload configuration
sudo systemctl reload postgresql
```

### Permission Denied
```bash
# Re-grant permissions
sudo -u postgres psql << EOF
\c voting_tracker_db
GRANT ALL ON SCHEMA public TO voting_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voting_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voting_admin;
EOF
```

### Database Doesn't Exist
```bash
# Recreate database
cd ~/Ward14VotingTracker/deployment
./2-setup-database.sh
```

## Performance Tuning

For better performance with ~1200 voters:

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf

# Recommended settings for small database:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Monitoring

### Check Database Size
```bash
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('voting_tracker_db'));"
```

### Check Active Connections
```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='voting_tracker_db';"
```

### View Slow Queries
```bash
sudo -u postgres psql voting_tracker_db -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Security Best Practices

1. **Change default password** immediately after deployment
2. **Regular backups** - Set up automated daily backups
3. **Firewall rules** - PostgreSQL should only be accessible from localhost
4. **Monitor logs** - Check for unauthorized access attempts
5. **Update regularly** - Keep PostgreSQL updated

```bash
# Check for updates
sudo apt-get update
sudo apt-get upgrade postgresql postgresql-contrib
```

---

**Note:** The database is configured for local access only (localhost). It is not accessible from external networks, which is secure for this deployment model.
