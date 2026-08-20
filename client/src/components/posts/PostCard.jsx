import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  FileText,
  ExternalLink,
  BookOpen,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useToggleLike from "@/hooks/useToggleLike";
import useAuthStore from "@/store/useAuthStore";
import { deletePost } from "@/api/posts.api";
import { useQueryClient } from "@tanstack/react-query";

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Returns a relative human-readable timestamp.
 * e.g. "just now", "3m ago", "2h ago", "Aug 14"
 */
const formatRelativeTime = (isoString) => {
  const now  = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });
};

// ── Post type metadata ────────────────────────────────────────────────────────
const POST_TYPE_META = {
  general: {
    icon:  MessageSquare,
    label: "General",
    class: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  note: {
    icon:  BookOpen,
    label: "Note",
    class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  doubt: {
    icon:  HelpCircle,
    label: "Doubt",
    class: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

// ── Media grid ────────────────────────────────────────────────────────────────
/**
 * Renders a responsive media grid.
 * - 1 image  → full width
 * - 2 images → 2 columns
 * - 3+ images → 2-col with 3rd spanning or masonry-like
 */
const MediaGrid = ({ mediaUrls }) => {
  const images = mediaUrls.filter((m) => m.resourceType === "image");
  const pdfs   = mediaUrls.filter((m) => m.resourceType === "raw");

  return (
    <div className="mt-3 space-y-2">
      {/* Image grid */}
      {images.length > 0 && (
        <div
          className={`grid gap-1.5 overflow-hidden rounded-xl ${
            images.length === 1
              ? "grid-cols-1"
              : images.length === 2
              ? "grid-cols-2"
              : "grid-cols-2"
          }`}
        >
          {images.slice(0, 4).map((media, i) => {
            const isSpanning = images.length === 3 && i === 2;
            return (
              <a
                key={media.publicId}
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block overflow-hidden rounded-lg ${
                  isSpanning ? "col-span-2" : ""
                } ${images.length === 1 ? "max-h-96" : "aspect-square"}`}
              >
                <img
                  src={media.url}
                  alt={`Post image ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                {/* "+N more" overlay on 4th tile */}
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                    +{images.length - 4}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* PDF attachments */}
      {pdfs.length > 0 && (
        <div className="space-y-1.5">
          {pdfs.map((pdf) => (
            <a
              key={pdf.publicId}
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
            >
              <FileText className="h-4 w-4 shrink-0 text-red-400" />
              <span className="flex-1 truncate">
                {pdf.url.split("/").pop().split("?")[0] || "Document"}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main PostCard ─────────────────────────────────────────────────────────────
const PostCard = ({ post }) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [copied, setCopied]   = useState(false);
  const [deleted, setDeleted] = useState(false);

  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();

  const isOwner = user?._id === post.author?._id || user?.role === "admin";
  const typeMeta = POST_TYPE_META[post.postType] ?? POST_TYPE_META.general;
  const TypeIcon = typeMeta.icon;

  const initials = post.author?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  // ── Like handler ─────────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (isLiking) return;
    toggleLike({
      postId:            post._id,
      currentlyLiked:    post.isLikedByCurrentUser,
      currentLikesCount: post.likesCount,
    });
  }, [isLiking, toggleLike, post._id, post.isLikedByCurrentUser, post.likesCount]);

  // ── Share handler ─────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/posts/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      window.prompt("Copy this link:", url);
    }
  }, [post._id]);

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post._id);
      setDeleted(true);
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    } catch {
      // Error handling is lightweight here; a toast system can be added later
    }
  }, [post._id, queryClient]);

  // Don't render if deleted
  if (deleted) return null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group rounded-2xl border border-border/40 bg-card/35 backdrop-blur-sm transition-all duration-300 hover:border-border/70 hover:bg-card/50 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="p-5">
        {/* ── Header: author + type badge ──────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/30 transition-all duration-200 group-hover:ring-primary/30">
              <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {post.author?.name ?? "Unknown"}
                </p>
                {post.author?.department && (
                  <span className="rounded-md border border-border/30 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {post.author.department}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Post type pill */}
            <span
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium ${typeMeta.class}`}
            >
              <TypeIcon className="h-2.5 w-2.5" />
              {typeMeta.label}
            </span>

            {/* Delete button (owner/admin only) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                aria-label="Delete post"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Caption ──────────────────────────────────────────────────── */}
        <p className="mt-3.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {post.caption}
        </p>

        {/* ── Tags ─────────────────────────────────────────────────────── */}
        {post.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Media ────────────────────────────────────────────────────── */}
        {post.mediaUrls?.length > 0 && (
          <MediaGrid mediaUrls={post.mediaUrls} />
        )}
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-t border-border/25 px-4 py-2.5">
        {/* Like button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleLike}
          disabled={isLiking}
          aria-label={post.isLikedByCurrentUser ? "Unlike post" : "Like post"}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            post.isLikedByCurrentUser
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/15"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <motion.div
            animate={post.isLikedByCurrentUser ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Heart
              className={`h-4 w-4 transition-all duration-200 ${
                post.isLikedByCurrentUser ? "fill-red-400 text-red-400" : ""
              }`}
            />
          </motion.div>
          <span>{post.likesCount}</span>
        </motion.button>

        {/* Comments (display only for now — future feature) */}
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>

        <div className="flex-1" />

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          aria-label="Share post"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" />
          {copied ? (
            <span className="text-green-400">Copied!</span>
          ) : (
            <span>Share</span>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
};

export default PostCard;
