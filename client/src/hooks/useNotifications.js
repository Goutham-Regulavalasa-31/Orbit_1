import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/api/notifications.api";

/**
 * useNotifications — paginated notification list for the bell dropdown.
 *
 * Query key: ["notifications", "list"]
 * Deliberately `enabled`-gated by the caller (the dropdown only fetches
 * once opened) — the always-visible badge count is powered separately by
 * useUnreadCount, which is much cheaper to keep warm.
 *
 * @param {object} [options]
 * @param {boolean} [options.enabled=true]
 * @param {number} [options.limit=10]
 */
const useNotifications = ({ enabled = true, limit = 10 } = {}) => {
  const query = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    enabled,
    staleTime: 30 * 1000,
  });

  const notifications = query.data?.pages.flatMap((page) => page.notifications) ?? [];

  return {
    notifications,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useNotifications;
