import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMessages } from "@/api/messages.api";

/**
 * useMessages — reverse-paginated chat history with one user.
 *
 * The server returns each page newest-first (page 1 = most recent N
 * messages) so "load older" is a normal forward pagination fetch server-side.
 * For a chat UI we want oldest-to-newest top-to-bottom, and older pages to
 * land above newer ones when loaded — flattening pages in fetch order then
 * reversing the whole array achieves both:
 *   pages = [page1(newest..older), page2(older..oldest)]
 *   flat  = [newest ... older, older ... oldest]
 *   flat.reverse() = [oldest ... older, older ... newest]  ✓
 *
 * Fetching a page also marks the other user's messages read and clears this
 * conversation's unread streak server-side (see message.service.js's
 * getMessages) — so every successful fetch here invalidates the navbar
 * badge and inbox list to match, instead of leaving them stuck showing a
 * stale unread count after the chat has actually been read. This runs
 * inside queryFn itself (not an `onSuccess` option) because TanStack Query
 * v5 removed per-query onSuccess/onError callbacks entirely.
 *
 * @param {string} userId
 * @param {{ limit?: number }} [options]
 */
const useMessages = (userId, { limit = 20 } = {}) => {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["messages", userId],
    queryFn: async ({ pageParam }) => {
      const data = await fetchMessages({ userId, pageParam, limit });
      queryClient.invalidateQueries({ queryKey: ["messages", "unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"], exact: false });
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  const messages = query.data?.pages.flatMap((page) => page.messages).reverse() ?? [];
  const otherUser = query.data?.pages[0]?.otherUser ?? null;

  return {
    messages,
    otherUser,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useMessages;
