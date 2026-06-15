"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "@/lib/api";
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

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: e.candidate,
          targetSocketId,
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
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

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const socket = io(getBackendUrl(), { transports: ["websocket"] });
      socketRef.current = socket;
      socket.on("connect", () => console.log("SOCKET_CONNECTED", socket.id));
      socket.on("connect_error", (err) => console.error("SOCKET_CONNECT_ERROR", err));
      socket.on("disconnect", (reason) => console.log("SOCKET_DISCONNECTED", reason));

      socket.emit("join-room", {
        roomId,
        userId: user?._id || "guest",
        userName: user?.name || "Guest",
      });

      socket.on("existing-peers", async (peers: any[]) => {
        if (peers.length > 0) {
          const pc = createPeerConnection(peers[0].socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer, targetSocketId: peers[0].socketId });
        }
      });

      socket.on("user-joined", async ({ socketId }) => {
        toast.info("User joined the call");
      });

      socket.on("offer", async ({ offer, socketId }) => {
        const pc = createPeerConnection(socketId);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, targetSocketId: socketId });
      });

      socket.on("answer", async ({ answer }) => {
        await pcRef.current?.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        await pcRef.current?.addIceCandidate(candidate);
      });

      socket.on("call-ended", () => {
        toast.info("Call ended by remote user");
        endCall();
      });

      setJoined(true);
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
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 rounded">You</span>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 rounded">Remote</span>
            </div>
          </div>

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
