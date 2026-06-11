# Local Videos to Firebase Migration Guide

## Overview

This guide explains how to migrate local video files from your server to Firebase Storage and update MongoDB records with Firebase URLs.

## Prerequisites

✅ **Required Setup:**
- Firebase Admin SDK initialized (check `server/.env` has `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET`)
- MongoDB connection working (`DB_URL` in `server/.env`)
- Local video files in `server/uploads/` directory
- Node.js and npm installed

## Current Status

### Local Videos Found
- **Videos Directory:** `server/uploads/`
- **Thumbnails Directory:** `server/uploads/thumbnails/`
- **Sample Files:**
  - `2025-06-25T06-09-29.296Z-vdo.mp4`
  - `2026-06-05T07-45-30.568Z-vdo.mp4`
  - `2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4`
  - `2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4`

### Corresponding Thumbnails
- `2026-06-05T07-45-30.568Z-vdo-1780745890522.png`
- `2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM-1780745898701.png`
- `2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM-1780765233860.png`

## Migration Process

### Step 1: Analyze Videos (Dry-Run)

Before performing the actual migration, preview what will be migrated:

```bash
cd server
npm run migrate:videos:analyze
```

**Output includes:**
- Total videos in database
- How many are ready for migration
- Which are already migrated
- Any missing files
- Total data size to migrate
- Detailed list of each video with file sizes

**Example Output:**
```
╔═══════════════════════════════════════════════════════════════════╗
║    LOCAL VIDEOS TO FIREBASE - PRE-MIGRATION ANALYSIS (DRY-RUN)  ║
╚═══════════════════════════════════════════════════════════════════╝

📊 SUMMARY:
  Total Videos in Database: 4
  📤 Ready for Migration: 4
  ⏭️  Already Migrated: 0
  ⚠️  Missing Video Files: 0
  💾 Total Data to Migrate: 2.45 GB

📝 DETAILED ANALYSIS:

✅ READY FOR MIGRATION:
  1. My First Video
     ID: 60d5ec49c1234567890abcde
     Current Path: uploads/2026-06-05T07-45-30.568Z-vdo.mp4
     Video Size: 850.50 MB
     Thumbnail: 125.75 KB

  2. Tutorial Video
     ID: 60d5ec49c1234567890abcdf
     Current Path: uploads/2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4
     Video Size: 950.25 MB
     Thumbnail: 98.50 KB
```

### Step 2: Execute Migration

Once you're satisfied with the analysis, proceed with the actual migration:

```bash
cd server
npm run migrate:videos
```

⏳ **This may take a while** depending on:
- Number of videos
- Size of video files
- Internet connection speed (uploading to Firebase)
- Firebase Storage performance

**Progress Indicators:**
- `📹 Uploading video: ...` - Currently uploading video file
- `🎨 Uploading thumbnail...` - Currently uploading thumbnail
- `💾 Updating MongoDB...` - Updating database record

**Example Output:**
```
╔═══════════════════════════════════════════════════════════════════╗
║    MIGRATING LOCAL VIDEOS TO FIREBASE STORAGE                   ║
╚═══════════════════════════════════════════════════════════════════╝

🔗 Connecting to MongoDB...
✅ MongoDB connected

🔍 Scanning MongoDB for videos with local filepaths...
📌 Found 4 total videos

📤 Starting migration process...

[1/4] Processing: My First Video
  📹 Uploading video: 2026-06-05T07-45-30.568Z-vdo.mp4...
  🎨 Uploading thumbnail...
  💾 Updating MongoDB...

[2/4] Processing: Tutorial Video
  📹 Uploading video: 2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4...
  🎨 Uploading thumbnail...
  💾 Updating MongoDB...

[3/4] Processing: Review Video
  📹 Uploading video: 2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4...
  💾 Updating MongoDB...

[4/4] Processing: Unboxing Video
  ⏭️  Already migrated (skipping)

╔═══════════════════════════════════════════════════════════════════╗
║         VIDEO MIGRATION TO FIREBASE - FINAL RESULTS              ║
╚═══════════════════════════════════════════════════════════════════╝

📊 SUMMARY:
  Total Videos Processed: 4
  ✅ Successfully Migrated: 3
  ⏭️  Already Migrated: 1
  ❌ Errors: 0
  ⚠️  Missing Files: 0

📝 DETAILED RESULTS:

1. VIDEO: My First Video
   ID: 60d5ec49c1234567890abcde
   Status: MIGRATED
   Original Path: uploads/2026-06-05T07-45-30.568Z-vdo.mp4
   ✅ Video URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/videos/2026-06-05T07-45-30.568Z-vdo_1686148500000_abc123.mp4?alt=media
   ✅ Thumbnail URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/thumbnails/2026-06-05T07-45-30.568Z-vdo-1780745890522_1686148505000_def456.png?alt=media

2. VIDEO: Tutorial Video
   ID: 60d5ec49c1234567890abcdf
   Status: MIGRATED
   Original Path: uploads/2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4
   ✅ Video URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/videos/2026-06-06T08-03-14.524Z-WhatsApp_Video_2026-06-06_at_1.31.33_PM_1686148506000_ghi789.mp4?alt=media
   ✅ Thumbnail URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/thumbnails/2026-06-06T08-03-14.524Z-WhatsApp_Video_2026-06-06_at_1.31.33_PM-1780745898701_1686148510000_jkl012.png?alt=media

3. VIDEO: Review Video
   ID: 60d5ec49c1234567890abc00
   Status: MIGRATED
   Original Path: uploads/2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4
   ✅ Video URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/videos/2026-06-06T17-00-33.837Z-WhatsApp_Video_2026-06-06_at_1.31.33_PM_1686148511000_mno345.mp4?alt=media
   ✅ Thumbnail URL:
      https://storage.googleapis.com/yourtube-b1d38.appspot.com/thumbnails/2026-06-06T17-00-33.837Z-WhatsApp_Video_2026-06-06_at_1.31.33_PM-1780765233860_1686148515000_pqr678.png?alt=media

4. VIDEO: Unboxing Video
   ID: 60d5ec49c1234567890abc01
   Status: ALREADY MIGRATED
   ℹ️  Already has Firebase URL

╔═══════════════════════════════════════════════════════════════════╗
║                    MIGRATION COMPLETE                            ║
╚═══════════════════════════════════════════════════════════════════╝
```

## MongoDB Database Updates

After successful migration, each video document is updated with:

```javascript
{
  filepath: "https://storage.googleapis.com/...",  // Firebase URL
  _firebaseVideoPath: "videos/filename_timestamp_random.mp4",  // For tracking
  customThumbnailUrl: "https://storage.googleapis.com/...",  // Firebase URL
  _firebaseThumbnailPath: "thumbnails/filename_timestamp_random.png"  // For tracking
}
```

**Fields Updated:**
- `filepath` - Original local path replaced with public Firebase URL
- `_firebaseVideoPath` - Firebase Storage path (for deletion/management)
- `customThumbnailUrl` - Thumbnail replaced with Firebase URL (if thumbnail exists)
- `_firebaseThumbnailPath` - Firebase thumbnail path (for deletion/management)

## What Happens to Local Files

⚠️ **Important:** The original local files in `server/uploads/` are **NOT deleted** automatically:

- **Reason:** Allows rollback if needed
- **Manual Cleanup:** You can delete the files after verifying migration success
- **Alternative:** Could be automated in future if desired

### Manual Cleanup (Optional)

```bash
# After verifying all videos work on Vercel/production

# Delete local videos (keep uploads directory)
rm server/uploads/*.mp4
rm server/uploads/*.webm
rm server/uploads/*.avi
# etc. for all video formats

# Delete thumbnails
rm server/uploads/thumbnails/*

# Keep directory structure
mkdir server/uploads/thumbnails 2>/dev/null || true
```

## Troubleshooting

### Issue: Firebase Upload Fails

**Symptoms:**
```
❌ Errors: 2
⚠️  Missing Files: 0
Status: ERROR
Error: Failed to upload file to Firebase Storage
```

**Solutions:**
1. Check Firebase credentials: `echo $FIREBASE_PROJECT_ID`
2. Verify `server/.env` has `FIREBASE_STORAGE_BUCKET`
3. Check Firebase Admin SDK installation: `npm list firebase-admin`
4. Verify Firebase bucket exists in Google Cloud Console
5. Check internet connection speed for large files

### Issue: Missing Video Files

**Symptoms:**
```
Status: missing_video_file
Error: Video file not found: filename.mp4
```

**Solutions:**
1. Verify files exist: `ls -la server/uploads/`
2. Check filename matches in MongoDB: `db.videofiles.find({}, {filename: 1, filepath: 1})`
3. Check if files were accidentally deleted
4. Look for symlinks or special characters in filenames

### Issue: MongoDB Connection Failed

**Symptoms:**
```
❌ Analysis failed: connect ECONNREFUSED
```

**Solutions:**
1. Verify MongoDB is running
2. Check `DB_URL` in `server/.env`
3. Verify database credentials
4. Test connection: `mongosh your-connection-string`

### Issue: Permission Denied

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**
1. Check file permissions: `ls -la server/uploads/`
2. Ensure Node.js process has read access
3. On Linux/Mac: `chmod 755 server/uploads`

## Performance Tips

🚀 **For Large Migrations:**

1. **Check Network Speed First**
   ```bash
   npm run migrate:videos:analyze  # Check total size first
   ```

2. **Run During Off-Peak Hours**
   - Fewer users online = faster uploads
   - Less network congestion

3. **Monitor Firebase Quota**
   - Firebase Storage has upload rate limits
   - Large files may timeout
   - Consider breaking migration into batches if needed

4. **Check Disk Space**
   - Needs space for temporary file reads
   - At least 10% of video file size free

## Verification

After migration completes, verify everything worked:

### 1. Check MongoDB Updates
```javascript
db.videofiles.find({filepath: /https:\/\//})
// Should return all migrated videos
```

### 2. Test Firebase URLs
```bash
# Copy a Firebase URL from the migration output and test:
curl -I "https://storage.googleapis.com/..."
# Should return HTTP 200 (not 404)
```

### 3. Test in Application
- Upload a new video (should use Firebase)
- Play existing migrated videos
- Check thumbnail loading
- Test download functionality

### 4. Check Storage Usage
- Visit [Firebase Console](https://console.firebase.google.com)
- Navigate to Storage
- Verify files are there with timestamps

## Next Steps

1. ✅ Run dry-run analysis: `npm run migrate:videos:analyze`
2. ✅ Review the output and confirm videos are ready
3. ✅ Execute migration: `npm run migrate:videos`
4. ✅ Monitor the progress
5. ✅ Verify all videos in web application
6. ✅ (Optional) Delete local files: `rm server/uploads/*.mp4` etc.
7. ✅ (Optional) Update deployment documentation

## File Changes Made

- ✅ `server/scripts/migrateLocalVideosToFirebase.js` - Main migration script
- ✅ `server/scripts/analyzeLocalVideos.js` - Dry-run analysis script
- ✅ `server/package.json` - Added npm scripts

## Questions?

Review the detailed output from:
- `npm run migrate:videos:analyze` - For analysis details
- `npm run migrate:videos` - For migration progress and results

Each script provides detailed feedback about what it's doing and any issues encountered.
