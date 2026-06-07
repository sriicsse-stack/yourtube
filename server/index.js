import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import http from "http";
import net from "net";
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
import { initSocket } from "./socket/index.js";
import { migrateLegacyThumbnails, generateMissingThumbnails } from "./controllers/video.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

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
app.use("/uploads", express.static(path.join("uploads")));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("You tube backend is working");
});

// Health endpoint under /api/health as required
app.get("/api/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    mongodb: dbState[mongoose.connection.readyState] || "unknown",
  });
});

// Mount APIs under /api/*
app.use("/api/user", userroutes);
// also expose common auth/user paths for compatibility
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

async function tryListen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListen);
      reject(err);
    };
    const onListen = () => {
      server.removeListener("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListen);
    server.listen(port);
  });
}

async function startServer() {
  setupDatabaseEventHandlers();

  try {
    await connectDatabase();
    await migrateLegacyThumbnails();
    await generateMissingThumbnails();
  } catch (error) {
    console.error("Server startup aborted: could not connect to MongoDB.");
    process.exit(1);
  }

  initSocket(httpServer);

  const startPort = Number(process.env.PORT || PORT);
  const maxAttempts = Number(process.env.PORT_FALLBACK_ATTEMPTS || 20);
  let boundPort = null;

  for (let i = 0; i < maxAttempts; i++) {
    const tryPort = startPort + i;
    try {
      // Before listening, quickly check TCP availability
      await new Promise((res, rej) => {
        const tester = net.createServer()
          .once("error", (err) => {
            rej(err);
          })
          .once("listening", () => {
            tester.close();
            res();
          })
          .listen(tryPort);
      });

      await tryListen(httpServer, tryPort);
      boundPort = tryPort;
      break;
    } catch (err) {
      if (err && err.code === "EADDRINUSE") {
        console.warn(`Port ${tryPort} in use, trying next port...`);
        continue;
      }
      console.error("Failed to bind server:", err);
      process.exit(1);
    }
  }

  if (!boundPort) {
    console.error(`Could not find available port after ${maxAttempts} attempts starting at ${startPort}`);
    process.exit(1);
  }

  console.log(`Server running on port ${boundPort}`);
  console.log(`WebRTC signaling ready via Socket.IO`);
}

startServer();
