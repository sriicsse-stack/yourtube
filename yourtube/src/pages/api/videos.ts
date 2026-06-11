import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Video from "@/lib/models/Video";
import { getVideoUrl } from "@/lib/api";
import { isPlayableVideo, verifyRemoteUrlAccessible } from "@/lib/videoValidation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const videos = await Video.find().sort({ createdAt: -1 });
      const validated = await Promise.all(
        videos.map(async (video) => {
          const playable = isPlayableVideo(video);
          if (!playable) {
            return null;
          }

          const sourceUrl = getVideoUrl(video.filepath || "");
          const accessible = await verifyRemoteUrlAccessible(sourceUrl);
          return accessible ? video : null;
        })
      );

      const playableVideos = validated.filter(Boolean);
      res.status(200).json(playableVideos);
      return;
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("API /api/videos error:", error);
    res.status(500).json({ error: error.message || "Database connection failed" });
  }
}
