# 🎬 Video Migration System - Quick Start Guide

## ✅ What Was Created

```
server/
├── scripts/
│   ├── ✨ migrateLocalVideosToFirebase.js    (Main migration script)
│   └── 🔍 analyzeLocalVideos.js              (Dry-run analysis)
├── ✅ MIGRATION_GUIDE.md                     (Comprehensive guide)
├── ✅ MIGRATION_CHECKLIST.md                 (Quick reference)
├── ✅ MIGRATION_IMPLEMENTATION_SUMMARY.md    (This summary)
└── package.json                              (Updated with new scripts)
```

## 🚀 Quick Start (3 Simple Steps)

### Step 1: Analyze (Preview - No Changes)
```bash
cd server
npm run migrate:videos:analyze
```

**Time:** 2-5 minutes  
**Output:** Shows what will be migrated

### Step 2: Review Output
Look for:
- ✅ Number of videos ready for migration
- ✅ Total data size
- ✅ Any missing files
- ✅ File sizes and details

### Step 3: Execute Migration
```bash
cd server
npm run migrate:videos
```

**Time:** 30 mins to several hours (depends on file size)  
**Output:** Firebase URLs and MongoDB update status

---

## 📊 What Gets Done

### Input
- 4 local video files in `server/uploads/`
- 3 thumbnail files in `server/uploads/thumbnails/`
- MongoDB documents with `filepath` pointing to local files

### Process
1. **Scan** - Query all MongoDB videos
2. **Find** - Locate actual files on disk
3. **Upload** - Send to Firebase Storage
4. **Get URL** - Generate public download links
5. **Update** - Save Firebase URLs in MongoDB
6. **Report** - Display detailed results

### Output
```
✅ Videos migrated to Firebase
✅ Firebase URLs generated
✅ MongoDB updated with new URLs
✅ Thumbnails migrated too
✅ Detailed results printed
```

---

## 📝 Example Output

### Analysis
```
📊 SUMMARY:
  Total Videos in Database: 4
  📤 Ready for Migration: 4
  ⏭️  Already Migrated: 0
  ⚠️  Missing Video Files: 0
  💾 Total Data to Migrate: 2.45 GB
```

### Migration Results
```
[1/4] Processing: My First Video
  📹 Uploading video: 2026-06-05T07-45-30.568Z-vdo.mp4...
  🎨 Uploading thumbnail...
  💾 Updating MongoDB...

📊 SUMMARY:
  ✅ Successfully Migrated: 3
  ⏭️  Already Migrated: 1
  ❌ Errors: 0

📝 DETAILED RESULTS:
1. VIDEO: My First Video
   Status: MIGRATED
   ✅ Video URL: https://storage.googleapis.com/.../video.mp4
   ✅ Thumbnail URL: https://storage.googleapis.com/.../thumbnail.png
```

---

## 🎯 What Each Script Does

### `migrateLocalVideosToFirebase.js`
- Connects to MongoDB
- Scans all videos
- For each local video:
  - Reads file from disk
  - Uploads to Firebase (video)
  - Uploads to Firebase (thumbnail)
  - Updates MongoDB with Firebase URLs
- Prints final report with success/error details

### `analyzeLocalVideos.js`
- Same scanning as migration
- But WITHOUT uploading or updating
- Shows what WOULD be migrated
- Identifies issues before they happen
- Perfect for "dry-run" preview

---

## 📋 MongoDB Updates

### Before Migration
```javascript
{
  filepath: "uploads/2026-06-05T07-45-30.568Z-vdo.mp4"  // Local
}
```

### After Migration
```javascript
{
  filepath: "https://storage.googleapis.com/bucket/videos/file.mp4",  // Firebase
  _firebaseVideoPath: "videos/filename_timestamp.mp4",
  customThumbnailUrl: "https://storage.googleapis.com/bucket/thumbnails/thumb.png",
  _firebaseThumbnailPath: "thumbnails/filename_timestamp.png"
}
```

---

## ⚙️ How It Works

### Smart File Detection
- Searches for exact filename match first
- Falls back to partial name matching
- Handles Windows paths: `uploads\file.mp4`
- Handles Unix paths: `uploads/file.mp4`
- Works with special characters

### Firebase Upload
- Generates unique filenames (prevents overwrites)
- Creates 100-year valid signed URLs (effectively permanent)
- Supports all video formats (MP4, WebM, AVI, MOV, MKV)
- Supports all image formats (PNG, JPG, GIF, WebP)

### Resume Capability
- Already-migrated videos (with Firebase URLs) auto-skipped
- Can re-run migration without problems
- Incomplete migrations can be resumed

---

## ✅ Pre-Migration Checklist

- [ ] Firebase set up (`FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` in `.env`)
- [ ] MongoDB connected (`DB_URL` in `.env`)
- [ ] npm dependencies installed (`npm install` in server)
- [ ] Videos exist in `server/uploads/`
- [ ] Thumbnails exist in `server/uploads/thumbnails/`
- [ ] Internet connection stable
- [ ] Sufficient disk space (at least 10% of video file size)

---

## 🔍 Verification After Migration

### 1. Check MongoDB
```javascript
db.videofiles.find({filepath: /https:\/\//})
// Should return all migrated videos
```

### 2. Test Firebase URLs
- Copy URL from migration output
- Paste in browser
- Should download/stream the video

### 3. Test in Application
- [ ] Upload new video (uses Firebase)
- [ ] Play migrated videos
- [ ] Check thumbnails load
- [ ] Test download function
- [ ] Video appears in channel

### 4. Firebase Console
- Visit https://console.firebase.google.com
- Storage tab
- Verify files appear

---

## ❓ Common Questions

**Q: Can I cancel if it's taking too long?**  
A: Yes, press Ctrl+C. Re-run later to resume (already-migrated videos auto-skipped).

**Q: Will local files be deleted?**  
A: No, they remain in `server/uploads/`. You can manually delete after verifying.

**Q: What if a video fails to upload?**  
A: Error is logged and reported. You can fix it and re-run migration.

**Q: Can I rollback?**  
A: Yes, MongoDB records remain. Local files still exist. Can revert database if needed.

**Q: How long will it take?**  
A: Depends on file size. Typically 20-30 mins for ~2.5 GB. Larger migrations may take 1-3 hours.

**Q: What if I have thousands of videos?**  
A: Script handles it. Will take longer but processes sequentially. Can run overnight.

---

## 🛠️ Troubleshooting

### Firebase Upload Fails
```
Error: Failed to upload file to Firebase Storage
```
**Solution:**
- Verify Firebase credentials in `.env`
- Check Firebase bucket exists
- Verify internet connection

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED
```
**Solution:**
- Verify MongoDB is running
- Check `DB_URL` in `.env`
- Test connection manually

### Missing Video Files
```
Status: missing_video_file
Error: Video file not found
```
**Solution:**
- Check files exist: `ls -la server/uploads/`
- Check for special characters in names
- Verify filename matches MongoDB

### Permission Denied
```
Error: EACCES: permission denied
```
**Solution:**
- Check file permissions: `chmod 755 server/uploads`
- Ensure Node.js has read access

---

## 📊 Files Analyzed

### Videos (4 files)
1. `2025-06-25T06-09-29.296Z-vdo.mp4`
2. `2026-06-05T07-45-30.568Z-vdo.mp4`
3. `2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4`
4. `2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM.mp4`

### Thumbnails (3 files)
1. `2026-06-05T07-45-30.568Z-vdo-1780745890522.png`
2. `2026-06-06T08-03-14.524Z-WhatsApp Video 2026-06-06 at 1.31.33 PM-1780745898701.png`
3. `2026-06-06T17-00-33.837Z-WhatsApp Video 2026-06-06 at 1.31.33 PM-1780765233860.png`

---

## 📚 Complete Documentation

- **MIGRATION_GUIDE.md** - Step-by-step detailed guide (this is your main reference)
- **MIGRATION_CHECKLIST.md** - Quick checklist for each step
- **MIGRATION_IMPLEMENTATION_SUMMARY.md** - Technical details and features

---

## 🎬 Next Steps

1. ✅ Run analysis: `npm run migrate:videos:analyze`
2. ✅ Review output
3. ✅ Execute migration: `npm run migrate:videos`
4. ✅ Monitor progress
5. ✅ Verify in Firebase Console
6. ✅ Test in application
7. ✅ (Optional) Delete local files

---

## 🎁 What You Get

✅ Automated video migration  
✅ Automated thumbnail migration  
✅ MongoDB document updates  
✅ Public Firebase URLs  
✅ Detailed progress reporting  
✅ Error handling  
✅ Resume capability  
✅ Comprehensive documentation  

**Total Setup Time:** 5 minutes  
**Total Migration Time:** 30 mins - 3 hours (depends on file size)  
**Result:** All videos on Firebase, Zero local dependencies  

---

**Ready to migrate? Run:** `npm run migrate:videos:analyze`
