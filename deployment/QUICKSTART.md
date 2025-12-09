# Quick Start - Droplet Deployment

## One-Command Deployment

```bash
cd ~/Ward14VotingTracker/deployment
chmod +x deploy-all.sh
./deploy-all.sh
```

Wait 5-10 minutes for complete setup.

## Access Application

- **URL**: `http://YOUR_SERVER_IP/`
- **Admin**: `http://YOUR_SERVER_IP/admin/`
- **Login**: `admin` / `admin123`

## Common Commands

### View Logs
```bash
screen -r backend    # Backend logs
screen -r frontend   # Frontend logs
# Press Ctrl+A then D to detach
```

### Restart Services
```bash
cd ~/Ward14VotingTracker/deployment
./stop-all.sh
./5-start-backend.sh
./6-start-frontend.sh
```

### Update Application
```bash
cd ~/Ward14VotingTracker
git pull
cd deployment
./stop-all.sh
./3-setup-backend.sh
./4-setup-frontend.sh
./5-start-backend.sh
./6-start-frontend.sh
```

### Check Status
```bash
screen -ls                          # List all screens
sudo systemctl status nginx         # Nginx status
sudo systemctl status postgresql    # Database status
```

## Troubleshooting

### Can't Access Application
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check services are running
screen -ls
```

### 500 Errors
```bash
# Check backend logs
screen -r backend

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Errors
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Run migrations
cd ~/Ward14VotingTracker/BackEnd
source venv/bin/activate
python manage.py migrate
```

## File Locations

- **App**: `~/Ward14VotingTracker/`
- **Backend**: `~/Ward14VotingTracker/BackEnd/`
- **Static**: `~/Ward14VotingTracker/BackEnd/staticfiles/`
- **Nginx Config**: `/etc/nginx/sites-available/voting-tracker`
- **Environment**: `~/Ward14VotingTracker/BackEnd/.env`

## Important Notes

1. **Change admin password** after first login
2. **Backup database** regularly:
   ```bash
   sudo -u postgres pg_dump voting_tracker_db > backup.sql
   ```
3. **Monitor logs** for errors
4. **Keep system updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

---

For detailed documentation, see `README.md`
