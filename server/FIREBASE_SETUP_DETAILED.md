# Firebase Service Account Setup - Step by Step

## TL;DR (Quick Setup)

1. Go to: https://console.firebase.google.com/project/yourtube-b1d38/settings/serviceaccounts/adminsdk
2. Click "Generate new private key" → Download JSON file
3. Save as: `server/firebase-credentials.json`
4. Add to `server/.env`: `GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json`
5. Run: `npm run migrate:videos`

---

## Detailed Steps

### Step 1: Open Firebase Console

**URL:** https://console.firebase.google.com/project/yourtube-b1d38/settings/serviceaccounts/adminsdk

Or manually:
1. Visit https://console.firebase.google.com
2. Click on your project: "yourtube-b1d38"
3. Go to Settings (⚙️ icon, top right)
4. Click "Service Accounts" tab

### Step 2: Download Service Account Key

**Screenshot guide:**
```
┌─ Firebase Console ───────────────────────────────────┐
│ yourtube-b1d38 > Settings > Service Accounts          │
├──────────────────────────────────────────────────────┤
│ SERVICE ACCOUNTS                                     │
│                                                       │
│ Language: [Node.js ✓]                               │
│                                                       │
│ [ Generate new private key ] ← CLICK THIS BUTTON    │
│                                                       │
│ Previous keys:                                       │
│ • yourtube-b1d38-firebase-adminsdk-xxxxx.json       │
│   Created: ...                                      │
└──────────────────────────────────────────────────────┘
```

**What happens:**
- Browser will download a JSON file
- File name: `yourtube-b1d38-firebase-adminsdk-[random].json`
- File size: ~1.5 KB

### Step 3: Save the Downloaded File

**Option A: Manual Copy**
1. Find the downloaded file in your Downloads folder
2. Copy it to: `server/firebase-credentials.json`

```
Downloads/
└── yourtube-b1d38-firebase-adminsdk-xxxxx.json  ← Downloaded

↓ Move to:

server/
└── firebase-credentials.json  ← Saved here
```

**Option B: Command Line (PowerShell)**
```powershell
# On Windows
$downloadPath = "$env:USERPROFILE\Downloads\yourtube-b1d38-firebase-adminsdk-*.json"
Copy-Item $downloadPath -Destination "C:\Users\sri\Downloads\intern\you_tube2.0-main\you_tube2.0-main\server\firebase-credentials.json"
```

### Step 4: Verify File Contents

The JSON file should contain:
```json
{
  "type": "service_account",
  "project_id": "yourtube-b1d38",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

✅ Should have these fields:
- `type`: "service_account"
- `project_id`: "yourtube-b1d38"
- `private_key_id`
- `private_key`
- `client_email`

### Step 5: Update .env File

Open `server/.env` and add this line:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
```

**Example .env:**
```env
DB_URL=mongodb+srv://...
JWT_SECRET=test123
PORT=5000
FIREBASE_PROJECT_ID=yourtube-b1d38
FIREBASE_STORAGE_BUCKET=yourtube-b1d38.appspot.com
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
```

### Step 6: Verify Setup

Run the verification script:

```bash
cd server
node scripts/setup-firebase.js
```

**Expected output:**
```
✅ GOOGLE_APPLICATION_CREDENTIALS environment variable is set
✅ firebase-credentials.json file exists in server directory
✅ GOOGLE_APPLICATION_CREDENTIALS is configured in .env
✅ Firebase credentials are properly configured!
```

### Step 7: Run Migration

Now you can run the migration:

```bash
# Preview first (dry-run)
npm run migrate:videos:analyze

# Then run the actual migration
npm run migrate:videos
```

---

## ⚠️ Security Best Practices

### DO:
- ✅ Keep `firebase-credentials.json` secure
- ✅ Add to `.gitignore`
- ✅ Use environment variables in production
- ✅ Rotate credentials regularly

### DON'T:
- ❌ Commit to Git
- ❌ Share with others
- ❌ Upload to GitHub/public repos
- ❌ Put in browser/frontend code
- ❌ Share via email or chat

### Add to `.gitignore`

```bash
echo "firebase-credentials.json" >> server/.gitignore
```

---

## Troubleshooting

### Problem: "GOOGLE_APPLICATION_CREDENTIALS not found"
**Solution:**
- Verify file path is correct
- Check path is relative to current working directory
- Verify file exists: `ls server/firebase-credentials.json`

### Problem: "Invalid service account"
**Solution:**
- Download a fresh service account key
- Ensure it's the complete JSON (not corrupted)
- Verify all fields are present
- Check for UTF-8 encoding

### Problem: "Permission denied"
**Solution:**
- Ensure service account has Storage Admin role
- Check IAM settings in Firebase Console
- Verify the key is for the correct project

### Problem: Can't find Firebase Console
**Direct URL:** https://console.firebase.google.com/project/yourtube-b1d38/settings/serviceaccounts/adminsdk

Backup steps:
1. Go to https://console.firebase.google.com
2. Select project "yourtube-b1d38"
3. Click ⚙️ Settings icon (top right)
4. Click "Service Accounts" tab

### Problem: "File is corrupted"
**Solution:**
- Download again from Firebase Console
- Check file size is ~1.5 KB
- Verify JSON structure with a JSON validator
- Ensure it's not cut off

---

## What Happens With Credentials

The `firebase-credentials.json` file contains:
- Service account email
- Private RSA key (256-line key)
- Project configuration
- API endpoints

It's used for:
- ✅ Authenticating with Google Cloud
- ✅ Uploading files to Cloud Storage
- ✅ Reading/writing database
- ✅ Managing security rules

It provides:
- Full admin access to the Firebase project
- Can read/write/delete any data
- Can manage users and auth
- Can modify security rules

**Therefore: KEEP IT SECRET! 🔐**

---

## If You Still Have Issues

1. Check that you're logged into the correct Google account
2. Verify the Firebase project is "yourtube-b1d38"
3. Ensure you have "Editor" or "Owner" role in the project
4. Try generating a new service account key
5. Check that the file fully downloaded (not interrupted)

---

## Next Steps

Once you have the credentials file set up:

```bash
cd server

# Verify setup
node scripts/setup-firebase.js

# Preview migration
npm run migrate:videos:analyze

# Run migration
npm run migrate:videos
```

---

**Need help?** Refer to:
- `MIGRATION_GUIDE.md` - Full migration guide
- `MIGRATION_CHECKLIST.md` - Step-by-step checklist
- `FIREBASE_CREDENTIALS_SETUP.md` - Credentials overview

---

**Status:** ✅ Ready to download credentials and proceed with migration
