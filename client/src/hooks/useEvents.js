import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/api/events.api";

/**
 * useEvents — infinite-scroll upcoming-events hook.
 *
 * @param {{ limit?: number }} [options]
 */
const useEvents = ({ limit = 12 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["events", "upcoming"],
    queryFn: ({ pageParam }) => fetchEvents({ pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const events = query.data?.pages.flatMap((page) => page.events) ?? [];

  return {
    events,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useEvents;
