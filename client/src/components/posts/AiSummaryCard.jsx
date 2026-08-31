import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ListChecks, HelpCircle, X } from "lucide-react";

// ── "Thinking" status cycle ────────────────────────────────────────────────────
const THINKING_MESSAGES = [
  "Reading your note…",
  "Extracting key ideas…",
  "Drafting study questions…",
  "Polishing the summary…",
];

const AiThinkingState = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % THINKING_MESSAGES.length), 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-xs font-medium text-violet-300"
          >
            {THINKING_MESSAGES[index]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-violet-500/10" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-violet-500/10" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-violet-500/10" />
      </div>
    </div>
  );
};

/**
 * AiSummaryCard — collapsible, glowing panel showing the structured AI
 * study summary (summary / key points / study questions) for a note post.
 *
 * @param {{
 *   data: { summary: string, keyPoints: string[], studyQuestions: string[], cached?: boolean } | undefined,
 *   isLoading: boolean,
 *   isError: boolean,
 *   onRegenerate: () => void,
 *   onClose: () => void,
 * }}
 */
const AiSummaryCard = ({ data, isLoading, isError, onRegenerate, onClose }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className="overflow-hidden rounded-xl border border-l-[3px] border-border border-l-violet-400 bg-card"
  >
    {/* Header */}
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-violet-200">AI Study Summary</span>
      </div>
      <div className="flex items-center gap-1">
        {!isLoading && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-violet-300/70 transition-colors hover:bg-violet-500/10 hover:text-violet-200"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-md p-1 text-violet-300/50 transition-colors hover:bg-violet-500/10 hover:text-violet-200"
          aria-label="Close AI summary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    {/* Body */}
    {isLoading && <AiThinkingState />}

    {isError && !isLoading && (
      <p className="px-4 py-4 text-xs text-muted-foreground/70">
        Couldn&apos;t generate a summary right now. Try again in a moment.
      </p>
    )}

    {!isLoading && !isError && data && (
      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-sm leading-relaxed text-foreground/90">{data.summary}</p>
          {data.cached && <p className="mt-1 text-[10px] text-muted-foreground/40">Cached result</p>}
        </div>

        {data.keyPoints?.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-300/80">
              <ListChecks className="h-3 w-3" />
              Key Points
            </div>
            <ul className="space-y-1">
              {data.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.studyQuestions?.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-300/80">
              <HelpCircle className="h-3 w-3" />
              Study Questions
            </div>
            <ol className="space-y-1.5">
              {data.studyQuestions.map((question, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/80">
                  <span className="font-semibold text-violet-400">{i + 1}.</span>
                  {question}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    )}
  </motion.div>
);

export default AiSummaryCard;
