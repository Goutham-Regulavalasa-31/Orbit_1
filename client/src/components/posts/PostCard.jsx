import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useToggleLike from "@/hooks/useToggleLike";
import useAuthStore from "@/store/useAuthStore";
import { deletePost } from "@/api/posts.api";
import { useQueryClient } from "@tanstack/react-query";

// IMPORT V3 REAL-TIME COMPONENTS
import usePostRoom from "@/hooks/usePostRoom";
import CommentSection from "@/components/comments/CommentSection";

// V5: AI notes summarization
import useSummarizePost from "@/hooks/useSummarizePost";
import AiSummaryCard from "@/components/posts/AiSummaryCard";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRelativeTime = (isoString) => {
  const now = Date.now();
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
    day: "numeric",
  });
};

const POST_TYPE_META = {
  general: { icon: MessageSquare, label: "General", class: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  note: { icon: BookOpen, label: "Note", class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  doubt: { icon: HelpCircle, label: "Doubt", class: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
};

const MediaGrid = ({ mediaUrls }) => {
  const images = mediaUrls.filter((m) => m.resourceType === "image");
  const pdfs = mediaUrls.filter((m) => m.resourceType === "raw");

  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-1.5 overflow-hidden rounded-xl ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.slice(0, 4).map((media, i) => {
            const isSpanning = images.length === 3 && i === 2;
            return (
              <a
                key={media.publicId}
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block overflow-hidden rounded-lg ${isSpanning ? "col-span-2" : ""} ${images.length === 1 ? "max-h-96" : "aspect-square"}`}
              >
                <img src={media.url} alt={`Post image ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
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
      {pdfs.length > 0 && (
        <div className="space-y-1.5">
          {pdfs.map((pdf) => (
            <a key={pdf.publicId} href={pdf.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-background/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground">
              <FileText className="h-4 w-4 shrink-0 text-red-400" />
              <span className="flex-1 truncate">{pdf.url.split("/").pop().split("?")[0] || "Document"}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const PostCard = ({ post }) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();
  const {
    mutate: summarize,
    data: summaryData,
    isPending: isSummarizing,
    isError: isSummarizeError,
  } = useSummarizePost(post._id);

  // FIX: Force every post to join its real-time socket room immediately
  usePostRoom(post._id);

  const isOwner = user?._id === post.author?._id || user?.role === "admin";
  const typeMeta = POST_TYPE_META[post.postType] ?? POST_TYPE_META.general;
  const TypeIcon = typeMeta.icon;

  const initials = post.author?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const handleLike = useCallback(() => {
    if (isLiking) return;
    toggleLike({
      postId: post._id,
      currentlyLiked: post.isLikedByCurrentUser,
      currentLikesCount: post.likesCount,
    });
  }, [isLiking, toggleLike, post._id, post.isLikedByCurrentUser, post.likesCount]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/posts/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }, [post._id]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post._id);
      setDeleted(true);
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    } catch {}
  }, [post._id, queryClient]);

  const handleToggleSummary = useCallback(() => {
    setShowSummary((prev) => {
      const next = !prev;
      if (next && !summaryData) summarize();
      return next;
    });
  }, [summaryData, summarize]);

  const handleRegenerateSummary = useCallback(() => summarize({ refresh: true }), [summarize]);

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author?._id}`}>
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/30 transition-all duration-200 group-hover:ring-primary/30">
                <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/profile/${post.author?._id}`} className="text-sm font-semibold text-foreground leading-none hover:underline">
                  {post.author?.name ?? "Unknown"}
                </Link>
                {post.author?.department && (
                  <span className="rounded-md border border-border/30 bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">{post.author.department}</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium ${typeMeta.class}`}>
              <TypeIcon className="h-2.5 w-2.5" />
              {typeMeta.label}
            </span>
            {isOwner && (
              <button onClick={handleDelete} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-3.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.caption}</p>
        {post.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary/80">#{tag}</span>
            ))}
          </div>
        )}
        {post.mediaUrls?.length > 0 && <MediaGrid mediaUrls={post.mediaUrls} />}
      </div>

      <div className="flex items-center gap-1 border-t border-border/25 px-4 py-2.5">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            post.isLikedByCurrentUser ? "bg-red-500/10 text-red-400 hover:bg-red-500/15" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <motion.div animate={post.isLikedByCurrentUser ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
            <Heart className={`h-4 w-4 transition-all duration-200 ${post.isLikedByCurrentUser ? "fill-red-400 text-red-400" : ""}`} />
          </motion.div>
          <span>{post.likesCount}</span>
        </motion.button>

        {/* FIX: Now toggles the comment section component! */}
        <button 
          onClick={() => setShowComments((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 hover:text-foreground ${showComments ? "bg-muted/50 text-foreground" : "text-muted-foreground"}`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>

        {post.postType === "note" && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleSummary}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              showSummary ? "bg-violet-500/10 text-violet-300" : "text-violet-400/80 hover:bg-violet-500/10 hover:text-violet-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{showSummary ? "Hide Summary" : "Summarize with AI"}</span>
          </motion.button>
        )}

        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground">
          <Share2 className="h-3.5 w-3.5" />
          {copied ? <span className="text-green-400">Copied!</span> : <span>Share</span>}
        </motion.button>
      </div>

      {/* V5: AI study summary panel */}
      <AnimatePresence>
        {showSummary && (
          <div className="px-4 pb-4">
            <AiSummaryCard
              data={summaryData}
              isLoading={isSummarizing}
              isError={isSummarizeError}
              onRegenerate={handleRegenerateSummary}
              onClose={() => setShowSummary(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* FIX: Actually render the nested comment UI */}
      <AnimatePresence>
        {showComments && <CommentSection postId={post._id} />}
      </AnimatePresence>
    </motion.article>
  );
};

export default PostCard;