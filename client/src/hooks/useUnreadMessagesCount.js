import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessagesCount } from "@/api/messages.api";

/**
 * useUnreadMessagesCount — lightweight badge-only query, kept separate from
 * useConversations for the same reason as notifications' useUnreadCount:
 * the navbar badge shouldn't pay for the full paginated inbox list. Kept
 * live in between fetches by useMessageSocket writing straight into this
 * query's cache on every "receive_message" event.
 */
const useUnreadMessagesCount = () => {
  const query = useQuery({
    queryKey: ["messages", "unreadCount"],
    queryFn: fetchUnreadMessagesCount,
    staleTime: 60 * 1000,
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
  };
};

export default useUnreadMessagesCount;
