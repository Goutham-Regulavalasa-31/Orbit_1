import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import useUnreadMessagesCount from "@/hooks/useUnreadMessagesCount";
import useMessageSocket from "@/hooks/useMessageSocket";

/**
 * MessageBell — navbar icon linking to /messages with a live unread badge.
 *
 * Unlike NotificationBell there's no dropdown here — /messages is already a
 * full split-pane page, so a second, smaller inbox preview would just be
 * redundant UI. This is also where useMessageSocket is mounted: since
 * MessageBell lives in the Navbar (present on every authenticated page),
 * the "receive_message" listener stays live no matter what the user is
 * looking at.
 */
const MessageBell = () => {
  useMessageSocket();

  const { unreadCount } = useUnreadMessagesCount();

  return (
    <Link
      to="/messages"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      aria-label="Messages"
    >
      <MessageSquare className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default MessageBell;
