# ✅ VERCEL ENVIRONMENT VARIABLES - COMPLETE LIST

## For Frontend (yourtube project on Vercel)

Add these to Vercel project → Settings → Environment Variables → Production:

```
BACKEND_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com/api
```

**Notes:**
- Both must include `/api` suffix
- Replace `your-backend-domain.com` with actual backend URL
- Must use `https://` protocol
- Set Environment to: Production

---

## For Backend (API project on Vercel or hosting platform)

Add these to your deployment platform's environment variables:

### CRITICAL - Must Configure

```
# Database Connection
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority

# JWT Authentication (Generate strong random value!)
JWT_SECRET=<generate-using-openssl-rand-base64-32>

# Frontend Domain
FRONTEND_URL=https://yourtube.vercel.app

# CORS Configuration (allow only your frontend domain)
CORS_ALLOWED_ORIGINS=https://yourtube.vercel.app

# Email Configuration (required for OTP, password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (Razorpay production keys, NOT test keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### OPTIONAL but Recommended

```
# Environment
NODE_ENV=production

# DNS Configuration (if MongoDB connection fails)
MONGO_DNS_SERVERS=8.8.8.8,8.8.4.4,1.1.1.1

# Comment Moderation Threshold
COMMENT_HIDE_THRESHOLD=2

# Backend Port (set based on platform default)
PORT=3001
```

---

## Generation Commands

### Generate JWT_SECRET
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get Razorpay Keys
1. Log in: https://dashboard.razorpay.com
2. Settings → API Keys
3. Select "Production" (toggle from Test to Production)
4. Copy: Key ID (starts with `rzp_live_`)
5. Copy: Key Secret

### Get MongoDB Connection String
1. Log in: https://cloud.mongodb.com
2. Database → Connect
3. Select Drivers
4. Copy connection string
5. Replace `<username>` and `<password>`

### Configure SMTP
**Using Gmail:**
1. Enable 2-factor authentication on Gmail
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password as SMTP_PASS

**Using Other Email Services:**
- SendGrid: SMTP host `smtp.sendgrid.net`, port 587
- AWS SES: SMTP host `email-smtp.region.amazonaws.com`, port 587
- MailerSend: SMTP host `smtp.mailersend.net`, port 587

---

## Vercel Deployment Checklist

### Frontend (yourtube)

- [ ] GitHub repository connected
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node.js version: 18.x or 20.x
- [ ] Environment variables added:
  - [ ] BACKEND_URL
  - [ ] NEXT_PUBLIC_BACKEND_URL
- [ ] Deployment triggered
- [ ] Build successful (check logs)
- [ ] Verify site loads: https://yourtube.vercel.app
- [ ] Custom domain configured (if using)

### Backend (API)

- [ ] Deployment platform chosen (Vercel/Heroku/Railway/Render)
- [ ] Repository connected
- [ ] Build/start commands configured
- [ ] All environment variables set:
  - [ ] DB_URL
  - [ ] JWT_SECRET
  - [ ] RAZORPAY_KEY_ID
  - [ ] RAZORPAY_KEY_SECRET
  - [ ] SMTP_HOST/USER/PASS
  - [ ] FRONTEND_URL
  - [ ] CORS_ALLOWED_ORIGINS
  - [ ] NODE_ENV=production
- [ ] Deployment triggered
- [ ] Build successful
- [ ] Health check passes: `curl backend-url/api/health`

### Post-Deployment Testing

- [ ] Frontend loads at https://yourtube.vercel.app
- [ ] Backend health returns 200: `{status:"ok",mongodb:"connected"}`
- [ ] Frontend can reach backend (no CORS 403 errors)
- [ ] Login page loads
- [ ] Signup flow works
- [ ] OTP email received
- [ ] Authentication completes
- [ ] Homepage displays content
- [ ] Payment gateway appears on subscription page
- [ ] No console errors (check browser dev tools)

---

## Production URLs Summary

| Component | Development | Production |
|-----------|-------------|-----------|
| Frontend | http://localhost:3000 | https://yourtube.vercel.app |
| Backend | http://localhost:5000 | https://yourtube-api.vercel.app |
| Backend API | http://localhost:5000/api | https://yourtube-api.vercel.app/api |
| Database | localhost (or Atlas) | MongoDB Atlas production cluster |
| Email | Console log (dev) | SMTP configured |
| Payments | Razorpay Test | Razorpay Production |

---

## Security Notes

⚠️ **DO NOT:**
- Commit .env files to git
- Share JWT_SECRET publicly
- Use test API keys in production
- Allow CORS from `*` (wildcard)
- Hardcode secrets in source code

✅ **DO:**
- Store secrets in platform (Vercel/Heroku/etc)
- Rotate secrets periodically
- Use strong random strings for JWT_SECRET
- Monitor logs for errors
- Set up alerts for deployment failures

---

## Quick Start Commands

```bash
# Generate JWT Secret
openssl rand -base64 32

# Test MongoDB connection
node -e "const url = 'YOUR_DB_URL'; console.log(url)"

# Verify build locally
npm run build

# Verify lint locally
npm run lint
```

---

## Support

If deployment fails:
1. Check Vercel deployment logs (Deployments tab)
2. Check environment variables are set correctly
3. Verify backend URL is accessible
4. Verify database connection string is correct
5. Check CORS_ALLOWED_ORIGINS matches frontend URL
6. Verify SMTP credentials work (can test locally)

---

**Last Updated**: 2026-06-07
**Status**: Ready for Production Deployment ✅
