import { io } from "socket.io-client";
import { getBackendUrl } from "./api";

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const backend = getBackendUrl().replace(/\/$/, "");
  try {
    socket = io(backend, { transports: ["websocket"], reconnection: true });
  } catch (err) {
    console.error("Socket init failed:", err);
  }
  return socket;
}

export default getSocket();
