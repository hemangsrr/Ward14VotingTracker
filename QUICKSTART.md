# Ward 14 Voting Tracker - Quick Start Guide

## 🚀 Deploy in 4 Simple Steps

### Step 1: Set Your Docker Hub Username

**Windows PowerShell:**
```powershell
$env:DOCKERHUB_USERNAME = "your-dockerhub-username"
```

**Linux/Mac:**
```bash
export DOCKERHUB_USERNAME="your-dockerhub-username"
```

---

### Step 2: Build the Docker Image

**Windows:**
```powershell
.\build-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x build-docker.sh
./build-docker.sh
```

⏱️ **Takes:** 5-10 minutes

---

### Step 3: Test Locally (Optional)

```bash
docker run -d -p 80:80 --name voting-tracker your-dockerhub-username/voting-tracker:latest
```

**Access:**
- App: http://localhost
- Admin: http://localhost/admin
- Login: `admin` / `admin123`

**Stop:**
```bash
docker stop voting-tracker
docker rm voting-tracker
```

---

### Step 4: Push to Docker Hub

**Windows:**
```powershell
.\push-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x push-docker.sh
./push-docker.sh
```

⏱️ **Takes:** 5-15 minutes

---

## 🌐 Deploy to DigitalOcean

### Quick Deploy:

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"** → **"Docker Hub"**
3. Enter: `your-dockerhub-username/voting-tracker:latest`
4. Set **HTTP Port:** `80`
5. Add **Environment Variables:**
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app.ondigitalocean.app
   POSTGRES_DB=voting_tracker_db
   POSTGRES_USER=voting_admin
   POSTGRES_PASSWORD=your-secure-password
   ```
6. Click **"Create Resources"**

⏱️ **Takes:** 5-10 minutes

**Done!** Your app will be live at: `https://your-app.ondigitalocean.app`

---

## 📋 Post-Deployment

1. **Change Admin Password:**
   - Go to: `https://your-app.ondigitalocean.app/admin`
   - Login: `admin` / `admin123`
   - Change password immediately!

2. **Add Volunteers:**
   - Admin → Volunteers → Add
   - Level 1: IDs 1, 2, 3...
   - Level 2: IDs 1, 2, 3...

3. **Assign Voters:**
   - Admin → Voters → Edit
   - Assign Level 1 and Level 2 volunteers

4. **Enable Voting (on polling day):**
   - Admin → Application Settings
   - Check "Enable Voting"
   - Save

---

## 💰 Cost

**DigitalOcean Basic Plan:** $5/month
- 512MB RAM, 1 vCPU
- Good for 20-30 concurrent users

**DigitalOcean Professional Plan:** $12/month
- 1GB RAM, 1 vCPU
- Good for 50+ concurrent users

---

## 📚 Full Documentation

- **Detailed Deployment:** See `DOCKER_DEPLOYMENT.md`
- **Feature Verification:** See `VERIFICATION_CHECKLIST.md`
- **Development Plan:** See `ExecutionPlan.md`

---

## ⚠️ Important Notes

1. **Database is inside the container** - Data persists across restarts but backup regularly!
2. **Change default passwords** immediately after first deployment
3. **Keep voting disabled** until polling day
4. **Monitor logs** in DigitalOcean for any issues

---

## 🆘 Troubleshooting

**Container won't start?**
- Check logs in DigitalOcean
- Verify environment variables are set

**Can't access admin?**
- Wait 1-2 minutes for initialization
- Check URL: `https://your-app.ondigitalocean.app/admin/`
- Clear browser cache

**Database errors?**
- Check PostgreSQL logs in container
- Verify POSTGRES_* environment variables

---

**Ready to deploy!** 🎉
