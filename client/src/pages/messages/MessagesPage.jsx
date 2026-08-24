import { useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import ConversationListItem from "@/components/messages/ConversationListItem";
import ChatWindow from "@/components/messages/ChatWindow";
import useConversations from "@/hooks/useConversations";

// ── Empty inbox state ─────────────────────────────────────────────────────────
const EmptyInbox = () => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
      <MessageSquare className="h-7 w-7 text-primary/60" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">No conversations yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Visit someone&apos;s profile and hit &quot;Message&quot; to start one.
      </p>
    </div>
  </div>
);

const MessagesPage = () => {
  const { userId: selectedUserId } = useParams();
  const loaderRef = useRef(null);

  const {
    conversations,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useConversations();

  useEffect(() => {
    const sentinel = loaderRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "150px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      <main className="container mx-auto flex min-h-0 max-w-6xl flex-1 px-0 py-0 sm:px-6 sm:py-6">
        <div className="flex min-h-0 w-full flex-1 overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm sm:rounded-2xl sm:border">
          {/* ── Left pane: conversation list ──────────────────────────────── */}
          <div
            className={`w-full shrink-0 flex-col border-border/25 sm:w-80 sm:border-r ${
              selectedUserId ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="border-b border-border/25 px-4 py-3">
              <h1 className="text-sm font-bold text-foreground">Messages</h1>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {isLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                </div>
              )}

              {isError && !isLoading && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <p className="text-xs text-muted-foreground/60">Failed to load conversations.</p>
                  <button
                    onClick={refetch}
                    className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-[11px] font-medium hover:bg-muted/50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !isError && conversations.length === 0 && <EmptyInbox />}

              {!isLoading &&
                !isError &&
                conversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation._id}
                    conversation={conversation}
                    isActive={conversation.otherParticipant._id === selectedUserId}
                  />
                ))}

              <div ref={loaderRef} className="flex justify-center py-2">
                {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/40" />}
              </div>
            </div>
          </div>

          {/* ── Right pane: active chat ───────────────────────────────────── */}
          <div className={`min-h-0 flex-1 flex-col ${selectedUserId ? "flex" : "hidden sm:flex"}`}>
            {selectedUserId ? (
              <>
                <Link
                  to="/messages"
                  className="flex items-center gap-1.5 border-b border-border/25 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:hidden"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to inbox
                </Link>
                <ChatWindow userId={selectedUserId} />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/25" />
                <p className="text-sm text-muted-foreground/60">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
