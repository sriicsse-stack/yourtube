"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getBackendRootUrl } from "@/lib/api";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Download, Share2,
} from "lucide-react";
import { toast } from "sonner";

export default function VideoCall() {
  const { user } = useUser();
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("unknown");
  const [microphoneStatus, setMicrophoneStatus] = useState("unknown");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [peerStatus, setPeerStatus] = useState("idle");
  const [localTracksCount, setLocalTracksCount] = useState(0);
  const [videoTracksCount, setVideoTracksCount] = useState(0);
  const [audioTracksCount, setAudioTracksCount] = useState(0);
  const isDev = process.env.NODE_ENV === "development";

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const remoteSocketRef = useRef<string | null>(null);

  const createPeerConnection = (targetSocketId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    console.log("PEER_CREATED", { targetSocketId });
    setPeerStatus("connecting");

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        console.log("ICE_CANDIDATE_SENT", { targetSocketId, candidate: e.candidate });
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: e.candidate,
          targetSocketId,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log("REMOTE_STREAM_RECEIVED", e.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setPeerStatus("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("PEER_CONNECTION_STATE", pc.connectionState);
      if (pc.connectionState === "connected") {
        setPeerStatus("connected");
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setPeerStatus("failed");
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pcRef.current = pc;
    remoteSocketRef.current = targetSocketId;
    return pc;
  };

  const startCall = async () => {
    if (!roomId.trim()) {
      toast.error("Enter a room ID");
      return;
    }

    try {
      console.log("MEDIA_REQUEST_START: Enumerating media devices");
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("AVAILABLE_DEVICES", devices);

      console.log("MEDIA_REQUEST_START: Requesting camera/microphone with constraints", { video: true, audio: true });
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("MEDIA_STREAM_SUCCESS", stream);

      const videoCount = stream.getVideoTracks().length;
      const audioCount = stream.getAudioTracks().length;
      setLocalTracksCount(stream.getTracks().length);
      setVideoTracksCount(videoCount);
      setAudioTracksCount(audioCount);
      setCameraStatus(videoCount > 0 ? "active" : "off");
      setMicrophoneStatus(audioCount > 0 ? "active" : "off");
      console.log("VIDEO_TRACK_COUNT", videoCount);
      console.log("AUDIO_TRACK_COUNT", audioCount);

      localStreamRef.current = stream;
      setJoined(true);

      const backendRoot = getBackendRootUrl();
      const socket = backendRoot
        ? io(backendRoot, { transports: ["websocket"], reconnection: true })
        : io({ transports: ["websocket"], reconnection: true });
      socketRef.current = socket;
      setSocketStatus("connecting");

      socket.on("connect", () => {
        console.log("SOCKET_CONNECTED", socket.id);
        setSocketStatus("connected");
        socket.emit("join-room", {
          roomId,
          userId: user?.id,
          userName: user?.name || "Anonymous",
        });
        console.log("JOIN_ROOM_SENT", { roomId, socketId: socket.id });
      });

      socket.on("disconnect", (reason) => {
        console.log("SOCKET_DISCONNECTED", reason);
        setSocketStatus("disconnected");
      });

      socket.on("connect_error", (err) => {
        console.error("SOCKET_CONNECT_ERROR", err);
        setSocketStatus("error");
        toast.error(`Socket connect error: ${err?.message || String(err)}`);
      });

      socket.on("existing-peers", async (peers: any[]) => {
        console.log("EXISTING_PEERS_RECEIVED", peers);
        if (peers.length > 0) {
          const pc = createPeerConnection(peers[0].socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer, targetSocketId: peers[0].socketId });
          console.log("OFFER_SENT", { targetSocketId: peers[0].socketId });
        }
      });

      socket.on("user-joined", ({ socketId }) => {
        console.log("USER_JOINED", { socketId });
        toast.info("User joined the call");
      });

      socket.on("offer", async ({ offer, socketId }) => {
        console.log("OFFER_RECEIVED", { socketId, offer });
        const pc = createPeerConnection(socketId);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, targetSocketId: socketId });
        console.log("ANSWER_SENT", { targetSocketId: socketId });
      });

      socket.on("answer", async ({ answer }) => {
        console.log("ANSWER_RECEIVED", answer);
        await pcRef.current?.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        console.log("ICE_CANDIDATE_RECEIVED", candidate);
        try {
          await pcRef.current?.addIceCandidate(candidate);
        } catch (candidateError) {
          console.error("ICE_CANDIDATE_ERROR", candidateError);
        }
      });

      socket.on("call-ended", () => {
        toast.info("Call ended by remote user");
        endCall();
      });

      toast.success("Joined room");
    } catch (error: any) {
      console.error("MEDIA_STREAM_ERROR", error);
      try {
        const name = error?.name || "Error";
        const message = error?.message || JSON.stringify(error);
        toast.error(`${name}: ${message}`);
      } catch (e) {
        console.error("MEDIA_STREAM_ERROR: Failed to read error details", e);
        toast.error("Could not access camera/microphone");
      }
    }
  };

  useEffect(() => {
    if (!joined || !localStreamRef.current || !localVideoRef.current) {
      return;
    }

    const video = localVideoRef.current;
    video.srcObject = localStreamRef.current;
    console.log("LOCAL_VIDEO_ATTACHED", video.srcObject);

    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          console.log("LOCAL_VIDEO_PLAY_SUCCESS");
        })
        .catch((playError: any) => {
          console.error("LOCAL_VIDEO_PLAY_ERROR", playError);
          toast.error(`Video play error: ${playError?.name}: ${playError?.message}`);
        });
    }
  }, [joined]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = cameraOff;
    });
    setCameraOff(!cameraOff);
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      setSharing(true);
      screenTrack.onended = () => setSharing(false);
      toast.success("Screen sharing started");
    } catch {
      toast.error("Screen share cancelled");
    }
  };

  const startRecording = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yourtube-call-${Date.now()}.webm`;
      a.click();
      toast.success("Recording saved locally");
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const endCall = () => {
    socketRef.current?.emit("end-call", { roomId });
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    pcRef.current = null;
    localStreamRef.current = null;
    setJoined(false);
    setSocketStatus("disconnected");
    setPeerStatus("idle");
    setSharing(false);
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      try {
        if (socketRef.current) socketRef.current.emit("end-call", { roomId });
      } catch (e) {
        /* ignore */
      }
      try {
        pcRef.current?.close();
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        socketRef.current?.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [roomId]);

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Video Call</h1>

      {!joined ? (
        <div className="space-y-4 max-w-md">
          <Input
            placeholder="Enter room ID to join or create"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <Button onClick={startCall} className="w-full">
            Start / Join Call
          </Button>
          <p className="text-sm text-muted-foreground">
            Share the room ID with another user to connect via WebRTC.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log("LOCAL_VIDEO_EVENT: onLoadedMetadata", localVideoRef.current?.videoWidth, localVideoRef.current?.videoHeight)}
                onCanPlay={() => console.log("LOCAL_VIDEO_EVENT: onCanPlay", localVideoRef.current?.readyState)}
                onPlaying={() => console.log("LOCAL_VIDEO_EVENT: onPlaying", localVideoRef.current?.paused, localVideoRef.current?.ended)}
              />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 rounded">You</span>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 rounded">Remote</span>
            </div>
          </div>

          {isDev ? (
            <div className="rounded-xl bg-white/90 border border-slate-200 p-4 text-sm text-slate-800 shadow-sm">
              <div className="mb-2 font-semibold">Debug status</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-slate-100 p-2">Camera: {cameraStatus}</div>
                <div className="rounded-md bg-slate-100 p-2">Microphone: {microphoneStatus}</div>
                <div className="rounded-md bg-slate-100 p-2">Socket: {socketStatus}</div>
                <div className="rounded-md bg-slate-100 p-2">Peer: {peerStatus}</div>
                <div className="rounded-md bg-slate-100 p-2">Tracks: {localTracksCount}</div>
                <div className="rounded-md bg-slate-100 p-2">Video tracks: {videoTracksCount}</div>
                <div className="rounded-md bg-slate-100 p-2">Audio tracks: {audioTracksCount}</div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant={muted ? "destructive" : "secondary"} onClick={toggleMute}>
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button variant={cameraOff ? "destructive" : "secondary"} onClick={toggleCamera}>
              {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
            <Button variant={sharing ? "default" : "secondary"} onClick={shareScreen}>
              <Monitor className="w-4 h-4 mr-1" /> Share Screen
            </Button>
            <Button
              variant={recording ? "destructive" : "secondary"}
              onClick={recording ? stopRecording : startRecording}
            >
              <Download className="w-4 h-4 mr-1" />
              {recording ? "Stop Rec" : "Record"}
            </Button>
            <Button variant="destructive" onClick={endCall}>
              <PhoneOff className="w-4 h-4 mr-1" /> End Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
