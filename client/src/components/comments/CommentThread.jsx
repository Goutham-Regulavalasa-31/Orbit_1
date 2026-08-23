import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import CommentNode from "./CommentNode";

/**
 * CommentThread — renders the paginated, infinite-scroll comment tree.
 *
 * - Uses IntersectionObserver to trigger `fetchNextPage` as the user scrolls.
 * - AnimatePresence wraps each top-level comment for mount/exit animations.
 * - Delegates recursion to CommentNode.
 *
 * @param {{
 *   comments: object[],
 *   postId: string,
 *   hasNextPage: boolean,
 *   isFetchingNextPage: boolean,
 *   fetchNextPage: () => void,
 *   onReply: (ctx: { parentCommentId: string, replyingToName: string }) => void
 * }}
 */
const CommentThread = ({
  comments,
  postId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onReply,
}) => {
  const sentinelRef = useRef(null);

  // ── Intersection Observer for infinite pagination ────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (comments.length === 0) return null;

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {comments.map((comment) => (
          <motion.div
            key={comment._id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CommentNode
              comment={comment}
              postId={postId}
              depth={0}
              onReply={onReply}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Sentinel + loader ──────────────────────────────────────────────── */}
      <div ref={sentinelRef} className="flex justify-center py-2">
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground/50"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading more comments…
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CommentThread;
