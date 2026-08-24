import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/api/messages.api";

/**
 * useSendMessage — sends a direct message to `userId`.
 *
 * No client-mocked optimistic placeholder: the REST round-trip is fast and
 * already returns the fully-enriched, real message, so onSuccess injects
 * that directly into the ["messages", userId] cache — instant-feeling UI
 * without the complexity/flicker risk of swapping a fake message for a real
 * one later (the same "let real data drive the UI" choice this codebase
 * already made for comments). The *recipient's* side is what genuinely
 * needs the socket-driven injection described in the brief — see
 * useMessageSocket.js, which handles the "receive_message" side of this.
 *
 * @param {string} userId
 */
const useSendMessage = (userId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text) => sendMessage({ userId, text }),

    onSuccess: (message) => {
      // Prepend into the newest (first) page — pages are stored newest-first
      // to match the server's pagination order (see useMessages.js).
      queryClient.setQueryData(["messages", userId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page, i) =>
            i === 0 ? { ...page, messages: [message, ...page.messages] } : page
          ),
        };
      });

      // Bump this conversation to the top of the inbox with the new snippet
      let matchedExistingConversation = false;
      queryClient.setQueryData(["messages", "conversations"], (oldData) => {
        if (!oldData) return oldData;
        const updatedPages = oldData.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((c) => {
            if (c.otherParticipant._id !== userId) return c;
            matchedExistingConversation = true;
            return { ...c, lastMessage: message, updatedAt: message.createdAt };
          }),
        }));
        return { ...oldData, pages: updatedPages };
      });

      // A brand-new conversation (first message ever to this person) won't
      // be in the cache yet — refetch so the inbox picks it up immediately.
      if (!matchedExistingConversation) {
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"], exact: false });
      }
    },
  });
};

export default useSendMessage;
