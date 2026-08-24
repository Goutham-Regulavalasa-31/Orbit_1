import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchClubs } from "@/api/clubs.api";

/**
 * useClubs — infinite-scroll club directory hook.
 *
 * @param {{ search?: string, limit?: number }} [options]
 */
const useClubs = ({ search, limit = 12 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["clubs", "directory", { search }],
    queryFn: ({ pageParam }) => fetchClubs({ pageParam, limit, search }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const clubs = query.data?.pages.flatMap((page) => page.clubs) ?? [];

  return {
    clubs,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useClubs;
