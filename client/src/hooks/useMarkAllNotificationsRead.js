import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsRead } from "@/api/notifications.api";

/**
 * useMarkAllNotificationsRead — optimistic "mark all as read".
 */
const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousList = queryClient.getQueryData(["notifications", "list"]);
      const previousUnreadCount = queryClient.getQueryData(["notifications", "unreadCount"]);

      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => ({ ...n, read: true })),
          })),
        };
      });

      queryClient.setQueryData(["notifications", "unreadCount"], { unreadCount: 0 });

      return { previousList, previousUnreadCount };
    },

    onError: (_error, _variables, context) => {
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

export default useMarkAllNotificationsRead;
