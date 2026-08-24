import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSocket from "./useSocket";

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
 *    prepend, keeping both sides of a conversation symmetric)
 *  - bumps that conversation's snippet in the inbox list, or invalidates
 *    the whole list if this is a brand-new conversation not yet cached
 *  - increments the navbar unread badge
 */
const useMessageSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onReceiveMessage = (message) => {
      const senderId = message.sender._id;

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

      let matchedExistingConversation = false;
      queryClient.setQueryData(["messages", "conversations"], (oldData) => {
        if (!oldData) return oldData;
        const updatedPages = oldData.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((c) => {
            if (c.otherParticipant._id !== senderId) return c;
            matchedExistingConversation = true;
            return { ...c, lastMessage: message, unreadCount: c.unreadCount + 1, updatedAt: message.createdAt };
          }),
        }));
        return { ...oldData, pages: updatedPages };
      });

      if (!matchedExistingConversation) {
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"], exact: false });
      }

      queryClient.setQueryData(["messages", "unreadCount"], (oldData) => ({
        unreadCount: (oldData?.unreadCount ?? 0) + 1,
      }));
    };

    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("receive_message", onReceiveMessage);
    };
  }, [socket, isConnected, queryClient]);
};

export default useMessageSocket;
