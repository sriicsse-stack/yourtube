import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(video.subscriberCount || 0);
  const [subLoading, setSubLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);

  const channelIdentifier = video.uploaderId || video.videochanel;
  const isOwner = user?._id === video.uploaderId;

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const socket = getSocket();
    const onLike = (payload: any) => {
      if (payload?.videoId === video._id) setlikes(payload.likes || 0);
    };
    const onDislike = (payload: any) => {
      if (payload?.videoId === video._id) setDislikes(payload.dislikes || 0);
    };

    socket?.on("video:like", onLike);
    socket?.on("video:dislike", onDislike);
    return () => {
      socket?.off("video:like", onLike);
      socket?.off("video:dislike", onDislike);
    };
  }, [video._id]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user || !channelIdentifier) return;
      try {
        const response = await axiosInstance.get(
          `/subscriptions/status/${encodeURIComponent(channelIdentifier)}`
        );
        if (response.data?.isSubscribed !== undefined) {
          setIsSubscribed(response.data.isSubscribed);
        }
        if (response.data?.subscriberCount !== undefined) {
          setSubscriberCount(response.data.subscriberCount);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchSubscriptionStatus();
  }, [user, channelIdentifier]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Sign in to subscribe");
      return;
    }
    if (!channelIdentifier) return;

    setSubLoading(true);
    try {
      const response = await axiosInstance.post(
        `/subscriptions/toggle/${encodeURIComponent(channelIdentifier)}`
      );
      setIsSubscribed(response.data.isSubscribed);
      if (response.data?.subscriberCount !== undefined) {
        setSubscriberCount(response.data.subscriberCount);
      }
      toast.success(
        response.data.isSubscribed
          ? `Subscribed to ${video.videochanel}`
          : `Unsubscribed from ${video.videochanel}`
      );
    } catch (error) {
      console.log(error);
      toast.error("Unable to update subscription");
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user, video?._id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDownload = async () => {
    if (!user) {
      toast.error("Sign in to download videos");
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/download/${video._id}`,
        { userId: user._id },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = video.filename || "video.mp4";
      a.click();
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Download failed");
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/dislike/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.disliked !== undefined) {
        setDislikes(res.data.dislikes || 0);
        setIsDisliked(res.data.disliked);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-muted-foreground">
              {subscriberCount.toLocaleString()} subscriber{subscriberCount === 1 ? "" : "s"}
            </p>
          </div>
          {!isOwner && (
            <Button
              className="ml-4"
              variant={isSubscribed ? "outline" : "default"}
              onClick={handleSubscribe}
              disabled={!user || !channelIdentifier || subLoading}
            >
              {subLoading
                ? "Updating..."
                : isSubscribed
                ? "Subscribed"
                : "Subscribe"}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <span className="rounded-full bg-muted/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {video.category || "General"}
          </span>
          {video.visibility && (
            <span className="rounded-full bg-muted/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {video.visibility}
            </span>
          )}
        </div>
      </div>
      <div className="bg-muted/80 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 text-sm font-medium mb-2 text-muted-foreground">
          <span>{(video.views || 0).toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
          {video.language && <span>Language: {video.language}</span>}
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>{video.description || "No description has been added for this video yet."}</p>
          {video.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {video.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground border">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
