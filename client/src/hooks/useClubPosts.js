import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchClubPosts } from "@/api/clubs.api";

/**
 * useClubPosts — infinite-scroll post feed strictly scoped to one club.
 *
 * @param {string} clubId
 * @param {{ limit?: number }} [options]
 */
const useClubPosts = (clubId, { limit = 10 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["clubs", clubId, "posts"],
    queryFn: ({ pageParam }) => fetchClubPosts({ clubId, pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    enabled: Boolean(clubId),
    staleTime: 60 * 1000,
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

export default useClubPosts;
