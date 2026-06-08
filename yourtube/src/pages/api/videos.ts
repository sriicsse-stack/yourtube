import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Video from "@/lib/models/Video";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const videos = await Video.find().sort({ createdAt: -1 });
      res.status(200).json(videos);
      return;
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("API /api/videos error:", error);
    res.status(500).json({ error: error.message || "Database connection failed" });
  }
}
