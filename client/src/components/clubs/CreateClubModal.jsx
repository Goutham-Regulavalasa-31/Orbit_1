import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Users } from "lucide-react";
import useCreateClub from "@/hooks/useCreateClub";

const MAX_NAME = 60;
const MAX_DESCRIPTION = 500;

/**
 * CreateClubModal — overlay form for creating a new club.
 * Triggered from ClubsDirectoryPage's "Create Club" button.
 */
const CreateClubModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState(null); // { file, preview } | null
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const { mutate: submitClub, isPending } = useCreateClub({
    onSuccess: (club) => onCreated?.(club),
    onError: (msg) => setError(msg),
  });

  const handleCoverChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Cover image must be an image file.");
      return;
    }
    setError(null);
    setCover({ file, preview: URL.createObjectURL(file) });
  }, []);

  const removeCover = useCallback(() => {
    if (cover?.preview) URL.revokeObjectURL(cover.preview);
    setCover(null);
  }, [cover]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError("Club name must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (isPending) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("tags", tags.trim());
    if (cover?.file) formData.append("coverImage", cover.file);

    submitClub(formData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Create a Club</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Cover image */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/30 bg-background/30 hover:border-border/50"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              {cover ? (
                <>
                  <img src={cover.preview} alt="Cover preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeCover(); }}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add a cover image (optional)</span>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Club name"
                maxLength={MAX_NAME}
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this club about?"
                rows={3}
                maxLength={MAX_DESCRIPTION}
                className="w-full resize-none rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Tags */}
            <div>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags: react, algorithms, exam (comma-separated)"
                className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}
                {isPending ? "Creating…" : "Create Club"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateClubModal;
