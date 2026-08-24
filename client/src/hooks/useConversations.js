import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchConversations } from "@/api/messages.api";

/**
 * useConversations — infinite-scroll inbox (conversation list) hook.
 *
 * @param {{ limit?: number }} [options]
 */
const useConversations = ({ limit = 20 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["messages", "conversations"],
    queryFn: ({ pageParam }) => fetchConversations({ pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });

  const conversations = query.data?.pages.flatMap((page) => page.conversations) ?? [];

  return {
    conversations,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useConversations;
