import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchUserPosts } from "@/api/users.api";

/**
 * useUserPosts — infinite-scroll post history for a profile page.
 *
 * @param {string} userId
 * @param {{ limit?: number }} [options]
 */
const useUserPosts = (userId, { limit = 10 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["users", userId, "posts"],
    queryFn: ({ pageParam }) => fetchUserPosts({ userId, pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useUserPosts;
