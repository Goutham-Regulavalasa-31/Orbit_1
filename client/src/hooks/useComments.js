import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchComments } from "@/api/comments.api";

/**
 * useComments — infinite-scroll comment tree hook.
 *
 * Query key: ["comments", postId]
 * Each page returns { comments: object[], pagination: object }
 * where each comment has a `replies` array (pre-loaded 2 levels deep).
 *
 * @param {string} postId
 * @param {{ limit?: number, enabled?: boolean }} [options]
 */
const useComments = (postId, { limit = 10, enabled = true } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => fetchComments({ postId, pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    enabled: Boolean(postId) && enabled,
    staleTime: 60 * 1000, // 1 minute — real-time events keep data fresh
  });

  // Flatten all pages into a single comments array
  const comments = query.data?.pages.flatMap((page) => page.comments) ?? [];

  return {
    comments,
    totalComments: query.data?.pages.at(-1)?.pagination.totalComments ?? 0,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useComments;
