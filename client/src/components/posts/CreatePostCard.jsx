import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  HelpCircle,
  ImagePlus,
  X,
  Send,
  FileText,
  Tag,
} from "lucide-react";
import useCreatePost from "@/hooks/useCreatePost";
import useAuthStore from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Post type config ──────────────────────────────────────────────────────────
const POST_TYPES = [
  {
    value: "general",
    label: "General",
    icon: MessageSquare,
    color: "text-blue-400",
    activeClass: "border-blue-500/60 bg-blue-500/10 text-blue-300",
    description: "Share anything with the community",
  },
  {
    value: "note",
    label: "Note",
    icon: BookOpen,
    color: "text-emerald-400",
    activeClass: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
    description: "Share study notes or resources",
  },
  {
    value: "doubt",
    label: "Doubt",
    icon: HelpCircle,
    color: "text-amber-400",
    activeClass: "border-amber-500/60 bg-amber-500/10 text-amber-300",
    description: "Ask the community a question",
  },
];

const MAX_CAPTION  = 500;
const MAX_FILES    = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];

// ── Helper ────────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * @param {{ clubId?: string }} [props] - When rendered inside a Club Detail
 * Page, pass the club's id so the new post is scoped to that club instead of
 * the global feed (see ClubDetailPage.jsx).
 */
const CreatePostCard = ({ clubId = null } = {}) => {
  const user = useAuthStore((s) => s.user);

  const [caption, setCaption]       = useState("");
  const [postType, setPostType]     = useState("general");
  const [tags, setTags]             = useState("");
  const [files, setFiles]           = useState([]); // { file: File, preview: string }[]
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError]           = useState(null);

  const fileInputRef = useRef(null);

  const { mutate: submitPost, isPending } = useCreatePost({
    clubId,
    onSuccess: () => {
      setCaption("");
      setTags("");
      setFiles([]);
      setPostType("general");
      setError(null);
    },
    onError: (msg) => setError(msg),
  });

  // ── File handling ─────────────────────────────────────────────────────────
  const addFiles = useCallback((newFiles) => {
    setError(null);
    const filtered = Array.from(newFiles).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not a supported file type.`);
        return false;
      }
      return true;
    });

    setFiles((prev) => {
      const combined = [...prev, ...filtered.map((f) => ({
        file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      }))];
      if (combined.length > MAX_FILES) {
        setError(`You can attach at most ${MAX_FILES} files.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  // ── Drag-and-drop handlers ────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caption.trim()) { setError("Caption is required."); return; }
    if (isPending) return;

    const formData = new FormData();
    formData.append("caption",  caption.trim());
    formData.append("postType", postType);
    formData.append("tags",     tags.trim());
    if (clubId) formData.append("clubId", clubId);
    files.forEach(({ file }) => formData.append("media", file));

    submitPost(formData);
  };

  const charCount   = caption.length;
  const charOverage = charCount > MAX_CAPTION;
  const activeType  = POST_TYPES.find((t) => t.value === postType);
  const initials    = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg shadow-black/20"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-5">
          {/* ── Author row ────────────────────────────────────────────── */}
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              {/* ── Caption textarea ──────────────────────────────────── */}
              <div className="relative">
                <textarea
                  id="post-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={activeType?.description ?? "What's on your mind?"}
                  rows={3}
                  maxLength={MAX_CAPTION + 50} // soft enforced via UI
                  className="w-full resize-none rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200"
                />
                {/* Character counter */}
                <span
                  className={`absolute bottom-2 right-3 text-[10px] font-mono transition-colors ${
                    charOverage
                      ? "text-red-400"
                      : charCount > MAX_CAPTION * 0.8
                      ? "text-amber-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {charCount}/{MAX_CAPTION}
                </span>
              </div>

              {/* ── Post type selector ────────────────────────────────── */}
              <div className="flex items-center gap-2">
                {POST_TYPES.map(({ value, label, icon: Icon, activeClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPostType(value)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      postType === value
                        ? activeClass
                        : "border-border/30 text-muted-foreground hover:border-border/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Tags input ────────────────────────────────────────── */}
              <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/30 px-3 py-2">
                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <input
                  id="post-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags: react, algorithms, exam (comma-separated)"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Drag-and-drop zone ────────────────────────────────────────── */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
            className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? "border-primary/60 bg-primary/5 scale-[1.01]"
                : files.length > 0
                ? "border-border/30 bg-transparent"
                : "border-border/20 bg-background/20 hover:border-border/40 hover:bg-background/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />

            {/* File preview grid */}
            {files.length > 0 ? (
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  <AnimatePresence>
                    {files.map(({ file, preview }, i) => (
                      <motion.div
                        key={`${file.name}-${i}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-background/60"
                      >
                        {preview ? (
                          <img
                            src={preview}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1 p-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="text-center text-[10px] text-muted-foreground leading-tight line-clamp-2">
                              {file.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}

                    {/* Add more tile */}
                    {files.length < MAX_FILES && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border/30 text-muted-foreground/40 hover:border-border/50 hover:text-muted-foreground/60 transition-colors"
                      >
                        <ImagePlus className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground/50">
                  Drop images or PDFs here, or click to browse
                </p>
                <p className="text-[10px] text-muted-foreground/30">
                  Up to {MAX_FILES} files · Images ≤10MB · PDFs ≤20MB
                </p>
              </div>
            )}
          </div>

          {/* ── Error message ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer / submit ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/30 px-5 py-3">
          <span className="text-xs text-muted-foreground/50">
            Posting as <span className="font-medium text-foreground/70">{user?.name}</span>
          </span>

          <button
            type="submit"
            disabled={isPending || !caption.trim() || charOverage}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Posting…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreatePostCard;
