import { useState, useCallback } from "react";
import { Send } from "lucide-react";
import useSendMessage from "@/hooks/useSendMessage";

const MAX_LENGTH = 2000;

/**
 * MessageComposer — chat input + send button, pinned to the bottom of ChatWindow.
 *
 * @param {{ userId: string }} props
 */
const MessageComposer = ({ userId }) => {
  const [text, setText] = useState("");
  const { mutate: send, isPending } = useSendMessage(userId);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      send(trimmed, { onSuccess: () => setText("") });
    },
    [text, isPending, send]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const canSend = text.trim().length > 0 && text.length <= MAX_LENGTH && !isPending;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border/25 p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message…"
        rows={1}
        maxLength={MAX_LENGTH}
        className="max-h-32 flex-1 resize-none rounded-xl border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
};

export default MessageComposer;
