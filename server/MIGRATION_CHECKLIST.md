# Video Migration - Quick Reference Checklist

## ✅ Pre-Migration Checklist

- [ ] Firebase credentials configured (`FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` in `.env`)
- [ ] MongoDB connection working (`DB_URL` in `.env`)
- [ ] Node.js dependencies installed (`npm install` in server directory)
- [ ] Local videos present in `server/uploads/` (4 videos found)
- [ ] Thumbnails present in `server/uploads/thumbnails/` (3 thumbnails found)
- [ ] Internet connection stable (for uploading to Firebase)
- [ ] Sufficient disk space available

## 🚀 Migration Steps

### Phase 1: Analysis & Preview (No Changes)
```bash
cd server
npm run migrate:videos:analyze
```

**Expected Output:**
- Total videos found in database
- Number ready for migration
- Total data size
- List of each video and file status
- Any missing files identified

**✅ Review the analysis output before proceeding!**

### Phase 2: Execute Migration (Real Changes)
```bash
cd server
npm run migrate:videos
```

**During Migration:**
- Watch for `📹 Uploading video:` messages
- Watch for `🎨 Uploading thumbnail:` messages
- Watch for `💾 Updating MongoDB:` messages
- Note any errors that occur

**⏳ This may take 30 minutes to several hours depending on file sizes**

### Phase 3: Verification

**1. Check MongoDB Updates**
```bash
# Connect to MongoDB and verify updates
db.videofiles.find({filepath: /https:\/\//})
# Should return all migrated videos with Firebase URLs
```

**2. Test Firebase URLs**
- Copy a Firebase URL from migration output
- Paste in browser address bar
- Should download or stream the file

**3. Test in Application**
- [ ] Can upload new videos (should use Firebase)
- [ ] Can play migrated videos
- [ ] Thumbnails load correctly
- [ ] Download functionality works
- [ ] Video appears in user's channel

**4. Check Firebase Console**
- Visit https://console.firebase.google.com
- Navigate to Storage
- Verify files appear with correct folder structure

## 📊 Expected Migration Output Format

```
╔═══════════════════════════════════════════════════════════════════╗
║    MIGRATING LOCAL VIDEOS TO FIREBASE STORAGE                   ║
╚═══════════════════════════════════════════════════════════════════╝

[1/4] Processing: Video Title 1
  📹 Uploading video: filename.mp4...
  🎨 Uploading thumbnail...
  💾 Updating MongoDB...

[2/4] Processing: Video Title 2
  📹 Uploading video: filename.mp4...
  💾 Updating MongoDB...

... (more videos) ...

📊 SUMMARY:
  Total Videos Processed: 4
  ✅ Successfully Migrated: 3
  ⏭️  Already Migrated: 1
  ❌ Errors: 0
  ⚠️  Missing Files: 0

📝 DETAILED RESULTS:
1. VIDEO: Title
   Status: MIGRATED
   ✅ Video URL: https://storage.googleapis.com/...
   ✅ Thumbnail URL: https://storage.googleapis.com/...

... (more videos) ...
```

## ⚠️ Troubleshooting

### Firebase Upload Fails
- ❌ Error: "Failed to upload file to Firebase Storage"
- ✅ Solution: Verify Firebase credentials in `.env`
- ✅ Solution: Check Firebase bucket exists in Google Cloud Console
- ✅ Solution: Ensure internet connection is stable

### MongoDB Connection Failed
- ❌ Error: "connect ECONNREFUSED" or connection timeout
- ✅ Solution: Verify MongoDB is running
- ✅ Solution: Check `DB_URL` format in `.env`
- ✅ Solution: Test connection manually

### Missing Video Files
- ❌ Error: "Video file not found: filename.mp4"
- ✅ Solution: Check files exist: `ls -la server/uploads/`
- ✅ Solution: Verify filenames match MongoDB records
- ✅ Solution: Check for special characters or encoding issues

### Permission Denied
- ❌ Error: "EACCES: permission denied"
- ✅ Solution: Check file permissions: `chmod 755 server/uploads`
- ✅ Solution: Ensure Node.js process has read access

## 📋 What Gets Updated in MongoDB

For each migrated video:

```javascript
{
  filepath: "https://storage.googleapis.com/...",         // NEW: Firebase URL
  _firebaseVideoPath: "videos/filename_timestamp.mp4",    // NEW: For tracking
  customThumbnailUrl: "https://storage.googleapis.com/...", // NEW: Firebase URL
  _firebaseThumbnailPath: "thumbnails/filename_timestamp.png" // NEW: For tracking
}
```

## 🔍 How to Check Migration Status

### Option 1: During Migration
- Watch console output
- See real-time progress
- Errors appear immediately

### Option 2: After Migration (MongoDB Query)
```javascript
// Count migrated videos
db.videofiles.find({filepath: /https:\/\//}).count()

// Find videos still with local paths
db.videofiles.find({filepath: /uploads\//}).count()

// Find videos with errors (if any)
db.videofiles.find({filepath: {$exists: false}})
```

### Option 3: Firebase Console
- https://console.firebase.google.com
- Storage tab
- See all uploaded files with timestamps

## 🛑 If Migration Fails Partway Through

**Option 1: Resume Migration**
- Videos already migrated will be skipped (detected by Firebase URLs)
- Re-run: `npm run migrate:videos`
- Incomplete videos will be retried

**Option 2: Rollback (if needed)**
- MongoDB still has backups
- Local files still exist in `server/uploads/`
- Can restore from MongoDB backup

## ✅ Post-Migration Cleanup (Optional)

After confirming all videos work:

```bash
# Delete local video files (OPTIONAL - keep if unsure)
cd server
rm uploads/*.mp4
rm uploads/*.webm
rm uploads/*.avi
# etc. for all video formats

# Delete thumbnails
rm uploads/thumbnails/*

# Verify directory structure still exists
ls -la uploads/thumbnails/
```

**⚠️ Only delete after:**
- All videos play correctly
- Migration output shows 100% success
- Firebase Console shows all files
- Testing completed successfully

## 📞 Support

If issues occur:
1. Save console output (copy-paste the error)
2. Check MIGRATION_GUIDE.md for detailed solutions
3. Review MongoDB logs
4. Check Firebase Console for upload status
5. Verify network connectivity
6. Check file permissions and disk space

## 📅 Timeline Estimate

- Analysis (dry-run): **2-5 minutes**
- Small migration (< 100 MB): **5-10 minutes**
- Medium migration (100 MB - 1 GB): **20-30 minutes**
- Large migration (1 GB - 5 GB): **1-3 hours**
- Huge migration (> 5 GB): **3+ hours** (may need to split)

**Note:** Times depend on:
- File sizes
- Firebase upload speed
- MongoDB performance
- Network bandwidth
- Number of videos
