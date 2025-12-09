# Droplet Deployment Guide

## Prerequisites

- Ubuntu 24.04 droplet with public IP
- Port 80 open in firewall
- SSH access to the server
- Repository cloned to the server

## Quick Start

### 1. Clone the Repository

```bash
cd ~
git clone <your-repo-url> Ward14VotingTracker
cd Ward14VotingTracker/deployment
```

### 2. Run Full Deployment

```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

This will:
1. Install all system dependencies (Python, Node.js, PostgreSQL, Nginx)
2. Set up PostgreSQL database
3. Configure Django settings for droplet
4. Set up Python virtual environment and install dependencies
5. Run migrations and import voter data
6. Build React frontend
7. Start backend in screen session
8. Start frontend in screen session
9. Configure and start Nginx

### 3. Access Your Application

- **Frontend**: `http://YOUR_SERVER_IP/`
- **Admin Panel**: `http://YOUR_SERVER_IP/admin/`
- **API**: `http://YOUR_SERVER_IP/api/`

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change the password immediately after first login!**

---

## Manual Deployment (Step by Step)

If you prefer to run each step manually:

### Step 1: Install Dependencies
```bash
./1-install-dependencies.sh
```

### Step 2: Install and Setup PostgreSQL Database
```bash
./2-setup-database.sh
```

This will:
- Install PostgreSQL if not already installed
- Create database `voting_tracker_db`
- Create user `voting_admin` with password `voting_secure_pass`
- Configure authentication for local connections
- Grant all necessary permissions
- Test the database connection

### Step 3: Update WSGI Configuration
```bash
./update-wsgi.sh
```

### Step 4: Setup Backend
```bash
./3-setup-backend.sh
```

### Step 5: Setup Frontend
```bash
./4-setup-frontend.sh
```

### Step 6: Start Backend
```bash
./5-start-backend.sh
```

### Step 7: Start Frontend
```bash
./6-start-frontend.sh
```

### Step 8: Setup Nginx
```bash
./7-setup-nginx.sh
```

---

## Managing Services

### View Backend Logs
```bash
screen -r backend
# Press Ctrl+A then D to detach
```

### View Frontend Logs
```bash
screen -r frontend
# Press Ctrl+A then D to detach
```

### Restart Backend
```bash
screen -S backend -X quit
./5-start-backend.sh
```

### Restart Frontend
```bash
screen -S frontend -X quit
./6-start-frontend.sh
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check Service Status
```bash
# List all screen sessions
screen -ls

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

---

## Updating the Application

### Update Code
```bash
cd ~/Ward14VotingTracker
git pull origin main
```

### Update Backend
```bash
cd ~/Ward14VotingTracker/BackEnd
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Restart backend
screen -S backend -X quit
cd ~/Ward14VotingTracker/deployment
./5-start-backend.sh
```

### Update Frontend
```bash
cd ~/Ward14VotingTracker/Frontend
npm install
npm run build

# Restart frontend
screen -S frontend -X quit
cd ~/Ward14VotingTracker/deployment
./6-start-frontend.sh
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
screen -r backend

# Check if port 8000 is in use
sudo lsof -i :8000

# Check database connection
cd ~/Ward14VotingTracker/BackEnd
source venv/bin/activate
python manage.py check
```

### Frontend Not Starting
```bash
# Check logs
screen -r frontend

# Check if port 5173 is in use
sudo lsof -i :5173

# Rebuild frontend
cd ~/Ward14VotingTracker/Frontend
npm run build
```

### Nginx Errors
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql voting_tracker_db

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Static Files Not Loading
```bash
# Recollect static files
cd ~/Ward14VotingTracker/BackEnd
source venv/bin/activate
python manage.py collectstatic --noinput

# Check static files path in Nginx config
sudo nano /etc/nginx/sites-available/voting-tracker

# Restart Nginx
sudo systemctl restart nginx
```

---

## Firewall Configuration

If you're using UFW:

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Security Recommendations

1. **Change Default Passwords**
   - Admin password: via Django admin
   - Database password: in `.env` file and PostgreSQL

2. **Set Strong SECRET_KEY**
   - Edit `~/Ward14VotingTracker/BackEnd/.env`
   - Generate new key: `python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`

3. **Regular Backups**
   ```bash
   # Backup database
   sudo -u postgres pg_dump voting_tracker_db > backup_$(date +%Y%m%d).sql
   ```

4. **Monitor Logs**
   - Check application logs regularly
   - Monitor Nginx access/error logs
   - Review PostgreSQL logs

---

## File Locations

- **Application**: `~/Ward14VotingTracker/`
- **Backend**: `~/Ward14VotingTracker/BackEnd/`
- **Frontend**: `~/Ward14VotingTracker/Frontend/`
- **Virtual Environment**: `~/Ward14VotingTracker/BackEnd/venv/`
- **Static Files**: `~/Ward14VotingTracker/BackEnd/staticfiles/`
- **Media Files**: `~/Ward14VotingTracker/BackEnd/media/`
- **Nginx Config**: `/etc/nginx/sites-available/voting-tracker`
- **Environment File**: `~/Ward14VotingTracker/BackEnd/.env`

---

## Support

For issues:
1. Check the troubleshooting section above
2. Review service logs
3. Verify all services are running
4. Check firewall settings

---

**Deployment Complete!** Your Ward 14 Voting Tracker is now running on your droplet! 🎉
