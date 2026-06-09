import download from "../Modals/download.js";
import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
import path from "path";
import fs from "fs";
import os from "os";
import { uploadsDir as helperUploadsDir, isServerless as helperIsServerless } from "../filehelper/filehelper.js";
import { normalizeFilePath } from "../utils/normalize.js";

const PREMIUM_PLANS = ["BRONZE", "SILVER", "GOLD"];

export const downloadVideo = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.userId || req.body.userId;

  try {
    const user = await users.findById(userId);
    const vid = await video.findById(videoId);
    if (!user || !vid) {
      return res.status(404).json({ message: "User or video not found" });
    }

    const isPremium = PREMIUM_PLANS.includes(user.subscriptionPlan);
    const today = new Date().toDateString();
    const lastDl = user.lastDownloadDate
      ? new Date(user.lastDownloadDate).toDateString()
      : null;

    let count = user.downloadsToday || 0;
    if (lastDl !== today) count = 0;

    if (!isPremium && count >= 1) {
      return res.status(403).json({
        message: "Free users can download 1 video per day. Upgrade to Premium.",
      });
    }

    user.downloadsToday = count + 1;
    user.lastDownloadDate = new Date();
    await user.save();

    await download.create({
      userId,
      videoId,
      videoTitle: vid.videotitle,
    });

    // In serverless, files may not be present on disk. Prefer external storage.
    const defaultUploads = helperUploadsDir || path.join(process.cwd(), "uploads");
    let filePath = normalizeFilePath(vid.filepath || "").replace(/^\/+/, "");
    const isRemoteFile = /^(https?:)?\/\//i.test(filePath);
    if (isRemoteFile) {
      return res.redirect(filePath);
    }

    if (!path.isAbsolute(filePath)) {
      if (filePath.startsWith("uploads/")) {
        filePath = filePath.replace(/^uploads\//, "");
      }
      filePath = path.join(defaultUploads, filePath);
    }
    filePath = path.resolve(filePath);
    if (helperIsServerless && !filePath.startsWith(defaultUploads)) {
      // If the filepath is not within the configured uploads dir, we cannot access it in serverless.
      return res.status(503).json({ message: "Video downloads are not available in serverless deployment. Please use external storage." });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Video file not found on server" });
    }

    res.download(filePath, vid.filename || "video.mp4");
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Download failed" });
  }
};

export const getDownloadHistory = async (req, res) => {
  const userId = req.userId || req.params.userId;
  try {
    const history = await download
      .find({ userId })
      .populate("videoId")
      .sort({ downloadedAt: -1 });
    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDownloadCount = async (req, res) => {
  const userId = req.userId || req.params.userId;
  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toDateString();
    const lastDl = user.lastDownloadDate
      ? new Date(user.lastDownloadDate).toDateString()
      : null;
    let count = user.downloadsToday || 0;
    if (lastDl !== today) count = 0;

    const isPremium = PREMIUM_PLANS.includes(user.subscriptionPlan);

    return res.status(200).json({
      downloadsToday: count,
      limit: isPremium ? null : 1,
      isPremium,
      plan: user.subscriptionPlan,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
