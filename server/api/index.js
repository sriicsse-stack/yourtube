import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import mongoose from "mongoose";
import userroutes from "../routes/auth.js";
import videoroutes from "../routes/video.js";
import likeroutes from "../routes/like.js";
import watchlaterroutes from "../routes/watchlater.js";
import historyrroutes from "../routes/history.js";
import commentroutes from "../routes/comment.js";
import downloadroutes from "../routes/download.js";
import paymentroutes from "../routes/payment.js";
import moderationroutes from "../routes/moderation.js";
import subscriptionroutes from "../routes/subscriptions.js";
import notificationroutes from "../routes/notifications.js";
import { connectDatabase } from "../config/database.js";

dotenv.config({ path: "../.env" });

const app = express();

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(bodyParser.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("You Tube backend is working");
});

// Health endpoint - critical for monitoring
app.get("/api/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    mongodb: dbState[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// Mount APIs under /api/*
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

// Connect to MongoDB on first request (Vercel cold start)
let mongoConnected = false;

async function ensureDbConnection() {
  if (mongoConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
      mongoConnected = true;
    }
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw new Error("Database connection failed");
  }
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    res.status(503).json({ error: "Database connection failed" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
