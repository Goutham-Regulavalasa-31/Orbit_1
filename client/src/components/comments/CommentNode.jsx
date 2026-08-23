import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Heart, Reply, Trash2, ChevronDown, ChevronRight, Code } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthStore from "@/store/useAuthStore";
import useToggleCommentLike from "@/hooks/useToggleCommentLike";
import { deleteComment } from "@/api/comments.api";
import { useQueryClient } from "@tanstack/react-query";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

// ── Max nesting depth before collapsing into "Continue thread →" ─────────────
const MAX_DEPTH = 5;

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
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ── Markdown component config ─────────────────────────────────────────────────
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match?.[1] ?? "plaintext";
    const codeStr = String(children).replace(/\n$/, "");

    if (!inline && match) {
      const highlighted = hljs.highlight(codeStr, {
        language,
        ignoreIllegals: true,
      }).value;

      return (
        <div className="relative my-2 overflow-hidden rounded-lg border border-white/10 bg-[#0d1117]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/40">
              <Code className="h-3 w-3" />
              {language}
            </span>
          </div>
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
            <code
              className="hljs"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    }

    return (
      <code
        className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[85%] text-amber-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  p: ({ children }) => (
    <p className="mb-1 last:mb-0 leading-relaxed text-foreground/90">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-1 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="my-1 list-disc pl-4 text-sm space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal pl-4 text-sm space-y-0.5">{children}</ol>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

// ── Main CommentNode ──────────────────────────────────────────────────────────
const CommentNode = memo(({ comment, postId, depth = 0, onReply }) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [repliesOpen, setRepliesOpen] = useState(depth < 2);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const { mutate: toggleLike, isPending: isLiking } = useToggleCommentLike(postId);

  const isOwner = user?._id === comment.author?._id || user?.role === "admin";
  const hasReplies = comment.replies?.length > 0;

  const initials = comment.author?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (isLiking) return;
    toggleLike({
      commentId: comment._id,
      currentlyLiked: comment.isLikedByCurrentUser,
      currentLikesCount: comment.likesCount,
    });
  }, [isLiking, toggleLike, comment._id, comment.isLikedByCurrentUser, comment.likesCount]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Delete this comment? All replies will also be removed.")) return;
    setIsDeleting(true);
    try {
      await deleteComment({ postId, commentId: comment._id });
      setDeleted(true);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    } catch {
      setIsDeleting(false);
    }
  }, [postId, comment._id, queryClient]);

  const handleReply = useCallback(() => {
    onReply?.({
      parentCommentId: comment._id,
      replyingToName: comment.author?.name,
    });
  }, [onReply, comment._id, comment.author?.name]);

  if (deleted) return null;

  // ── Deep nesting: show "Continue thread" instead of rendering more ────────
  if (depth >= MAX_DEPTH) {
    return (
      <button
        onClick={() => setRepliesOpen(true)}
        className="ml-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <ChevronRight className="h-3.5 w-3.5" />
        Continue thread ({comment.replies?.length} more)
      </button>
    );
  }

  const isOptimistic = comment._isOptimistic;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isOptimistic ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group"
    >
      <div className="flex gap-2.5">
        {/* ── Thread line (left gutter) ──────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/30">
            <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Vertical thread line */}
          {hasReplies && repliesOpen && (
            <button
              onClick={() => setRepliesOpen(false)}
              className="mt-1.5 w-0.5 flex-1 rounded-full bg-border/30 transition-colors hover:bg-primary/30 min-h-[20px]"
              title="Collapse thread"
            />
          )}
        </div>

        {/* ── Comment body ──────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 pb-3">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">
              {comment.author?.name ?? "Unknown"}
            </span>
            {comment.author?.department && (
              <span className="rounded border border-border/20 bg-background/30 px-1 py-0.5 text-[9px] text-muted-foreground">
                {comment.author.department}
              </span>
            )}
            {comment.author?.role === "faculty" && (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1 py-0.5 text-[9px] font-medium text-blue-400">
                Faculty
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/50">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isOptimistic && (
              <span className="text-[9px] italic text-muted-foreground/40">
                posting…
              </span>
            )}
          </div>

          {/* Text body (Markdown) */}
          <div className="mt-1 text-sm text-foreground/85 prose-sm break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {comment.text}
            </ReactMarkdown>
          </div>

          {/* Action bar */}
          <div className="mt-1.5 flex items-center gap-0.5">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleLike}
              disabled={isLiking || isOptimistic}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                comment.isLikedByCurrentUser
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground"
              }`}
            >
              <motion.div
                animate={
                  comment.isLikedByCurrentUser
                    ? { scale: [1, 1.3, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.2 }}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-all ${
                    comment.isLikedByCurrentUser
                      ? "fill-red-400 text-red-400"
                      : ""
                  }`}
                />
              </motion.div>
              {comment.likesCount > 0 && (
                <span>{comment.likesCount}</span>
              )}
            </motion.button>

            {/* Reply */}
            <button
              onClick={handleReply}
              disabled={isOptimistic}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>

            {/* Collapse/expand replies */}
            {hasReplies && (
              <button
                onClick={() => setRepliesOpen((o) => !o)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
              >
                {repliesOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}

            {/* Delete (owner / admin) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting || isOptimistic}
                className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* ── Nested replies ─────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {hasReplies && repliesOpen && (
              <motion.div
                key="replies"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="mt-3 space-y-3 pl-1"
              >
                {comment.replies.map((reply) => (
                  <CommentNode
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    depth={depth + 1}
                    onReply={onReply}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

CommentNode.displayName = "CommentNode";

export default CommentNode;
