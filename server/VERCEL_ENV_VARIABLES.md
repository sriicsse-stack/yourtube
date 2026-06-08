# ========================================
# YOURTUBE BACKEND - VERCEL DEPLOYMENT
# Environment Variables Configuration
# ========================================
# 
# This file lists ALL environment variables needed for backend deployment.
# Copy these to Vercel Settings → Environment Variables
#
# ========================================
# CRITICAL - MUST CONFIGURE
# ========================================

# MongoDB Connection String (REQUIRED)
# Get from: MongoDB Atlas → Database → Connect → Drivers → Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/yourtube?retryWrites=true&w=majority
DB_URL=mongodb+srv://kit2925bad157_db_user:gAc3oCly8YgzsJ0g@cluster0.nenaf5k.mongodb.net/yourtube?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret for token signing (REQUIRED)
# Generate strong random string: openssl rand -base64 32
# This MUST be different from development value
JWT_SECRET=your_production_jwt_secret_change_this_to_random_string_min_32_chars

# Frontend URL for CORS and email links (REQUIRED)
# This is your Next.js frontend deployment URL
FRONTEND_URL=https://youtube-yglv.vercel.app

# CORS Allowed Origins (REQUIRED)
# List all domains that can access this API (comma-separated)
CORS_ALLOWED_ORIGINS=https://youtube-yglv.vercel.app

# Node Environment (REQUIRED)
NODE_ENV=production

# ========================================
# EMAIL/SMTP CONFIGURATION (OPTIONAL)
# Only needed if you want OTP and password reset features
# ========================================

# SMTP Server for sending emails
SMTP_HOST=smtp.gmail.com

# SMTP Port (use 587 for TLS, 465 for SSL)
SMTP_PORT=587

# Gmail or transactional email address
# If using Gmail: enable "Less secure apps" or use App Password
SMTP_USER=your-email@gmail.com

# Gmail App Password or SMTP password
SMTP_PASS=xxxx-xxxx-xxxx-xxxx

# ========================================
# PAYMENT INTEGRATION - RAZORPAY (OPTIONAL)
# Only needed if payment features are enabled
# ========================================

# Razorpay API Key ID
# Get from: https://dashboard.razorpay.com → Settings → API Keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx

# Razorpay API Key Secret
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# OPTIONAL/ADVANCED CONFIGURATION
# ========================================

# DNS servers for MongoDB SRV lookups (Optional - auto-configured)
MONGO_DNS_SERVERS=8.8.8.8,8.8.4.4,1.1.1.1

# Comment hide threshold (default: 2)
COMMENT_HIDE_THRESHOLD=2

# ========================================
# NOTES FOR VERCEL DEPLOYMENT
# ========================================
# 
# 1. Add these environment variables to Vercel:
#    - Go to Vercel Dashboard
#    - Select the backend project
#    - Settings → Environment Variables
#    - Add all REQUIRED variables above
#
# 2. Use Production Environment:
#    - Set environment to "Production" for each variable
#
# 3. Verify Deployment:
#    - After deployment, test: https://<backend-url>/api/health
#    - Should return: {"status":"ok","mongodb":"connected"}
#
# 4. Monitor Logs:
#    - Vercel Dashboard → Deployments → Logs
#
# 5. Common Issues:
#    - MongoDB not connecting: Check DB_URL and MongoDB Atlas IP whitelist
#    - CORS errors: Verify FRONTEND_URL in CORS_ALLOWED_ORIGINS
#    - JWT errors: Ensure JWT_SECRET is set and consistent
#
# ========================================
