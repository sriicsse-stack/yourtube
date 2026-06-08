# YOURTUBE BACKEND - VERCEL DEPLOYMENT GUIDE

## Overview
This guide walks through deploying the YourTube backend to Vercel and configuring the frontend to use it.

---

## Part 1: Prepare GitHub Repository

### Step 1.1: Ensure Backend Code is Ready
```bash
# Verify backend folder structure
ls -la server/
# Should contain: index.js, package.json, api/index.js, vercel.json, etc.
```

### Step 1.2: Push Changes to GitHub
```bash
cd /path/to/you_tube2.0-main
git add .
git commit -m "Add backend Vercel configuration and deployment setup"
git push origin main
```

---

## Part 2: Deploy Backend to Vercel

### Step 2.1: Create New Vercel Project for Backend

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository: `you_tube2.0-main`
4. Click "Import"

### Step 2.2: Configure Backend Project Settings

In the "Configure Project" screen:

**Framework Preset:** Select "Other" (it's not Next.js)

**Root Directory:** 
- Click "Edit" next to Root Directory
- Set to: `server`
- Click "Save"

**Build Command:**
```
npm install
```

**Install Command:**
```
npm install
```

**Output Directory:** (leave empty)

**Environment:** Node.js

### Step 2.3: Add Environment Variables

Before deploying, add all required environment variables:

1. Click "Environment Variables"
2. Add each variable below with Environment = "Production":

| Variable | Value | Example |
|----------|-------|---------|
| `DB_URL` | Your MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | Random 32-character string | (Generate: `openssl rand -base64 32`) |
| `FRONTEND_URL` | Your frontend Vercel URL | `https://youtube-yglv.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Same as FRONTEND_URL | `https://youtube-yglv.vercel.app` |
| `NODE_ENV` | production | `production` |
| `SMTP_HOST` | Gmail SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Your email | `your-email@gmail.com` |
| `SMTP_PASS` | App password | (Gmail App Password) |
| `RAZORPAY_KEY_ID` | Razorpay live key | (from Razorpay dashboard) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | (from Razorpay dashboard) |

### Step 2.4: Deploy Backend

1. Click "Deploy"
2. Wait for deployment to complete (~2-3 minutes)
3. **Copy the backend URL** from the deployment page
   - Format: `https://your-backend-name.vercel.app`
   - This will be used in the next step

### Step 2.5: Verify Backend is Working

Test the health endpoint:
```bash
curl https://<your-backend-url>/api/health
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2026-06-08T10:30:00.000Z"
}
```

If MongoDB shows "disconnected":
- Check DB_URL environment variable
- Verify MongoDB Atlas cluster is active
- Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0 or Vercel IPs)

---

## Part 3: Configure Frontend Environment Variables

### Step 3.1: Get Backend URL

From Vercel deployment in Step 2.4, you have:
```
BACKEND_URL = https://your-backend-name.vercel.app
```

### Step 3.2: Add Environment Variables to Frontend Project

1. Go to https://vercel.com/dashboard
2. Select project: `yourtube-yglv` (frontend)
3. Go to: Settings → Environment Variables
4. Add these variables:

```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://your-backend-name.vercel.app/api
Environment: Production

Name: BACKEND_URL
Value: https://your-backend-name.vercel.app/api
Environment: Production
```

⚠️ **IMPORTANT:** Must include `/api` suffix at the end!

### Step 3.3: Redeploy Frontend

1. In Vercel Frontend project dashboard
2. Go to "Deployments"
3. Find the latest deployment
4. Click "Redeploy"
5. Wait for redeployment to complete

---

## Part 4: Verification

### Step 4.1: Test Frontend Loading Videos

1. Visit: https://youtube-yglv.vercel.app
2. Should see video grid loading (not "Could not load videos" error)
3. Videos should display

### Step 4.2: Test Backend Endpoints

```bash
# Health check
curl https://<backend-url>/api/health

# Get all videos
curl https://<backend-url>/api/videos

# Response should be a JSON array of videos
```

### Step 4.3: Test Frontend Features

- [ ] Homepage loads videos
- [ ] Search functionality works
- [ ] Watch video page loads
- [ ] Upload video (if logged in)
- [ ] Comments work
- [ ] Likes work
- [ ] User profile loads

---

## Troubleshooting

### Problem: "Could not load videos" still shown

**Solution:**
1. Verify NEXT_PUBLIC_BACKEND_URL has `/api` suffix
2. Check it matches the backend URL exactly
3. Redeploy frontend after adding env vars

### Problem: Backend returns 503 - Database connection failed

**Solution:**
1. Verify DB_URL is correct in backend env vars
2. Check MongoDB Atlas cluster is active
3. Check Network Access in MongoDB Atlas (allow 0.0.0.0/0)

### Problem: CORS errors in browser console

**Solution:**
1. Verify CORS_ALLOWED_ORIGINS in backend matches frontend URL exactly
2. Redeploy backend
3. Check browser console for actual origin being blocked

### Problem: JWT token errors

**Solution:**
1. Verify JWT_SECRET is set in backend env vars
2. It must be the same for both token signing and verification
3. Redeploy backend

### Problem: Videos upload fails

**Solution:**
1. Backend must have write access to `/uploads` directory
2. In production (Vercel), check file upload permissions
3. Consider using cloud storage (S3) instead

---

## Next Steps

1. ✅ Backend deployed
2. ✅ Frontend configured
3. ✅ Videos loading
4. Next: Set up email service (Gmail App Password)
5. Next: Configure Razorpay for payments (if needed)
6. Next: Enable Video WebRTC calling (optional)

---

## Support

- **Backend Logs**: Vercel Dashboard → Project → Deployments → (Latest) → Logs
- **Frontend Logs**: Browser Console (F12)
- **Database Issues**: MongoDB Atlas Dashboard → Logs/Monitoring

