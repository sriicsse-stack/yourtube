import admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

/**
 * Upload a file to Firebase Storage
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} fileName - Original filename
 * @param {string} folder - Folder path in storage (e.g., "videos" or "thumbnails")
 * @param {string} mimeType - MIME type
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadToFirebase(fileBuffer, fileName, folder, mimeType) {
  try {
    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, extension);
    const uniqueName = `${nameWithoutExt}_${timestamp}_${randomStr}${extension}`;
    
    // Full path in Firebase Storage
    const storagePath = `${folder}/${uniqueName}`;
    
    // Create reference and upload
    const file = bucket.file(storagePath);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Get signed URL (valid for 100 years, effectively permanent public URL)
    const [publicUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
    });

    return {
      url: publicUrl,
      path: storagePath,
    };
  } catch (error) {
    console.error("Firebase upload error:", error);
    throw new Error(`Failed to upload file to Firebase Storage: ${error.message}`);
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {string} storagePath - Full path in Firebase Storage
 * @returns {Promise<void>}
 */
export async function deleteFromFirebase(storagePath) {
  try {
    if (!storagePath) return;
    const file = bucket.file(storagePath);
    await file.delete();
  } catch (error) {
    console.error("Firebase delete error:", error);
    // Don't throw - deleting non-existent files should not fail
  }
}

export default {
  uploadToFirebase,
  deleteFromFirebase,
};
