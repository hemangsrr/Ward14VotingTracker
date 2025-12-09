# Ward 14 Voting Tracker - Docker Deployment Guide

## Overview

This application is packaged as a **single Docker container** containing:
- ✅ PostgreSQL database (embedded)
- ✅ Django backend (with Gunicorn)
- ✅ React frontend (pre-built)
- ✅ Nginx web server

All services run together in one container, making deployment simple and straightforward.

---

## Prerequisites

1. **Docker Desktop** installed on your machine
2. **Docker Hub account** (free tier is sufficient)
3. **DigitalOcean account** (for deployment)

---

## Step 1: Build the Docker Image

### On Windows (PowerShell):

```powershell
# Set your Docker Hub username
$env:DOCKERHUB_USERNAME = "your-dockerhub-username"

# Build the image
docker build -t ${env:DOCKERHUB_USERNAME}/voting-tracker:latest .
```

### On Linux/Mac (Bash):

```bash
# Set your Docker Hub username
export DOCKERHUB_USERNAME="your-dockerhub-username"

# Build the image
chmod +x build-docker.sh
./build-docker.sh
```

**Build time:** Approximately 5-10 minutes depending on your internet speed.

---

## Step 2: Test Locally (Optional but Recommended)

```bash
# Run the container
docker run -d -p 80:80 --name voting-tracker your-dockerhub-username/voting-tracker:latest

# Check logs
docker logs -f voting-tracker

# Wait for initialization (about 30-60 seconds)
# You should see: "Starting all services with Supervisor..."
```

**Access the application:**
- Frontend: http://localhost
- Admin Panel: http://localhost/admin
- Default credentials: `admin` / `admin123`

**To stop and remove:**
```bash
docker stop voting-tracker
docker rm voting-tracker
```

---

## Step 3: Push to Docker Hub

### On Windows (PowerShell):

```powershell
# Login to Docker Hub
docker login

# Push the image
docker push ${env:DOCKERHUB_USERNAME}/voting-tracker:latest
```

### On Linux/Mac (Bash):

```bash
# Login to Docker Hub
docker login

# Push the image
chmod +x push-docker.sh
./push-docker.sh
```

**Push time:** Approximately 5-15 minutes depending on your upload speed.

---

## Step 4: Deploy to DigitalOcean App Platform

### 4.1: Create New App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **"Docker Hub"** as the source
4. Enter your Docker Hub image: `your-dockerhub-username/voting-tracker:latest`
5. Click **"Next"**

### 4.2: Configure the App

**App Settings:**
- **Name:** `ward14-voting-tracker`
- **Region:** Choose closest to your location (e.g., Bangalore for India)
- **Plan:** Basic ($5/month) or Professional ($12/month)
  - Basic: 512MB RAM, 1 vCPU (sufficient for 20-30 concurrent users)
  - Professional: 1GB RAM, 1 vCPU (recommended for 50+ concurrent users)

**HTTP Port:**
- Set to `80` (the container exposes port 80)

### 4.3: Add Environment Variables

Click **"Environment Variables"** and add:

```
SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=False
ALLOWED_HOSTS=ward14-voting-tracker.ondigitalocean.app,your-custom-domain.com
POSTGRES_DB=voting_tracker_db
POSTGRES_USER=voting_admin
POSTGRES_PASSWORD=your-secure-database-password-here
FRONTEND_URL=https://ward14-voting-tracker.ondigitalocean.app
```

**Important:** Generate a strong SECRET_KEY:
```python
# Run this in Python
import secrets
print(secrets.token_urlsafe(50))
```

### 4.4: Deploy

1. Click **"Next"** → **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://ward14-voting-tracker.ondigitalocean.app`

---

## Step 5: Post-Deployment Setup

### 5.1: Access the Application

Visit your app URL: `https://your-app-name.ondigitalocean.app`

### 5.2: Login to Admin Panel

1. Go to: `https://your-app-name.ondigitalocean.app/admin`
2. Login with: `admin` / `admin123`
3. **IMMEDIATELY CHANGE THE PASSWORD!**
   - Click on "Users" → "admin" → Change password

### 5.3: Configure Application Settings

1. In Django Admin, go to **"Application Settings"**
2. Keep **"Enable Voting"** unchecked until polling day
3. Save

### 5.4: Add Volunteers

1. Go to **"Volunteers"** in admin
2. Add Level 1 volunteers:
   - Volunteer ID: 1, 2, 3, etc.
   - Level: Level 1
   - Name (English): Volunteer name
   - Name (Malayalam): Optional
3. Add Level 2 volunteers:
   - Volunteer ID: 1, 2, 3, etc. (separate series)
   - Level: Level 2
   - Parent Volunteer: Select Level 1 volunteer

### 5.5: Assign Voters to Volunteers

1. Go to **"Voters"** in admin
2. Use filters to find voters
3. Edit voters to assign Level 1 and Level 2 volunteers
4. Or use bulk actions if needed

### 5.6: Import Your CSV Data (If Not Already Done)

If you need to re-import or update voter data:

1. Access the container console in DigitalOcean
2. Run: `python /app/backend/manage.py import_voters`
3. Or upload CSVs and import via admin

---

## Step 6: Custom Domain (Optional)

### 6.1: Add Domain in DigitalOcean

1. Go to your app settings
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain: `voting.yourdomain.com`

### 6.2: Update DNS Records

Add these records in your domain registrar:

```
Type: CNAME
Name: voting
Value: your-app-name.ondigitalocean.app
TTL: 3600
```

### 6.3: Update Environment Variables

Update `ALLOWED_HOSTS` to include your custom domain:
```
ALLOWED_HOSTS=ward14-voting-tracker.ondigitalocean.app,voting.yourdomain.com
```

---

## Monitoring and Maintenance

### View Logs

In DigitalOcean App Platform:
1. Go to your app
2. Click **"Runtime Logs"**
3. View real-time logs from all services

### Check Application Health

Visit: `https://your-app-name.ondigitalocean.app/admin`

If the admin panel loads, all services are running correctly.

### Database Backup

**Important:** The database is inside the container. To backup:

1. Access the container console in DigitalOcean
2. Run backup command:
```bash
pg_dump -U voting_admin voting_tracker_db > /tmp/backup.sql
```
3. Download the backup file

**Recommendation:** Set up automated backups using DigitalOcean's backup feature or export data regularly via Django admin.

### Update the Application

To deploy a new version:

1. Make changes to your code
2. Rebuild the Docker image:
   ```bash
   docker build -t your-dockerhub-username/voting-tracker:v2 .
   ```
3. Push to Docker Hub:
   ```bash
   docker push your-dockerhub-username/voting-tracker:v2
   ```
4. In DigitalOcean, update the image tag to `v2`
5. Redeploy

---

## Troubleshooting

### Container Won't Start

**Check logs in DigitalOcean:**
- Look for PostgreSQL initialization errors
- Check for Django migration errors
- Verify environment variables are set correctly

### Can't Access Admin Panel

1. Verify the app is running (check logs)
2. Try accessing: `https://your-app-name.ondigitalocean.app/admin/`
3. Clear browser cache
4. Check ALLOWED_HOSTS includes your domain

### Database Connection Errors

1. Check PostgreSQL is running: Look for "PostgreSQL is ready" in logs
2. Verify POSTGRES_* environment variables
3. Container may need restart

### Frontend Not Loading

1. Check nginx logs in container
2. Verify frontend was built correctly during Docker build
3. Check browser console for errors

### Voting Toggle Not Working

1. Ensure AppSettings was created (check logs on first startup)
2. Go to Django admin → Application Settings
3. Toggle "Enable Voting" and save
4. Refresh frontend page

---

## Cost Estimate

**DigitalOcean App Platform:**
- Basic Plan: $5/month (512MB RAM, 1 vCPU)
- Professional Plan: $12/month (1GB RAM, 1 vCPU)
- Bandwidth: 40GB included, then $0.01/GB

**Recommended:** Start with Basic plan, upgrade to Professional if needed.

**Total Monthly Cost:** $5-12 USD

---

## Security Checklist

- [x] Change default admin password immediately
- [x] Use strong SECRET_KEY
- [x] Set DEBUG=False in production
- [x] Use HTTPS (automatic with DigitalOcean)
- [x] Restrict ALLOWED_HOSTS to your domains only
- [x] Keep voting toggle disabled until polling day
- [x] Regular database backups
- [x] Monitor logs for suspicious activity

---

## Support

For issues or questions:
1. Check the logs first
2. Review this deployment guide
3. Check VERIFICATION_CHECKLIST.md for feature details
4. Contact your developer

---

**Deployment Status:** Ready for production! 🚀
