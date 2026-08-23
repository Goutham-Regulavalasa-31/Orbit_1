import { useCallback } from "react";
import useSocketStore from "@/store/useSocketStore";

/**
 * useSocket — convenience hook for accessing the Socket.io client.
 *
 * Returns the socket instance, connection status, and a typed emit helper.
 * Components should prefer this hook over importing useSocketStore directly.
 *
 * @returns {{
 *   socket: import("socket.io-client").Socket | null,
 *   isConnected: boolean,
 *   emit: (event: string, payload?: any) => void
 * }}
 */
const useSocket = () => {
  const socket = useSocketStore((s) => s.socket);
  const isConnected = useSocketStore((s) => s.isConnected);

  /**
   * Emit a socket event. No-op if not connected.
   */
  const emit = useCallback(
    (event, payload) => {
      if (socket?.connected) {
        socket.emit(event, payload);
      }
    },
    [socket]
  );

  return { socket, isConnected, emit };
};

export default useSocket;
