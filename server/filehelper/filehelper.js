"use strict";
import fs from "fs";
import path from "path";
import multer from "multer";

const videosDir = path.resolve("uploads");
const thumbnailsDir = path.resolve("uploads", "thumbnails");
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "thumbnailFile") {
      cb(null, thumbnailsDir);
    } else {
      cb(null, videosDir);
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const filefilter = (req, file, cb) => {
  if (file.fieldname === "file") {
    cb(null, file.mimetype.startsWith("video/"));
    return;
  }

  if (file.fieldname === "thumbnailFile") {
    cb(null, file.mimetype.startsWith("image/"));
    return;
  }

  cb(null, false);
};

const upload = multer({ storage: storage, fileFilter: filefilter });
export default upload;
