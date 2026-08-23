import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import useUnreadCount from "@/hooks/useUnreadCount";
import useNotifications from "@/hooks/useNotifications";
import useMarkNotificationRead from "@/hooks/useMarkNotificationRead";
import useMarkAllNotificationsRead from "@/hooks/useMarkAllNotificationsRead";
import useNotificationSocket from "@/hooks/useNotificationSocket";
import NotificationItem from "@/components/notifications/NotificationItem";

/**
 * NotificationBell — navbar bell icon + unread badge + dropdown panel.
 *
 * The socket listener runs unconditionally (not just while the dropdown is
 * open) so the badge count stays live even when the panel is closed. The
 * paginated list itself is only fetched once the panel is opened.
 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useNotificationSocket();

  const { unreadCount } = useUnreadCount();
  const { notifications, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError } = useNotifications({
    enabled: isOpen,
  });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleRead = useCallback((notificationId) => markRead(notificationId), [markRead]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border/40 bg-card/95 shadow-xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border/25 px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline disabled:opacity-40"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                </div>
              )}

              {isError && !isLoading && (
                <p className="py-6 text-center text-xs text-muted-foreground/60">Failed to load notifications.</p>
              )}

              {!isLoading && !isError && notifications.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground/40">No notifications yet.</p>
              )}

              {!isLoading &&
                !isError &&
                notifications.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} onRead={handleRead} />
                ))}

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-border/20 py-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/40 disabled:opacity-50"
                >
                  {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin" /> : "Load more"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
