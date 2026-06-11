# Firebase Credentials Setup

## ⚠️ Issue: Firebase Admin SDK needs Service Account Credentials

The migration scripts require Firebase Admin SDK credentials to upload files to Cloud Storage.

## ✅ Solution: Download Service Account Key

### Step 1: Go to Firebase Console
Visit: https://console.firebase.google.com/project/yourtube-b1d38/settings/serviceaccounts/adminsdk

### Step 2: Select Node.js
- Click on "Service Accounts" tab
- Make sure "Node.js" is selected
- Click "Generate new private key"

### Step 3: Save the Credentials File
- A JSON file will download (e.g., `yourtube-b1d38-firebase-adminsdk-xxxxx.json`)
- Move it to: `server/firebase-credentials.json`

```bash
# On your computer, move the downloaded file to:
server/firebase-credentials.json
```

### Step 4: Update .env File

Add this line to `server/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
```

### Step 5: Verify Setup

```bash
cd server
# Check if the file exists
ls -la firebase-credentials.json

# Try running analysis again
npm run migrate:videos:analyze
```

## 📝 What the Credentials File Contains

The JSON file contains:
- Service account email
- Private key for authentication
- Project ID
- Client ID

⚠️ **SECURITY WARNING:**
- Never commit this file to Git
- Add it to `.gitignore`
- Keep the private key secret
- Don't share the credentials file

## Quick Setup Script

If you have the credentials file ready, here's what to do:

1. Download service account JSON from Firebase Console
2. Save it as `server/firebase-credentials.json`
3. Add to `server/.env`: `GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json`
4. Run: `npm run migrate:videos:analyze`

## Troubleshooting

### Error: "GOOGLE_APPLICATION_CREDENTIALS not found"
- Verify the file path is correct
- Check file exists: `ls server/firebase-credentials.json`
- Make sure path is relative to current working directory

### Error: "Invalid service account"
- Download a fresh service account key from Firebase Console
- Ensure it's the complete JSON file
- Check for incomplete downloads or corruption

### Error: "Permission denied"
- Ensure the service account has "Editor" or "Storage Admin" role
- Check Firebase project IAM settings

## Alternative: Use gcloud Authentication

If you have Google Cloud CLI installed:

```bash
gcloud auth application-default login
```

This sets up application default credentials without needing a JSON file.

## Next Steps

After setting up credentials:

```bash
# Verify credentials work
npm run migrate:videos:analyze

# Then run migration
npm run migrate:videos
```

## Support

If you need help:
1. Check Firebase Console for the service account
2. Verify the JSON file is not corrupted
3. Ensure GOOGLE_APPLICATION_CREDENTIALS path is correct
4. Check server/.env has the variable set
