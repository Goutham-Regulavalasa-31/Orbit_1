import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import CommentComposer from "./CommentComposer";
import CommentThread from "./CommentThread";
import useComments from "@/hooks/useComments";
import useSocket from "@/hooks/useSocket";

const CommentSection = ({ postId }) => {
  const { isConnected } = useSocket();

  // FIX: Removed the room subscription from here so you don't get kicked out!
  const { comments, totalComments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, refetch } = useComments(postId);

  const [replyContext, setReplyContext] = useState(null);

  const handleReply = useCallback((ctx) => setReplyContext(ctx), []);
  const handleCancelReply = useCallback(() => setReplyContext(null), []);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden border-t border-border/20">
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-xs font-semibold text-muted-foreground">
              {totalComments > 0 ? `${totalComments} ${totalComments === 1 ? "comment" : "comments"}` : "Comments"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-[10px] text-emerald-400/70">
                <Wifi className="h-3 w-3" /><span>Live</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <WifiOff className="h-3 w-3" /><span>Offline</span>
              </div>
            )}
          </div>
        </div>

        <CommentComposer postId={postId} replyContext={replyContext} onCancelReply={handleCancelReply} />

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="h-5 w-5 text-muted-foreground/40" />
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {isError && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-xs text-muted-foreground/60">Failed to load comments.</p>
              <button onClick={refetch} className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50"><RefreshCw className="h-3 w-3" />Retry</button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && !isError && (
          <>
            {comments.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center text-xs text-muted-foreground/40">No comments yet. Be the first to share your thoughts!</motion.p>
            ) : (
              <CommentThread comments={comments} postId={postId} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} onReply={handleReply} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CommentSection;