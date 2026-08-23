import { Heart, MessageCircle, Reply } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Relative timestamp ────────────────────────────────────────────────────────
const formatRelativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const TYPE_META = {
  like: { icon: Heart, label: "liked your", target: "comment" },
  comment: { icon: MessageCircle, label: "commented on your post" },
  reply: { icon: Reply, label: "replied to your comment" },
};

const buildMessage = (notification) => {
  if (notification.type === "like") {
    return notification.comment ? "liked your comment" : "liked your post";
  }
  return TYPE_META[notification.type]?.label ?? "interacted with your post";
};

const NotificationItem = ({ notification, onRead }) => {
  const meta = TYPE_META[notification.type] ?? TYPE_META.comment;
  const Icon = meta.icon;

  const initials = notification.sender?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const handleClick = () => {
    if (!notification.read) onRead?.(notification._id);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 ${
        notification.read ? "" : "bg-primary/5"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar className="h-8 w-8 ring-1 ring-border/30">
          <AvatarImage src={notification.sender?.avatar} alt={notification.sender?.name} />
          <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-1 ring-border/40">
          <Icon className="h-2.5 w-2.5 text-primary" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-foreground/90">
          <Link
            to={`/profile/${notification.sender?._id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-foreground hover:underline"
          >
            {notification.sender?.name ?? "Someone"}
          </Link>{" "}
          {buildMessage(notification)}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      {!notification.read && <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
    </button>
  );
};

export default NotificationItem;
