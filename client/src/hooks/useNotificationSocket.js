import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSocket from "./useSocket";

/**
 * useNotificationSocket — live "new_notification" listener.
 *
 * The server auto-joins every authenticated socket to a private
 * `user:<id>` room (see socket.js), so no explicit join/leave emit is
 * needed here — just subscribe for the lifetime of the component.
 *
 * On receipt:
 *  - writes the fresh unreadCount straight into the badge query cache
 *  - prepends the notification into the dropdown list cache, if it has
 *    ever been fetched this session (notifications sort newest-first on
 *    the server, so prepending to page 0 is the correct order here —
 *    unlike comments, which sort oldest-first).
 */
const useNotificationSocket = () => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onNewNotification = (notification) => {
      const { unreadCount, ...rest } = notification;

      queryClient.setQueryData(["notifications", "unreadCount"], { unreadCount });

      queryClient.setQueryData(["notifications", "list"], (oldData) => {
        if (!oldData) return oldData;
        if (oldData.pages[0]?.notifications.some((n) => n._id === rest._id)) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page, i) =>
            i === 0 ? { ...page, notifications: [rest, ...page.notifications] } : page
          ),
        };
      });
    };

    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [socket, isConnected, queryClient]);
};

export default useNotificationSocket;
