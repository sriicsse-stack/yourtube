import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let admin = null;
let bucket = null;
let firebaseError = null;
let firebaseInitPromise = null;

/**
 * Lazy initialize Firebase Admin SDK on first use
 * If Firebase is unavailable, backend continues to run
 */
async function initializeFirebase() {
  // If already initialized successfully, return
  if (bucket) return;
  
  // If already failed, throw the error again
  if (firebaseError) throw firebaseError;
  
  // If initialization is in progress, wait for it
  if (firebaseInitPromise) {
    return firebaseInitPromise;
  }

  // Start initialization
  firebaseInitPromise = (async () => {
    try {
      // Load firebase-admin using require (it's a CommonJS module)
      admin = require("firebase-admin");

      if (!admin.apps || !admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }

      bucket = admin.storage().bucket();
      console.log("✓ Firebase Admin SDK initialized successfully");
    } catch (error) {
      firebaseError = error;
      console.error("✗ Firebase Admin SDK initialization failed:", error.message);
      console.error("  Backend will continue without Firebase Storage support");
      throw error;
    }
  })();

  return firebaseInitPromise;
}

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
    // Ensure Firebase is initialized before upload
    await initializeFirebase();

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
    console.error("Firebase upload error:", error.message);
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
    
    // Ensure Firebase is initialized before delete
    await initializeFirebase();
    
    const file = bucket.file(storagePath);
    await file.delete();
  } catch (error) {
    console.error("Firebase delete error:", error.message);
    // Don't throw - deleting non-existent files should not fail
  }
}

export default {
  uploadToFirebase,
  deleteFromFirebase,
};
