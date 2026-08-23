import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bold, Code, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthStore from "@/store/useAuthStore";
import useCreateComment from "@/hooks/useCreateComment";

const MAX_LENGTH = 1000;

const CommentComposer = ({ postId, replyContext, onCancelReply }) => {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const { mutate: submitComment, isPending } = useCreateComment(postId);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  useEffect(() => {
    if (replyContext) {
      textareaRef.current?.focus();
    }
  }, [replyContext]);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      submitComment(
        { text: trimmed, parentCommentId: replyContext?.parentCommentId ?? null },
        {
          onSuccess: () => {
            setText("");
            onCancelReply?.();
          },
        }
      );
    },
    [text, isPending, submitComment, replyContext, onCancelReply]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const charsLeft = MAX_LENGTH - text.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !isPending;

  // FIX: Keep toolbar visible if there is any text, preventing the phantom click bug!
  const showToolbar = isFocused || text.length > 0;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {replyContext && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5"
          >
            <span className="text-xs text-muted-foreground">
              Replying to <span className="font-semibold text-primary">@{replyContext.replyingToName}</span>
            </span>
            <button onClick={onCancelReply} className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2.5">
        <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/30 mt-0.5">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div
            className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
              showToolbar ? "border-primary/50 shadow-sm shadow-primary/10" : "border-border/30"
            } ${isOverLimit ? "border-red-500/50" : ""}`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={replyContext ? `Reply to @${replyContext.replyingToName}…` : "Add a comment…"}
              rows={showToolbar ? 3 : 1}
              className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />

            <AnimatePresence>
              {showToolbar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between border-t border-border/20 px-3 py-1.5"
                >
                  <span className={`text-[10px] tabular-nums ${isOverLimit ? "text-red-400" : "text-muted-foreground/40"}`}>
                    {charsLeft}
                  </span>

                  <motion.button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // FIX: Forces the textarea to stay focused when clicking
                    whileTap={{ scale: 0.92 }}
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      canSubmit ? "bg-primary text-primary-foreground hover:bg-primary/90" : "cursor-not-allowed opacity-40 bg-muted"
                    }`}
                  >
                    <Send className="h-3 w-3" />
                    {isPending ? "Posting…" : "Post"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentComposer;