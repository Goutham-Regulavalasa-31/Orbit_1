import { create } from "zustand";
import { io } from "socket.io-client";

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token) => {
    const currentSocket = get().socket;

    // 1. If we already have a healthy socket, do nothing.
    if (currentSocket?.connected) return;

    // 2. If a broken socket exists, nuke it before starting fresh
    if (currentSocket) {
        currentSocket.disconnect();
    }

    // FIX: Re-added "polling" so your browser stops blocking the connection!
    const newSocket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000", {
      auth: { token },
      withCredentials: true,
      transports: ["polling", "websocket"], 
    });

    newSocket.on("connect", () => {
      console.log("🟢 WebSockets Connected!");
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 WebSockets Disconnected");
      set({ isConnected: false });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null, isConnected: false });
  },
}));

export default useSocketStore;