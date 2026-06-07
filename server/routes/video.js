import express from "express";
import {
  getallvideo,
  uploadvideo,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { authenticate } from "../middleware/auth.js";

const routes = express.Router();

// RESTful video routes mounted at /api/videos
routes.get("/", getallvideo);
routes.post(
  "/upload",
  authenticate,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  uploadvideo
);
routes.get("/:id", getVideoById);
routes.put("/:id", authenticate, updateVideo);
routes.delete("/:id", authenticate, deleteVideo);

export default routes;
