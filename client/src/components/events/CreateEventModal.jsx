import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Calendar, MapPin } from "lucide-react";
import useCreateEvent from "@/hooks/useCreateEvent";

const MAX_TITLE = 100;
const MAX_DESCRIPTION = 1000;

// Earliest selectable value for the datetime-local input — "now" rounded
// down to the minute, formatted the way the input expects (no seconds/Z).
const minDateTimeLocal = () => {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return now.toISOString().slice(0, 16);
};

/**
 * CreateEventModal — overlay form for creating a new campus event.
 * Triggered from EventsHubPage's "Create Event" button.
 */
const CreateEventModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [cover, setCover] = useState(null); // { file, preview } | null
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const { mutate: submitEvent, isPending } = useCreateEvent({
    onSuccess: (event) => onCreated?.(event),
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
    if (title.trim().length < 3) {
      setError("Event title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (location.trim().length < 3) {
      setError("Location must be at least 3 characters.");
      return;
    }
    if (!date) {
      setError("Pick a date and time.");
      return;
    }
    if (new Date(date) <= new Date()) {
      setError("Event date must be in the future.");
      return;
    }
    if (isPending) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("date", new Date(date).toISOString());
    formData.append("location", location.trim());
    if (cover?.file) formData.append("coverImage", cover.file);

    submitEvent(formData);
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
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Create an Event</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
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

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              maxLength={MAX_TITLE}
              className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about?"
              rows={3}
              maxLength={MAX_DESCRIPTION}
              className="w-full resize-none rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Date + time */}
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-4 py-2.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <input
                type="datetime-local"
                value={date}
                min={minDateTimeLocal()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-4 py-2.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Student Union, Room 204)"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
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
                {isPending ? "Creating…" : "Create Event"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateEventModal;
