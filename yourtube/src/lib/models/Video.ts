import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema({
  videotitle: String,
  filename: String,
  filepath: String,
  filetype: String,
  filesize: String,
  videochanel: String,
  Like: Number,
  views: Number,
  uploader: String,
}, { timestamps: true });

export default mongoose.models.Video || 
mongoose.model("Video", VideoSchema);
