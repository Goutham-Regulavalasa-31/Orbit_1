import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Orbit } from "lucide-react";
import CreatePostCard from "./CreatePostCard";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import useFeed from "@/hooks/useFeed";

// ── Post type filter config ───────────────────────────────────────────────────
const FILTERS = [
  { value: undefined, label: "All" },
  { value: "general", label: "💬 General" },
  { value: "note",    label: "📝 Notes" },
  { value: "doubt",   label: "❓ Doubts" },
];

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onReset }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/30 bg-card/20 py-16 text-center"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
      <Orbit className="h-8 w-8 text-primary/60" />
    </div>
    <div>
      <p className="font-semibold text-foreground">No posts yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Be the first to share something with the community.
      </p>
    </div>
    {onReset && (
      <button
        onClick={onReset}
        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        Clear filter
      </button>
    )}
  </motion.div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center"
  >
    <p className="text-sm text-muted-foreground">
      Failed to load the feed. Check your connection.
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 rounded-lg border border-border/40 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </button>
  </motion.div>
);

// ── Main PostFeed ─────────────────────────────────────────────────────────────
const PostFeed = () => {
  const [activeFilter, setActiveFilter] = useState(undefined);
  const loaderRef = useRef(null); // sentinel element for IntersectionObserver

  const {
    posts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useFeed({ postType: activeFilter });

  // ── Intersection Observer: trigger next page when sentinel is visible ──────
  useEffect(() => {
    const sentinel = loaderRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "200px", // start loading 200px before sentinel enters viewport
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFilterChange = useCallback((value) => {
    setActiveFilter(value);
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Post composer ────────────────────────────────────────────────── */}
      <CreatePostCard />

      {/* ── Feed filter tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => handleFilterChange(value)}
            className={`shrink-0 rounded-xl border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeFilter === value
                ? "border-primary/50 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Initial loading skeletons ─────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <ErrorState onRetry={refetch} />
      )}

      {/* ── Post list ─────────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <>
          {posts.length === 0 ? (
            <EmptyState onReset={activeFilter ? () => handleFilterChange(undefined) : null} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* ── Sentinel + loading indicator ─────────────────────────────── */}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more posts…
              </motion.div>
            )}

            {!hasNextPage && posts.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground/40"
              >
                You&apos;ve reached the end of the feed ✨
              </motion.p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PostFeed;
