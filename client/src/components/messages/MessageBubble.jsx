import { motion } from "framer-motion";

const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * MessageBubble — a single chat message, aligned by sender.
 *
 * @param {{ message: object, isOwn: boolean }} props
 */
const MessageBubble = ({ message, isOwn }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isOwn
          ? "rounded-br-md bg-primary text-primary-foreground"
          : "rounded-bl-md border border-border/40 bg-card/60 text-foreground/90"
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{message.text}</p>
      <p className={`mt-1 text-right text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground/50"}`}>
        {formatTime(message.createdAt)}
      </p>
    </div>
  </motion.div>
);

export default MessageBubble;
