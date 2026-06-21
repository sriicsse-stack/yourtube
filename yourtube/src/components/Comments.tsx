import React, { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { ThumbsDown, ThumbsUp, Languages, MapPin, Globe, MessageCircle } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city?: string;
  translatedText?: string;
  detectedLanguage?: string | null;
  flagged?: boolean;
  likes?: string[];
  dislikes?: string[];
  replies?: Comment[];
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "gu", label: "Gujarati" },
  { code: "mr", label: "Marathi" },
  { code: "ur", label: "Urdu" },
];

// Helper function to get full language name
const getLanguageName = (code?: string | null): string => {
  if (!code) return "Unknown";
  const language = LANGUAGES.find((l) => l.code === code.toLowerCase());
  return language?.label || code.toUpperCase();
};

type SocketPayload = { videoId?: string; comment?: Comment };

const Comments = ({ videoId }: { videoId: string }): React.ReactElement => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [translateLanguage, setTranslateLanguage] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [translatingComments, setTranslatingComments] = useState<string[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLanguage = window.localStorage.getItem("yourtube.commentTranslateLanguage");
    if (storedLanguage) {
      setTranslateLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("yourtube.commentTranslateLanguage", translateLanguage);
  }, [translateLanguage]);

  const loadComments = useCallback(async (): Promise<void> => {
    if (!videoId) return;
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (videoId) loadComments();
    const socket = getSocket();
    const onPosted = (payload: SocketPayload) => {
      if (payload?.videoId === videoId) {
        // prepend new comment if comment exists
        if (payload.comment) setComments((prev) => [payload.comment as Comment, ...prev]);
      }
    };
    const onUpdated = (payload: SocketPayload) => {
      if (payload?.videoId === videoId) {
        // reload comments for simplicity
        loadComments();
      }
    };
    const onDeleted = (payload: SocketPayload) => {
      if (payload?.videoId === videoId) loadComments();
    };

    socket?.on("comment:posted", onPosted);
    socket?.on("comment:updated", onUpdated);
    socket?.on("comment:deleted", onDeleted);
    return () => {
      socket?.off("comment:posted", onPosted);
      socket?.off("comment:updated", onUpdated);
      socket?.off("comment:deleted", onDeleted);
    };
  }, [videoId, loadComments]);

  

  const handleSubmitComment = async (): Promise<void> => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        language: "und",
      });
      if (res.data.comment) {
        setComments([res.data.comment, ...comments]);
        setNewComment("");
        toast.success("Comment added");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string): Promise<any> => {
    if (!user) return;
    const res = await axiosInstance.post(`/comment/like/${id}`, { userId: user._id });
    loadComments();
    return res.data;
  };

  const handleDislike = async (id: string): Promise<void> => {
    if (!user) return;
    const res = await axiosInstance.post(`/comment/dislike/${id}`, { userId: user._id });
    if (res.data.flagged) {
      toast.info("Comment flagged for moderator review");
    } else if (res.data.hidden) {
      toast.info("Comment hidden due to excessive dislikes");
    }
    loadComments();
  };

  const updateCommentTranslation = (
    commentsList: Comment[],
    id: string,
    translatedText: string,
    detectedLanguage: string | null
  ): Comment[] =>
    commentsList.map((comment) => {
      if (comment._id === id) {
        return { ...comment, translatedText, detectedLanguage };
      }
      if (comment.replies?.length) {
        return {
          ...comment,
          replies: updateCommentTranslation(comment.replies, id, translatedText, detectedLanguage),
        };
      }
      return comment;
    });

  const handleTranslate = async (id: string, targetLang: string): Promise<string | undefined> => {
    setTranslatingComments((prev) => [...prev, id]);
    try {
      const res = await axiosInstance.post(`/comment/translate/${id}`, { targetLang });
      const translatedText = res.data.translatedText;
      const detectedLanguage = res.data.detectedLanguage || null;
      console.log("handleTranslate", {
        commentId: id,
        targetLang,
        translatedText,
        detectedLanguage,
        alreadyInTargetLanguage: res.data.alreadyInTargetLanguage,
      });
      setComments((prev) => updateCommentTranslation(prev, id, translatedText, detectedLanguage));
      await loadComments();
      toast.success(
        res.data.alreadyInTargetLanguage
          ? `Comment already in ${LANGUAGES.find((l) => l.code === targetLang)?.label || targetLang}`
          : "Comment translated"
      );
      return translatedText;
    } catch (error: any) {
      console.error("Translation request failed", error);
      toast.error(error?.response?.data?.message || "Translation failed");
      throw error;
    } finally {
      setTranslatingComments((prev) => prev.filter((commentId) => commentId !== id));
    }
  };

  const handleReply = async (parentId: string): Promise<void> => {
    if (!user || !replyText.trim()) return;
    try {
      await axiosInstance.post(`/comment/reply/${parentId}`, {
        userid: user._id,
        usercommented: user.name,
        commentbody: replyText,
      });
      setReplyText("");
      setReplyTo(null);
      loadComments();
      toast.success("Reply posted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reply");
    }
  };

  const renderComment = (comment: Comment, isReply = false): React.ReactElement => {
    const commentTimeAgo = formatDistanceToNow(new Date(comment.commentedon), { addSuffix: false });
    const displayCity = comment.city && !/^unknown/i.test(comment.city.trim()) 
      ? comment.city.trim() 
      : "Unknown Location";
    const originalLanguage = getLanguageName(comment.detectedLanguage);

    return (
      <div key={comment._id} className={`flex gap-4 ${isReply ? "ml-12 mt-4" : ""}`}>
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback>{comment.usercommented?.[0] || "?"}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          {/* Comment Header: User • City • Time */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{comment.usercommented}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {displayCity}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{commentTimeAgo} ago</span>
            {comment.flagged && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded font-medium">
                  Flagged
                </span>
              </>
            )}
          </div>

          {/* Original Comment Body */}
          {!comment.translatedText ? (
            <p className="text-sm leading-relaxed text-foreground mb-3 break-words">
              {comment.commentbody}
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground mb-3 break-words">
              {comment.commentbody}
            </p>
          )}

          {/* Translated Comment Container */}
          {comment.translatedText && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                  🌐 Translated Comment
                </span>
                {comment.detectedLanguage && (
                  <span className="text-xs text-blue-700 dark:text-blue-400 ml-auto">
                    Original Language: {originalLanguage}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100 break-words">
                {comment.translatedText}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => handleLike(comment._id)}
              title="Like this comment"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likes?.length || 0}</span>
            </button>
            
            <button
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => handleDislike(comment._id)}
              title="Dislike this comment"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{comment.dislikes?.length || 0}</span>
            </button>

            {!comment.translatedText && (
              <button
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onClick={() => handleTranslate(comment._id, translateLanguage)}
                disabled={translatingComments.includes(comment._id)}
                title={`Translate to ${LANGUAGES.find((l) => l.code === translateLanguage)?.label}`}
              >
                <Languages className="w-3.5 h-3.5 flex-shrink-0" />
                {translatingComments.includes(comment._id) ? "Translating..." : "Translate"}
              </button>
            )}

            {!isReply && user && (
              <button
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setReplyTo(comment._id)}
                title="Reply to this comment"
              >
                <MessageCircle className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyTo === comment._id && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2 flex-col sm:flex-row">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex gap-2 self-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setReplyTo(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleReply(comment._id)}
                    disabled={!replyText.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Render Replies */}
          {comment.replies?.map((r) => renderComment(r, true))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading comments...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h2>
      </div>

      {user && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={user.image || ""} alt={user.name} />
              <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-3">
              {/* Language Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Preferred Translation Language
                </label>
                <select
                  value={translateLanguage}
                  onChange={(e) => setTranslateLanguage(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 min-w-[160px] focus:ring-2 focus:ring-sky-500 focus:outline-none dark:bg-slate-800 dark:text-slate-100 font-medium"
                  title="Select language for comment translations"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment Input */}
              <Textarea
                placeholder="Share your thoughts about this video..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[90px] resize-none border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800 dark:text-slate-100"
              />

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setNewComment("")} 
                  disabled={!newComment.trim()}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={!newComment.trim() || isSubmitting}
                  className="text-sm"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-5">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
};

export default Comments;
