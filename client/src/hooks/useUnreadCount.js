import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCount } from "@/api/notifications.api";

/**
 * useUnreadCount — lightweight badge-only query.
 *
 * Kept separate from useNotifications so the navbar bell can show an
 * accurate count without paying for the full paginated notification list
 * on every page load. Real-time updates arrive via the "new_notification"
 * socket event (see useNotificationSocket), which writes straight into
 * this query's cache.
 */
const useUnreadCount = () => {
  const query = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: fetchUnreadCount,
    staleTime: 60 * 1000, // 1 minute — socket keeps it fresh in between
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
  };
};

export default useUnreadCount;
