# DigitalOcean App Platform Deployment Guide

## Prerequisites
- Docker Hub account with your image pushed: `hemangsrr/voting-tracker:latest`
- DigitalOcean account

## Step 1: Create App from Docker Hub

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **"Docker Hub"** as the source
4. Enter your Docker Hub repository: `hemangsrr/voting-tracker`
5. Tag: `latest`
6. Click **"Next"**

## Step 2: Configure App Settings

### Basic Settings
- **App Name**: `ward14-voting-tracker` (or your choice)
- **Region**: Choose closest to your users
- **Plan**: Basic ($5/month minimum)

### Resources Configuration

#### HTTP Port
- Set **HTTP Port**: `80`

#### Health Check Configuration
**IMPORTANT**: Configure the health check properly to avoid deployment failures.

- **HTTP Path**: `/api/health/`
- **Port**: `80`
- **Initial Delay**: `60` seconds (to allow DB initialization)
- **Period**: `10` seconds
- **Timeout**: `5` seconds
- **Success Threshold**: `1`
- **Failure Threshold**: `3`

## Step 3: Environment Variables

Click **"Edit"** next to your app component and add these environment variables:

```
SECRET_KEY=your-super-secret-production-key-min-50-chars-long
DEBUG=False
ALLOWED_HOSTS=your-app-name.ondigitalocean.app,your-custom-domain.com
POSTGRES_DB=voting_tracker_db
POSTGRES_USER=voting_admin
POSTGRES_PASSWORD=your-secure-database-password-change-this
FRONTEND_URL=https://your-app-name.ondigitalocean.app
```

**Important Notes:**
- Replace `your-app-name` with your actual DigitalOcean app name
- Generate a strong `SECRET_KEY` (50+ random characters)
- Use a strong `POSTGRES_PASSWORD`
- If using a custom domain, add it to `ALLOWED_HOSTS`

## Step 4: Deploy

1. Review all settings
2. Click **"Create Resources"**
3. Wait for deployment (5-10 minutes)
   - First time will take longer due to:
     - Database initialization
     - Running migrations
     - Importing voter data (~1197 voters)
     - Collecting static files

## Step 5: Verify Deployment

### Check Health Endpoint
```bash
curl https://your-app-name.ondigitalocean.app/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Ward 14 Voting Tracker"
}
```

### Access the Application
- **Frontend**: `https://your-app-name.ondigitalocean.app/`
- **Admin Panel**: `https://your-app-name.ondigitalocean.app/admin/`
- **API**: `https://your-app-name.ondigitalocean.app/api/`

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

## Step 6: Post-Deployment Tasks

### 1. Change Admin Password
1. Login to admin panel
2. Go to Users → admin
3. Change password to something secure

### 2. Update Environment Variables (if needed)
1. Go to App Settings → Components → voting-tracker
2. Edit environment variables
3. Save and redeploy

### 3. Add Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_HOSTS` environment variable

### 4. Enable HTTPS (Automatic)
DigitalOcean automatically provides SSL certificates for:
- `.ondigitalocean.app` domains
- Custom domains (after DNS verification)

### 5. Add Volunteers
1. Login to admin panel
2. Go to Voters → Volunteers
3. Add your volunteers with their details

### 6. Assign Voters to Volunteers
1. Go to Voters → Voters
2. Edit voters and assign Level 1 and Level 2 volunteers
3. Or use bulk import/update if needed

## Monitoring and Logs

### View Logs
```bash
# Using doctl CLI
doctl apps logs <app-id> --type run

# Or via Dashboard
Go to App → Runtime Logs
```

### Monitor Health
- DigitalOcean automatically monitors the `/api/health/` endpoint
- You'll receive alerts if the app becomes unhealthy

## Troubleshooting

### Deployment Failed: Health Checks
**Problem**: Container didn't respond to health checks

**Solutions**:
1. Check health check path is `/api/health/` (with trailing slash)
2. Increase initial delay to 90 seconds if DB initialization is slow
3. Check runtime logs for errors
4. Verify port is set to `80`

### 500 Internal Server Error
**Check**:
1. Runtime logs for Python errors
2. Environment variables are set correctly
3. `ALLOWED_HOSTS` includes your domain
4. `SECRET_KEY` is set and not empty

### Static Files Not Loading
**Check**:
1. WhiteNoise is installed (it is in requirements.txt)
2. Static files were collected during build
3. Check logs for "Collecting static files..." message

### Database Connection Issues
**Check**:
1. PostgreSQL started successfully (check logs)
2. Database credentials in environment variables
3. Migrations ran successfully

### Out of Memory
**Solution**:
- Upgrade to a larger plan (Basic $12/month for 1GB RAM)
- Reduce Gunicorn workers in `supervisord.conf` (currently 3)

## Scaling

### Vertical Scaling
Upgrade your plan for more resources:
- **Basic**: $5/month (512MB RAM)
- **Basic**: $12/month (1GB RAM)
- **Professional**: $24/month (2GB RAM)

### Data Backup
**Important**: The database is inside the container!

**Backup Strategy**:
1. Use Django admin to export data regularly
2. Or SSH into the container and run:
   ```bash
   pg_dump -U voting_admin voting_tracker_db > backup.sql
   ```
3. Download the backup file

**Note**: Container restarts preserve data, but container rebuilds do not!

## Cost Estimate

- **App Platform Basic**: $5/month
- **Bandwidth**: Included (1TB)
- **Total**: ~$5/month for basic usage

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `SECRET_KEY`
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] HTTPS enabled (automatic)
- [ ] Regular backups scheduled

## Support

For issues:
1. Check DigitalOcean runtime logs
2. Check health endpoint: `/api/health/`
3. Review this guide
4. Contact DigitalOcean support if infrastructure issues

## Updating the Application

### Deploy New Version
1. Build and push new Docker image:
   ```bash
   sh build-docker.sh
   sh push-docker.sh
   ```

2. In DigitalOcean App Platform:
   - Go to your app
   - Click **"Create Deployment"**
   - Or enable auto-deploy to automatically pull latest image

### Rolling Back
- Go to Deployments tab
- Select a previous successful deployment
- Click **"Rollback"**

---

**Congratulations!** Your Ward 14 Voting Tracker is now deployed on DigitalOcean! 🎉
