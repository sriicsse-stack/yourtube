# YOURTUBE DEPLOYMENT - COMPLETE SETUP GUIDE

**Current Status:**
- ✅ Frontend deployed to Vercel (https://youtube-yglv.vercel.app)
- ❌ Backend NOT deployed (videos not loading)
- ❌ Frontend env vars NOT configured
- ✅ MongoDB configured and active
- ✅ Backend code now production-ready

**What You Need to Do (3 Simple Steps):**

---

## STEP 1: Deploy Backend to Vercel (Backend Deployment)

### What This Does
Deploys your Express API server to Vercel so it's accessible from the internet.

### Instructions

1. **Go to Vercel Dashboard**
   - Open https://vercel.com/dashboard
   - Look for your existing project or create new one

2. **Create New Project**
   - Click "Add New..." → "Project"
   - Select repository: `sriicsse-stack/yourtube`
   - Click "Import"

3. **Configure Project Settings**
   - In "Configure Project" dialog:
     - **Framework Preset**: Select "Other"
     - **Root Directory**: Click "Edit" → Change to `server` → Save
     - **Build & Install**: Use defaults (both `npm install`)
     - **Output Directory**: Leave empty

4. **Add Environment Variables**
   - Click "Environment Variables"
   - For **EACH** variable below, add it with Environment = "Production":

```
DB_URL = mongodb+srv://kit2925bad157_db_user:gAc3oCly8YgzsJ0g@cluster0.nenaf5k.mongodb.net/yourtube?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET = your_random_32_char_string_here_change_this_IMPORTANT

FRONTEND_URL = https://youtube-yglv.vercel.app

CORS_ALLOWED_ORIGINS = https://youtube-yglv.vercel.app

NODE_ENV = production

SMTP_HOST = smtp.gmail.com

SMTP_PORT = 587

SMTP_USER = your-email@gmail.com

SMTP_PASS = your-gmail-app-password

RAZORPAY_KEY_ID = rzp_live_xxxxx (or test key)

RAZORPAY_KEY_SECRET = xxxxx (or test secret)
```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment
   - ⭐ **COPY THE BACKEND URL** (looks like: `https://yourtube-backend.vercel.app`)
   - You'll need this in Step 2

### Verify It Works
Open in new tab:
```
https://<your-backend-url>/api/health
```

Should show:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "..."
}
```

If you see "mongodb": "disconnected":
- Go back to Step 1.4 and verify DB_URL is correct
- Check MongoDB Atlas is active (https://cloud.mongodb.com)

---

## STEP 2: Add Environment Variables to Frontend (Frontend Configuration)

### What This Does
Tells your Next.js frontend where to find the backend API.

### Instructions

1. **Go to Frontend Project in Vercel**
   - https://vercel.com/dashboard
   - Click on project: `yourtube-yglv`

2. **Go to Settings → Environment Variables**

3. **Add These Two Variables:**

**Variable #1:**
```
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://<your-backend-url-from-step-1>/api
Environment: Production
```

**Variable #2:**
```
Name: BACKEND_URL
Value: https://<your-backend-url-from-step-1>/api
Environment: Production
```

⚠️ **IMPORTANT:** 
- Replace `<your-backend-url-from-step-1>` with your actual backend URL
- MUST include `/api` at the end
- Example: `https://yourtube-backend.vercel.app/api`

4. **Click "Save" for each variable**

---

## STEP 3: Redeploy Frontend (Activate the Changes)

### What This Does
Rebuilds your frontend with the new backend URL.

### Instructions

1. **Go to Deployments in Frontend Project**
   - Click on Deployments tab

2. **Find Latest Deployment**
   - Should be at the top of the list
   - Created date should be recent

3. **Click "Redeploy"**
   - Select "Yes, redeploy"
   - Wait 2-3 minutes for build to complete

4. **Verify It Works**
   - Go to https://youtube-yglv.vercel.app
   - Should see **video grid loading** (not error message)
   - Videos should appear

---

## ✅ VERIFICATION CHECKLIST

After completing all 3 steps above, check these:

### Backend Health
- [ ] `https://<backend-url>/api/health` returns status OK
- [ ] MongoDB shows "connected"

### Frontend Homepage
- [ ] Videos are loading on homepage
- [ ] No "Could not load videos" error
- [ ] Video thumbnails visible
- [ ] Video cards showing title and channel

### Frontend Features
- [ ] Search functionality works
- [ ] Can navigate to video watch page
- [ ] Comments section loads
- [ ] Like/dislike buttons work
- [ ] User profile accessible

### API Endpoints
```bash
# Test these in browser or terminal:
curl https://<backend-url>/api/health
curl https://<backend-url>/api/videos
```

---

## 🚨 TROUBLESHOOTING

### Problem: Videos still not loading after Step 3

**Step 1: Check if env vars were added**
- Go to frontend Vercel project
- Settings → Environment Variables
- Verify `NEXT_PUBLIC_BACKEND_URL` and `BACKEND_URL` are there

**Step 2: Verify the URLs**
- Check values have `/api` suffix
- Check values match your backend URL exactly

**Step 3: Hard refresh**
- Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear browser cache
- Try incognito/private window

**Step 4: Check browser console**
- Press F12 to open Developer Tools
- Go to Console tab
- Look for error messages
- Check Network tab to see if API calls are made

### Problem: Backend shows MongoDB disconnected

**Check 1: Verify DB_URL**
- Go to backend Vercel project
- Settings → Environment Variables
- Check `DB_URL` value

**Check 2: Verify MongoDB Atlas is active**
- Go to https://cloud.mongodb.com
- Check cluster is running (green status)

**Check 3: Whitelist IPs in MongoDB Atlas**
- MongoDB Atlas Dashboard → Security → Network Access
- Add Vercel IPs (or allow 0.0.0.0/0 for testing)

**Check 4: Check MongoDB credentials**
- Verify username and password in DB_URL are correct
- Test connection string locally if possible

### Problem: CORS errors in browser console

**Solution:**
- Go to backend Vercel project
- Settings → Environment Variables
- Find `CORS_ALLOWED_ORIGINS`
- Verify it matches your frontend URL exactly
- Redeploy backend

### Problem: Cannot upload videos

**Reason:** Vercel is serverless and doesn't persist file uploads
**Solution:** Upload videos during local testing, or set up cloud storage (S3)

---

## 📞 SUPPORT & DEBUGGING

### Backend Logs
- Vercel Dashboard → Backend Project → Deployments → (Latest) → Logs

### Frontend Logs
- Browser Console (F12)
- Vercel Dashboard → Frontend Project → Deployments → (Latest) → Logs

### Database Issues
- MongoDB Atlas Dashboard → Monitoring
- Check connection attempts and errors

### Network Issues
- Check backend health: `https://<backend-url>/api/health`
- Check frontend can reach backend: Browser Network tab (F12)
- Check CORS settings: Look for "Access-Control-Allow-Origin" headers

---

## 📋 REFERENCE: File Changes Made

The following files were created/updated for production deployment:

1. **server/api/index.js** - New Vercel entry point
2. **server/vercel.json** - New Vercel configuration
3. **server/controllers/auth.js** - Updated JWT handling
4. **server/middleware/auth.js** - Updated JWT handling
5. **BACKEND_VERCEL_DEPLOYMENT_GUIDE.md** - Detailed guide
6. **BACKEND_DEPLOYMENT_CHECKLIST.md** - Verification checklist
7. **server/VERCEL_ENV_VARIABLES.md** - All env vars reference

All files have been pushed to GitHub.

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

Once videos are loading:

1. **Test all features:**
   - Search videos
   - Upload new video
   - Comment on video
   - Like/dislike video
   - Add to watch later
   - View history

2. **Set up email (optional):**
   - Enable password reset emails
   - Enable OTP verification

3. **Set up payments (optional):**
   - Configure Razorpay keys
   - Test payment flow

4. **Enable WebRTC calling (optional):**
   - Configure Socket.IO on production
   - Test video calling feature

---

## ⏱️ ESTIMATED TIMELINE

- Step 1 (Deploy Backend): 5-10 minutes
- Step 2 (Configure Frontend): 2-5 minutes
- Step 3 (Redeploy Frontend): 5-10 minutes
- Verification: 5 minutes
- **Total: ~20-30 minutes**

---

## ✨ SUCCESS CRITERIA

When complete, you should have:

✅ Backend accessible at `https://<backend-url>/api`
✅ Frontend at `https://youtube-yglv.vercel.app` loading videos
✅ No "Could not load videos" error
✅ Video grid displaying with thumbnails
✅ All API endpoints responding
✅ MongoDB connected
✅ Complete YouTube clone functionality

---

**You're ready to deploy! 🚀**

Follow the 3 steps above to get your complete YouTube clone live.

