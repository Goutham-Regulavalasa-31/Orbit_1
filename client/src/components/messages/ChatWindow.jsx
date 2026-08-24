import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthStore from "@/store/useAuthStore";
import useMessages from "@/hooks/useMessages";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

/**
 * ChatWindow — the right pane: header, scrollable message history
 * (auto-scrolls to bottom on new messages, loads older ones on scroll-to-top),
 * and the composer.
 *
 * @param {{ userId: string }} props
 */
const ChatWindow = ({ userId }) => {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const { messages, otherUser, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError } =
    useMessages(userId);

  const topSentinelRef = useRef(null);
  const bottomRef = useRef(null);
  const lastMessageId = messages.at(-1)?._id;

  // Auto-scroll to bottom only when a *new* message lands at the end — not
  // when older messages get prepended from a "load more" (which should
  // preserve the reader's current scroll position instead).
  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const initials = otherUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      {otherUser && (
        <Link
          to={`/profile/${otherUser._id}`}
          className="flex items-center gap-3 border-b border-border/25 px-4 py-3 transition-colors hover:bg-muted/20"
        >
          <Avatar className="h-9 w-9 ring-1 ring-border/30">
            <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{otherUser.name}</p>
            {otherUser.department && <p className="text-[11px] text-muted-foreground">{otherUser.department}</p>}
          </div>
        </Link>
      )}

      {/* ── Message history ──────────────────────────────────────────────── */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <div ref={topSentinelRef} className="flex justify-center py-1">
          {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40" />}
        </div>

        {isLoading && (
          <div className="flex h-full items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="py-10 text-center text-xs text-muted-foreground/60">Failed to load this conversation.</p>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageCircle className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">No messages yet. Say hello!</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          messages.map((message) => (
            <MessageBubble key={message._id} message={message} isOwn={message.sender._id === currentUserId} />
          ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Composer ──────────────────────────────────────────────────────── */}
      <MessageComposer userId={userId} />
    </div>
  );
};

export default ChatWindow;
