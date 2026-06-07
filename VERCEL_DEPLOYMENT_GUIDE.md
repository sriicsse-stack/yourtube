# 🚀 VERCEL DEPLOYMENT GUIDE - YOURTUBE 2.0

## Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ Vercel account (https://vercel.com)
2. ✅ GitHub/GitLab/Bitbucket account with repository pushed
3. ✅ MongoDB Atlas account with production cluster
4. ✅ Razorpay production account
5. ✅ Gmail or SMTP email service configured
6. ✅ Domain name (optional, but recommended)

---

## Step 1: Prepare Production Environment Variables

### 1.1 Generate Strong JWT Secret
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Save this value** - you'll need it in Vercel settings.

### 1.2 Get Razorpay Production Keys
1. Log in to Razorpay Dashboard: https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Select "Production" mode (not Test)
4. Copy: Key ID and Key Secret
5. **Save these values** - you'll need them in Vercel settings.

### 1.3 Prepare MongoDB Connection String
1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Ensure production cluster is created
3. Go to Database → Connect → Drivers
4. Copy connection string
5. Replace `<username>` and `<password>` with actual values
6. **Save this value** - you'll need it in Vercel settings.

### 1.4 Determine Your Deployment URLs
- **Frontend URL**: e.g., `https://yourtube.vercel.app` (or custom domain)
- **Backend URL**: Option A) Separate Vercel deployment, Option B) Separate server
- **Decision Required**: Where will backend run?

---

## Step 2: Frontend Deployment to Vercel

### 2.1 Connect GitHub Repository
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select GitHub and authorize
4. Find and import your `yourtube` repository
5. Click "Import"

### 2.2 Configure Build Settings
Vercel should auto-detect Next.js, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

### 2.3 Set Environment Variables
1. In Vercel dashboard, go to "Settings" → "Environment Variables"
2. Add these variables for **Production**:

```
BACKEND_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com/api
```

**Important**: 
- Set "Environment" to "Production"
- Both URLs must include `/api` suffix
- Use https:// protocol

3. Click "Save"

### 2.4 Deploy Frontend
1. Review the auto-detected settings
2. Click "Deploy"
3. Wait for build to complete (usually 2-3 minutes)
4. ✅ Frontend is now live at your Vercel URL

### 2.5 Test Frontend Deployment
```bash
# From terminal
curl https://yourtube.vercel.app
# Should return HTML of your homepage
```

---

## Step 3: Backend Deployment Options

### Option A: Separate Vercel Deployment (Recommended for Simplicity)

1. Create separate Vercel project for backend
2. Ensure `/server` folder is root or configure as monorepo
3. Set build command: `npm run build` (or skip if no build)
4. Set environment variables (same as local .env):
   - DB_URL
   - JWT_SECRET
   - RAZORPAY_KEY_ID
   - RAZORPAY_KEY_SECRET
   - FRONTEND_URL
   - CORS_ALLOWED_ORIGINS
   - SMTP_* variables
5. Deploy

### Option B: Deploy to Heroku (Popular for Node.js)

1. Create Heroku account: https://heroku.com
2. Create new app in Heroku dashboard
3. Connect GitHub repository
4. Set environment variables in Heroku settings
5. Deploy

### Option C: Deploy to Railway/Render
- Similar to Heroku
- Simpler UI
- Same process: connect repo → set env vars → deploy

### Option D: Self-hosted (AWS/DigitalOcean/VPS)
- Most control
- Requires DevOps knowledge
- Consider: Docker, PM2, Nginx, SSL setup

---

## Step 4: Backend Environment Variables (Vercel/Platform)

If deploying backend to Vercel or similar platform, add these environment variables:

```
# Database
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<your-generated-strong-secret>

# Server
PORT=3001
FRONTEND_URL=https://yourtube.vercel.app
CORS_ALLOWED_ORIGINS=https://yourtube.vercel.app

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>

# Payments
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Optional
NODE_ENV=production
MONGO_DNS_SERVERS=8.8.8.8,8.8.4.4,1.1.1.1
```

---

## Step 5: Update Frontend After Backend Deployment

Once backend is deployed and has a public URL:

1. Get backend public URL (e.g., `https://yourtube-api.vercel.app`)
2. Go to Vercel Frontend project → Settings → Environment Variables
3. Update:
   ```
   BACKEND_URL=https://yourtube-api.vercel.app/api
   NEXT_PUBLIC_BACKEND_URL=https://yourtube-api.vercel.app/api
   ```
4. Redeploy: Go to Deployments → Click latest → Click "Redeploy"

---

## Step 6: Configure Custom Domain (Optional)

### Add Custom Domain in Vercel
1. Frontend project → Settings → Domains
2. Add your domain (e.g., yourtube.com)
3. Follow DNS configuration steps from Vercel
4. Wait for DNS propagation (usually 5-30 minutes)

### Update Backend CORS for Custom Domain
If using custom domain, update backend environment variable:
```
CORS_ALLOWED_ORIGINS=https://yourtube.com
FRONTEND_URL=https://yourtube.com
```

---

## Step 7: Post-Deployment Verification

### 7.1 Check Frontend Build
```bash
# Verify Next.js build succeeded
curl https://yourtube.vercel.app

# Should return: HTML with "YourTube" title
```

### 7.2 Check Backend Health
```bash
# Get backend URL from Vercel deploy logs or settings
curl https://yourtube-api.vercel.app/api/health

# Expected response:
# {"status":"ok","mongodb":"connected"}
```

### 7.3 Test Frontend → Backend Connection
1. Visit https://yourtube.vercel.app
2. Open Developer Console (F12)
3. Check Network tab
4. Visit any page that makes API call
5. Verify requests go to your backend domain (not localhost)
6. Look for 200/201 responses

### 7.4 Test Authentication Flow
1. Go to login page
2. Try signing up
3. Verify OTP email received
4. Complete OTP verification
5. Check that login works

### 7.5 Test Payment Integration
1. Navigate to subscription page
2. Try to subscribe to a plan
3. Verify Razorpay payment modal appears
4. (Don't complete - test mode not available in production)

---

## Step 8: Monitoring & Logging

### Vercel Logs
- Vercel dashboard → project → Deployments → logs
- Can see real-time deployment logs
- Can see function logs if using serverless

### Backend Logs
Depending on deployment platform:
- **Heroku**: `heroku logs --tail`
- **Railway**: Dashboard shows logs
- **Render**: Dashboard shows logs
- **Self-hosted**: Check application logs via SSH

---

## Step 9: Troubleshooting

### 404 Errors on Frontend Pages
- **Cause**: Next.js build didn't generate pages
- **Fix**: Check build logs in Vercel dashboard
- **Verify**: `npm run build` runs successfully locally

### Backend API Returns 403/CORS Error
- **Cause**: CORS not configured correctly
- **Fix**: Update CORS_ALLOWED_ORIGINS in backend env vars to match frontend domain
- **Verify**: Request headers include `Origin` with correct domain

### OTP Emails Not Sending
- **Cause**: SMTP credentials invalid or SMTP not configured
- **Fix**: Verify SMTP_USER, SMTP_PASS in backend env vars
- **Test Locally**: `npm run start` and test with curl from terminal

### Database Connection Fails
- **Cause**: MongoDB IP not whitelisted, wrong connection string, or wrong credentials
- **Fix**: 
  1. Check MongoDB Atlas → Network Access → IP Whitelist
  2. Add your backend server's IP or 0.0.0.0 (allow all)
  3. Verify DB_URL in env vars matches exactly

### Razorpay Payments Fail
- **Cause**: Using test keys instead of production keys
- **Fix**: Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to production values
- **Verify**: Keys start with `rzp_live_` not `rzp_test_`

---

## Step 10: Maintenance & Updates

### Deploying Updates
1. Push changes to GitHub
2. Vercel auto-deploys (if auto-deploy enabled)
3. Monitor deployment in Vercel dashboard
4. Verify changes in production

### Rollback to Previous Version
1. Vercel dashboard → Deployments
2. Find previous successful deployment
3. Click the deployment → "Redeploy"
4. Vercel will rebuild and redeploy that version

### Updating Environment Variables
1. Vercel dashboard → Settings → Environment Variables
2. Edit variable value
3. Save
4. Redeploy (either auto-redeploy or manual redeploy needed)

### Database Backups
- MongoDB Atlas → Backup → Configure backup policy
- Recommend: Daily backups, 7-day retention minimum

---

## DEPLOYMENT ENVIRONMENT VARIABLES SUMMARY

### Frontend (Vercel Environment Variables)
```
BACKEND_URL = https://yourtube-api.vercel.app/api
NEXT_PUBLIC_BACKEND_URL = https://yourtube-api.vercel.app/api
```

### Backend (Vercel/Platform Environment Variables)
```
DB_URL = mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority
JWT_SECRET = <strong-random-32-char-string>
RAZORPAY_KEY_ID = rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxx
FRONTEND_URL = https://yourtube.vercel.app
CORS_ALLOWED_ORIGINS = https://yourtube.vercel.app
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = app-password
PORT = 3001
NODE_ENV = production
MONGO_DNS_SERVERS = 8.8.8.8,8.8.4.4,1.1.1.1
```

---

## Quick Reference Checklist

Before clicking "Deploy":
- [ ] JWT_SECRET generated and saved
- [ ] Razorpay production keys obtained
- [ ] MongoDB connection string ready
- [ ] SMTP email configured
- [ ] Backend deployment platform decided
- [ ] Frontend and backend URLs determined
- [ ] GitHub repository contains latest code
- [ ] .env files added to .gitignore
- [ ] All secrets stored in platform (not in code)

After deployment:
- [ ] Frontend loads without errors
- [ ] Backend health check returns OK
- [ ] Frontend can reach backend (no CORS errors)
- [ ] Authentication flow works (signup, OTP, login)
- [ ] Payment integration working (Razorpay)
- [ ] Emails are being sent (OTP, password reset)
- [ ] Database is accessible and populated
- [ ] Monitoring/logs accessible

---

## Support & Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/
- **Razorpay Docs**: https://razorpay.com/docs/

---

**Status**: Ready for Vercel Deployment ✅
