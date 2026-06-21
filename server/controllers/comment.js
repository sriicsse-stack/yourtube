import comment from "../Modals/comment.js";
import mongoose from "mongoose";import { createNotification } from "./notifications.js";
const PROHIBITED_CHARS = /[<>{}[\]\\|^~`]/;

function validateComment(text) {
  if (!text?.trim()) return "Comment cannot be empty";
  if (PROHIBITED_CHARS.test(text)) {
    return "Comment contains prohibited special characters";
  }
  return null;
}

export const postcomment = async (req, res) => {
  const { commentbody, city, language, parentId, ...rest } = req.body;
  const userId = req.userId || rest.userid;
  const error = validateComment(commentbody);
  if (error) return res.status(400).json({ message: error });

  try {
    const postcomment = new comment({
      ...rest,
      userid: userId,
      commentbody,
      city: city || "Unknown",
      language: language || "en",
      parentId: parentId || null,
    });
    await postcomment.save();
    // emit socket event for real-time update
    try {
      const io = (await import("../socket/index.js")).getIo();
      io?.emit("comment:posted", { videoId: postcomment.videoid?.toString(), comment: postcomment });
    } catch (err) {
      console.error("Failed to emit comment posted:", err);
    }
    return res.status(200).json({ comment: postcomment });
  } catch (error) {
    console.error("Post comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  const showHidden = req.query.showHidden === "1";
  try {
    const baseFilter = { videoid, parentId: null };
    if (!showHidden) baseFilter.hidden = { $ne: true };

    const comments = await comment
      .find(baseFilter)
      .populate("userid", "name email")
      .sort({ commentedon: -1 });
    const withReplies = await Promise.all(
      comments.map(async (c) => {
        const replyFilter = { parentId: c._id };
        if (!showHidden) replyFilter.hidden = { $ne: true };
        const replies = await comment
          .find(replyFilter)
          .populate("userid", "name email")
          .sort({ commentedon: 1 });
        return { ...c.toObject(), replies };
      })
    );
    return res.status(200).json(withReplies);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomments = async (req, res) => {
  const showHidden = req.query.showHidden === "1";
  try {
    const filter = {};
    if (!showHidden) filter.hidden = { $ne: true };

    const comments = await comment
      .find(filter)
      .populate("userid", "name email")
      .populate("videoid", "videotitle")
      .sort({ commentedon: -1 });

    return res.status(200).json(comments);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const c = await comment.findByIdAndDelete(_id);
    await comment.deleteMany({ parentId: _id });
    try {
      const io = (await import("../socket/index.js")).getIo();
      io?.emit("comment:deleted", { videoId: c?.videoid?.toString(), commentId: _id });
    } catch (err) {
      console.error("Failed to emit comment deleted:", err);
    }
    return res.status(200).json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const unhidecomment = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    const c = await comment.findByIdAndUpdate(id, { hidden: false }, { new: true });
    if (!c) {
      return res.status(404).json({ message: "Comment not found" });
    }
    try {
      const Moderation = (await import("../Modals/moderation.js")).default;
      await Moderation.create({
        commentId: c._id,
        action: "unhide",
        reason: "moderator_restored",
        metadata: { restoredBy: req.userId, timestamp: new Date() },
      });
    } catch (logErr) {
      console.error("Failed to create unhide moderation log:", logErr);
    }
    try {
      const io = (await import("../socket/index.js")).getIo();
      io?.emit("comment:updated", {
        videoId: c.videoid?.toString(),
        commentId: c._id,
        hidden: false,
      });
    } catch (err) {
      console.error("Failed to emit comment updated:", err);
    }
    return res.status(200).json({ comment: c });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  const error = validateComment(commentbody);
  if (error) return res.status(400).json({ message: error });

  try {
    const updated = await comment.findByIdAndUpdate(
      _id,
      { $set: { commentbody } },
      { new: true }
    );
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likeComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId || req.body.userId;
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    c.dislikes = c.dislikes.filter((d) => d.toString() !== userId);
    const alreadyLiked = c.likes.some((l) => l.toString() === userId);
    if (alreadyLiked) {
      c.likes = c.likes.filter((l) => l.toString() !== userId);
    } else {
      c.likes.push(userId);
    }
    await c.save();
    return res.status(200).json({ likes: c.likes.length, dislikes: c.dislikes.length });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikeComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId || req.body.userId;
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });
    c.likes = c.likes.filter((l) => l.toString() !== userId);
    const alreadyDisliked = c.dislikes.some((d) => d.toString() === userId);
    if (alreadyDisliked) {
      c.dislikes = c.dislikes.filter((d) => d.toString() !== userId);
    } else {
      c.dislikes.push(userId);
    }

    // Moderation policy:
    // - If dislikes reach a low threshold (flag), mark as flagged for moderator review but do not auto-delete/hide.
    // - Only hide a comment when dislikes reach a higher hide threshold.
    const FLAG_THRESHOLD = Number(process.env.COMMENT_FLAG_THRESHOLD || 2);
    const HIDE_THRESHOLD = Number(process.env.COMMENT_HIDE_THRESHOLD || 5);

    if (c.dislikes.length >= FLAG_THRESHOLD && !c.flagged) {
      c.flagged = true;
      try {
        const Moderation = (await import("../Modals/moderation.js")).default;
        await Moderation.create({
          commentId: c._id,
          action: "flagged",
          reason: "Exceeded dislike flag threshold",
          metadata: { dislikes: c.dislikes.length },
        });
      } catch (logErr) {
        console.error("Failed to create moderation log:", logErr);
      }
      await c.save();
      const io = (await import("../socket/index.js")).getIo();
      io?.emit("comment:updated", { videoId: c.videoid?.toString(), commentId: c._id, likes: c.likes.length, dislikes: c.dislikes.length, flagged: c.flagged || false, hidden: c.hidden || false });
      return res.status(200).json({ flagged: true, reason: "Flagged for moderator review" });
    }

    if (c.dislikes.length >= HIDE_THRESHOLD) {
      c.hidden = true;
      try {
        const Moderation = (await import("../Modals/moderation.js")).default;
        await Moderation.create({
          commentId: c._id,
          action: "hidden",
          reason: "Exceeded hide threshold",
          metadata: { dislikes: c.dislikes.length },
        });
      } catch (logErr) {
        console.error("Failed to create moderation log:", logErr);
      }
      await c.save();
      const io = (await import("../socket/index.js")).getIo();
      io?.emit("comment:updated", { videoId: c.videoid?.toString(), commentId: c._id, likes: c.likes.length, dislikes: c.dislikes.length, hidden: true });
      return res.status(200).json({ hidden: true, reason: "Too many dislikes" });
    }

    await c.save();
    const io = (await import("../socket/index.js")).getIo();
    io?.emit("comment:updated", { videoId: c.videoid?.toString(), commentId: c._id, likes: c.likes.length, dislikes: c.dislikes.length, flagged: c.flagged || false, hidden: c.hidden || false });
    return res.status(200).json({ likes: c.likes.length, dislikes: c.dislikes.length });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const { id } = req.params;
  const { targetLang = "en" } = req.body;
  try {
    const c = await comment.findById(id);
    if (!c) return res.status(404).json({ message: "Comment not found" });
    // Use automatic detection on the remote translate service; preserve original comment body.
    const text = encodeURIComponent(c.commentbody);
    const url = `https://api.mymemory.translated.net/get?q=${text}&langpair=auto|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = data?.responseData?.translatedText || c.commentbody;
    // try to read detected language from the response if available
    const detected = (data && (data.responseData?.match?.length ? data.responseData.match[0].segment : null)) || c.language || "und";

    c.translatedText = translated;
    // store detected language if available (non-destructive)
    try {
      if (!c.detectedLanguage && typeof detected === "string") c.detectedLanguage = detected;
    } catch (e) {
      /* ignore */
    }
    await c.save();

    return res.status(200).json({ translatedText: translated, detectedLanguage: c.detectedLanguage || c.language || null });
  } catch (error) {
    return res.status(500).json({ message: "Translation failed" });
  }
};

export const replyComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId || req.body.userid;
  const { usercommented, commentbody, city } = req.body;
  const error = validateComment(commentbody);
  if (error) return res.status(400).json({ message: error });

  try {
    const parent = await comment.findById(id);
    if (!parent) return res.status(404).json({ message: "Parent comment not found" });

    const reply = await comment.create({
      userid: userId,
      videoid: parent.videoid,
      parentId: id,
      commentbody,
      usercommented,
      city: city || "Unknown",
    });

    if (parent.userid && parent.userid.toString() !== userId) {
      try {
        await createNotification({
          userId: parent.userid,
          type: "Comment Reply",
          message: `${usercommented || "Someone"} replied to your comment.`,
          metadata: { videoId: parent.videoid, commentId: parent._id, replyId: reply._id },
        });
      } catch (notificationErr) {
        console.error("Failed to create comment reply notification:", notificationErr);
      }
    }

    return res.status(201).json(reply);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
