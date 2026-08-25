import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSocket from "./useSocket";
import { markMessagesRead } from "@/api/messages.api";

/**
 * useMessageSocket — live "receive_message" listener.
 *
 * The server auto-joins every authenticated socket to a private
 * `user:<id>` room (see socket.js), so no explicit join/leave emit is
 * needed — just subscribe for the lifetime of the mounting component.
 * Meant to be mounted exactly once, globally (in MessageBell, which lives
 * in the Navbar and is therefore always present) so the inbox and navbar
 * badge stay live no matter which page the user is on.
 *
 * On receipt:
 *  - prepends the message into the sender's open chat thread cache, if it
 *    has ever been fetched this session (mirrors useSendMessage's own
 *    prepend, keeping both sides of a conversation symmetric) — this stays
 *    hand-rolled because it's purely additive UI state, not a source of
 *    truth the server needs to be asked about.
 *  - invalidates the inbox list unconditionally, so its lastMessage
 *    snippet and ordering are refetched from the server rather than
 *    hand-patched client-side.
 *  - branches on whether the recipient is already looking at this exact
 *    conversation (comparing the current route to /messages/<senderId>):
 *      - not viewing it → invalidate the navbar badge, pulling the real
 *        unread count from the database.
 *      - actively viewing it → the message is already visible on screen
 *        (via the prepend above), but the *database* still has it as
 *        unread — fetchMessages' mark-read side effect never runs here
 *        because no GET fires while the chat is already open and cached.
 *        Call the dedicated mark-read endpoint instead, so the DB doesn't
 *        keep disagreeing with what the user has actually already seen.
 */
const useMessageSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onReceiveMessage = (message) => {
      const senderId = message.sender._id;
      const isActiveChat = window.location.pathname === "/messages/" + senderId;

      queryClient.setQueryData(["messages", senderId], (oldData) => {
        if (!oldData) return oldData;
        if (oldData.pages.some((page) => page.messages.some((m) => m._id === message._id))) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page, i) =>
            i === 0 ? { ...page, messages: [message, ...page.messages] } : page
          ),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"], exact: false });

      if (isActiveChat) {
        markMessagesRead(senderId).catch(() => {
          // Best-effort — a missed mark-read just means the badge briefly
          // over-counts until the user next leaves and reopens this chat.
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["messages", "unreadCount"] });
      }
    };

    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("receive_message", onReceiveMessage);
    };
  }, [socket, isConnected, queryClient]);
};

export default useMessageSocket;
