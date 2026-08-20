import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/api/posts.api";

/**
 * useFeed — infinite-scroll social feed hook.
 *
 * Wraps useInfiniteQuery with:
 * - Cursor-based pagination driven by the server's `pagination.hasNextPage`
 * - Returns a flattened `posts` array merged across all loaded pages
 * - Exposes loading/error states and `fetchNextPage` for the Intersection Observer
 *
 * @param {object} [filters]
 * @param {string} [filters.postType] - Optional type filter ('general' | 'note' | 'doubt')
 * @param {number} [filters.limit=10] - Items per page
 */
const useFeed = ({ postType, limit = 10 } = {}) => {
  const query = useInfiniteQuery({
    // Include filters in the key so changing filter triggers a fresh fetch
    queryKey: ["posts", "feed", { postType, limit }],

    queryFn: ({ pageParam }) =>
      fetchFeed({ pageParam, limit, postType }),

    // Called by react-query after each page load to determine the next cursor.
    // Returns undefined when there are no more pages → stops fetching.
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,

    initialPageParam: 1,

    // Override global staleTime — feed should feel fresh
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Flatten pages[].posts arrays into a single array for easy rendering
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    posts,
    pagination: query.data?.pages.at(-1)?.pagination ?? null,
    isLoading:            query.isLoading,
    isFetchingNextPage:   query.isFetchingNextPage,
    isFetching:           query.isFetching,
    hasNextPage:          query.hasNextPage,
    fetchNextPage:        query.fetchNextPage,
    isError:              query.isError,
    error:                query.error,
    refetch:              query.refetch,
  };
};

export default useFeed;
