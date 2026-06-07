import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannelVideos = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/videos");
        const allVideos = Array.isArray(res.data) ? res.data : [];
        const channelVideos = allVideos.filter(
          (v: any) => v.uploader === id || v.videochanel === user?.channelname
        );
        setVideos(channelVideos);
      } catch (error) {
        console.error("Error fetching channel videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchChannelVideos();
  }, [id, user?.channelname]);

  if (!user) {
    return (
      <div className="flex-1 p-6 text-center">
        <p>Sign in to view your channel.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={user} user={user} />
        <Channeltabs />
        {user._id === id && (
          <div className="px-4 pb-8">
            <VideoUploader channelId={id} channelName={user?.channelname} />
          </div>
        )}
        <div className="px-4 pb-8">
          {loading ? (
            <p>Loading videos...</p>
          ) : (
            <ChannelVideos videos={videos} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;
