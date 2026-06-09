import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import paymentroutes from "./routes/payment.js";
import moderationroutes from "./routes/moderation.js";
import subscriptionroutes from "./routes/subscriptions.js";
import notificationroutes from "./routes/notifications.js";
import { connectDatabase, setupDatabaseEventHandlers } from "./config/database.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { uploadsDir as helperUploadsDir, isServerless as helperIsServerless } from "./filehelper/filehelper.js";
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || helperUploadsDir || path.join(__dirname, "uploads"));
const isServerless = !!helperIsServerless;

const app = express();

const originsRaw =
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000,http://localhost:3001";

const allowedOrigins = originsRaw
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
// Register uploads static middleware when an uploads directory is configured.
// In serverless deployments this is typically /tmp/uploads or an external mount.
if (uploadsDir) {
  app.use("/uploads", express.static(uploadsDir));
}

// Explicit handler for /uploads/* to serve files (required in serverless where Vercel routes intercept)
app.get("/uploads/:filepath(*)", async (req, res) => {
  try {
    const { filepath } = req.params;
    if (!filepath) {
      return res.status(400).json({ error: "File path required" });
    }
    
    // Prevent directory traversal attacks
    if (filepath.includes("..") || filepath.startsWith("/")) {
      return res.status(400).json({ error: "Invalid file path" });
    }
    
    const fullPath = path.join(uploadsDir, filepath);
    
    // Verify the resolved path is still within uploadsDir
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (e) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Stream the file
    res.sendFile(fullPath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error serving file" });
        }
      }
    });
  } catch (error) {
    console.error("File serving error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("You tube backend (serverless) is working");
});

app.get("/api/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    mongodb: dbState[mongoose.connection.readyState] || "unknown",
  });
});

app.use("/api/user", userroutes);
app.use("/api/auth", userroutes);
app.use("/api/users", userroutes);
app.use("/api/videos", videoroutes);
app.use("/api/like", likeroutes);
app.use("/api/watch", watchlaterroutes);
app.use("/api/history", historyrroutes);
app.use("/api/comment", commentroutes);
app.use("/api/download", downloadroutes);
app.use("/api/payment", paymentroutes);
app.use("/api/moderation", moderationroutes);
app.use("/api/subscriptions", subscriptionroutes);
app.use("/api/notifications", notificationroutes);

let dbConnecting = false;
export async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) return;
  if (dbConnecting) return;
  dbConnecting = true;
  setupDatabaseEventHandlers();
  try {
    await connectDatabase();
  } finally {
    dbConnecting = false;
  }
}

export { app };
