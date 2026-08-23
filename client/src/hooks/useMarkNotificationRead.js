import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationRead } from "@/api/notifications.api";

/**
 * useMarkNotificationRead — optimistic single-notification read toggle.
 *
 * Flips the notification's `read` flag and decrements the badge count
 * immediately, rolls back on failure, and reconciles with the server
 * once the mutation settles.
 */
const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId) => markNotificationRead(notificationId),

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousList = queryClient.getQueryData(["notifications", "list"]);
      const previousUnreadCount = queryClient.getQueryData(["notifications", "unreadCount"]);

      let wasUnread = false;

      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => {
              if (n._id !== notificationId) return n;
              wasUnread = !n.read;
              return { ...n, read: true };
            }),
          })),
        };
      });

      if (wasUnread) {
        queryClient.setQueryData(["notifications", "unreadCount"], (oldData) => ({
          unreadCount: Math.max(0, (oldData?.unreadCount ?? 0) - 1),
        }));
      }

      return { previousList, previousUnreadCount };
    },

    onError: (_error, _notificationId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(["notifications", "list"], context.previousList);
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(["notifications", "unreadCount"], context.previousUnreadCount);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export default useMarkNotificationRead;
