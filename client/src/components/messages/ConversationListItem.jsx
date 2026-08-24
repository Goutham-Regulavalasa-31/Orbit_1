import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthStore from "@/store/useAuthStore";

// ── Relative timestamp ────────────────────────────────────────────────────────
const formatRelativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * ConversationListItem — one row in the inbox (left pane).
 *
 * @param {{ conversation: object, isActive: boolean }} props
 */
const ConversationListItem = ({ conversation, isActive }) => {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { otherParticipant, lastMessage, unreadCount } = conversation;

  const initials = otherParticipant?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const isOwnLastMessage = lastMessage?.sender === currentUserId;

  return (
    <Link
      to={`/messages/${otherParticipant._id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-muted/40"
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/30">
        <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
        <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{otherParticipant?.name}</p>
          {lastMessage?.createdAt && (
            <span className="shrink-0 text-[10px] text-muted-foreground/60">
              {formatRelativeTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unreadCount > 0 ? "font-semibold text-foreground/90" : "text-muted-foreground"
            }`}
          >
            {isOwnLastMessage && <span className="text-muted-foreground/60">You: </span>}
            {lastMessage?.text ?? "Say hello…"}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ConversationListItem;
