# 📋 DEPLOYMENT CREDENTIALS TEMPLATE - YOURTUBE 2.0

**Use this file to organize your production credentials before deploying to Vercel**

---

## ⚠️ BEFORE YOU START

1. **DO NOT commit this file to git** - Store credentials securely
2. **Keep a backup** - Save this information in a password manager
3. **Rotate secrets periodically** - Update JWT_SECRET and passwords monthly
4. **Never share** - Don't share these credentials via email or chat

---

## STEP 1: Generate/Retrieve Required Values

### 1a: Generate JWT_SECRET
```bash
# Run this command and save the output
openssl rand -base64 32

# Output example:
# y3kL9mP2wQ5rT8xS4vD6eF7nG1hA2jB3cK4lM5oN6pR7tU8

JWT_SECRET: ________________________________
```

### 1b: Get MongoDB Atlas Connection String
1. Log in: https://cloud.mongodb.com
2. Database → Connect → Drivers
3. Copy connection string
4. Replace `<username>` and `<password>`

```
DB_URL: mongodb+srv://__________:__________@__________.mongodb.net/yourtube?retryWrites=true&w=majority
```

### 1c: Get Razorpay Production Keys
1. Log in: https://dashboard.razorpay.com
2. Settings → API Keys
3. Toggle to "Production" mode
4. Copy both keys

```
RAZORPAY_KEY_ID: rzp_live_____________________________

RAZORPAY_KEY_SECRET: ____________________________________
```

### 1d: Configure SMTP (Gmail)
1. Log in to Google Account: https://myaccount.google.com
2. Security → App Passwords (requires 2FA)
3. Select Mail & Windows Mail
4. Copy the 16-character app password

```
SMTP_HOST: smtp.gmail.com

SMTP_PORT: 587

SMTP_USER: your-email@gmail.com

SMTP_PASS: ____ ____ ____ ____  (16-character app password)
```

### 1e: Determine Your Deployment URLs
```
# After you deploy frontend to Vercel, you'll get a URL like:
FRONTEND_URL: https://yourtube.vercel.app
(or https://your-custom-domain.com)

# After you deploy backend, you'll get:
BACKEND_URL: https://yourtube-api.vercel.app
(or your backend platform URL)

# Complete backend URL with /api suffix:
BACKEND_URL_WITH_API: https://yourtube-api.vercel.app/api
```

---

## STEP 2: Frontend Environment Variables (Vercel)

**Add to Vercel Project → Settings → Environment Variables → Production**

```
Variable Name: BACKEND_URL
Value: https://yourtube-api.vercel.app/api
Environment: Production
[SAVE]

Variable Name: NEXT_PUBLIC_BACKEND_URL
Value: https://yourtube-api.vercel.app/api
Environment: Production
[SAVE]
```

✅ **Frontend deployment complete**

---

## STEP 3: Backend Environment Variables (Your Platform)

**Add to your backend deployment platform (Vercel/Heroku/Railway/Render)**

### CRITICAL VARIABLES (Must Set)

```
DB_URL: mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority

JWT_SECRET: <your-generated-32-char-secret>

RAZORPAY_KEY_ID: rzp_live_xxxxxxxxxxxxx

RAZORPAY_KEY_SECRET: xxxxxxxxxxxxxxxx

FRONTEND_URL: https://yourtube.vercel.app

CORS_ALLOWED_ORIGINS: https://yourtube.vercel.app

SMTP_HOST: smtp.gmail.com

SMTP_PORT: 587

SMTP_USER: your-email@gmail.com

SMTP_PASS: <16-char-app-password>
```

### OPTIONAL VARIABLES (Recommended)

```
NODE_ENV: production

PORT: 3001

MONGO_DNS_SERVERS: 8.8.8.8,8.8.4.4,1.1.1.1

COMMENT_HIDE_THRESHOLD: 2
```

✅ **Backend deployment complete**

---

## STEP 4: Verification Checklist

### Frontend Verification
- [ ] https://yourtube.vercel.app loads
- [ ] No console errors (F12)
- [ ] Network requests go to backend (not localhost)
- [ ] Login page appears

### Backend Verification
- [ ] Health check: `curl https://yourtube-api.vercel.app/api/health`
- [ ] Returns: `{"status":"ok","mongodb":"connected"}`

### Integration Verification
- [ ] Frontend loads
- [ ] Can reach backend (no 403 CORS error)
- [ ] Signup works
- [ ] OTP email received
- [ ] Login successful
- [ ] Can view videos
- [ ] Subscription page accessible

### Payment Testing
- [ ] Subscription page loads
- [ ] Can click "Subscribe" button
- [ ] Razorpay modal appears (Vercel/production version, not test)

---

## 🔐 SECURITY REMINDERS

### DO:
✅ Store credentials in password manager  
✅ Use strong random JWT_SECRET  
✅ Rotate secrets periodically  
✅ Use HTTPS for all URLs  
✅ Keep .env files out of git  
✅ Use Vercel's secret manager  

### DON'T:
❌ Commit .env to git  
❌ Share credentials via email  
❌ Use test API keys in production  
❌ Hardcode secrets in code  
❌ Allow CORS from * (wildcard)  
❌ Reuse old credentials  

---

## 📝 CREDENTIAL STORAGE

Save this information in a secure location:

### Password Manager Recommended:
- 1Password
- LastPass
- Bitwarden
- KeePass

### For Team Sharing:
- Vercel Secrets (built-in)
- AWS Secrets Manager
- HashiCorp Vault
- Encrypted shared document

---

## 🆘 TROUBLESHOOTING

### Issue: "MongoDB connection failed"
- [ ] Check DB_URL is correct
- [ ] Verify MongoDB Atlas IP whitelist includes your backend server
- [ ] Test: `mongo "your-db-url"`

### Issue: "CORS error when calling API"
- [ ] Check CORS_ALLOWED_ORIGINS matches frontend domain
- [ ] Check FRONTEND_URL matches frontend domain
- [ ] Verify frontend sending requests to backend URL (not localhost)

### Issue: "JWT verification failed"
- [ ] Check JWT_SECRET is set in backend
- [ ] Check frontend is sending valid token in Authorization header

### Issue: "OTP email not received"
- [ ] Verify SMTP_USER and SMTP_PASS work locally first
- [ ] Check SMTP_USER email address is correct
- [ ] For Gmail: verify app password is correct (not regular password)

### Issue: "Payment gateway not working"
- [ ] Verify RAZORPAY_KEY_ID starts with `rzp_live_` (production)
- [ ] Not `rzp_test_` (test keys won't work in production)

---

## 📋 FINAL DEPLOYMENT CHECKLIST

Before clicking "Deploy":
- [ ] All credentials filled in above
- [ ] MongoDB connection string verified
- [ ] JWT_SECRET generated (32 chars)
- [ ] Razorpay keys are PRODUCTION keys (not test)
- [ ] SMTP credentials work
- [ ] Frontend and backend URLs determined
- [ ] Code pushed to GitHub
- [ ] .env files NOT committed to git
- [ ] Vercel projects created
- [ ] Environment variables added to Vercel

After deployment:
- [ ] Frontend loads successfully
- [ ] Backend health check passes
- [ ] No CORS errors in console
- [ ] Authentication flow works
- [ ] OTP email received
- [ ] Payment gateway appears
- [ ] All features tested

---

## 📞 SUPPORT RESOURCES

**Vercel Docs**: https://vercel.com/docs  
**Next.js Docs**: https://nextjs.org/docs  
**MongoDB Docs**: https://docs.mongodb.com/  
**Razorpay Docs**: https://razorpay.com/docs/  
**Node.js Docs**: https://nodejs.org/docs/  

---

**Prepared for**: YouTube 2.0 Clone - Internship Project  
**Version**: 1.0  
**Last Updated**: 2026-06-07  

✅ Ready for deployment to Vercel
