import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, RefreshCw, Calendar } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import EventCard from "@/components/events/EventCard";
import CreateEventModal from "@/components/events/CreateEventModal";
import useEvents from "@/hooks/useEvents";

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreate }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/30 bg-card/20 py-16 text-center"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
      <Calendar className="h-8 w-8 text-primary/60" />
    </div>
    <div>
      <p className="font-semibold text-foreground">No upcoming events</p>
      <p className="mt-1 text-sm text-muted-foreground">Be the first to put something on the calendar.</p>
    </div>
    <button
      onClick={onCreate}
      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
    >
      <Plus className="h-3.5 w-3.5" />
      Create an Event
    </button>
  </motion.div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center"
  >
    <p className="text-sm text-muted-foreground">Failed to load events. Check your connection.</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 rounded-lg border border-border/40 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </button>
  </motion.div>
);

const EventsHubPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loaderRef = useRef(null);

  const { events, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, refetch } = useEvents();

  useEffect(() => {
    const sentinel = loaderRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreated = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Campus Events</h1>
            <p className="mt-1.5 text-muted-foreground">See what&apos;s happening, or put something on the calendar.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-border/30 bg-card/25" />
            ))}
          </div>
        )}

        {isError && !isLoading && <ErrorState onRetry={refetch} />}

        {!isLoading && !isError && (
          <>
            {events.length === 0 ? (
              <EmptyState onCreate={() => setIsModalOpen(true)} />
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              </AnimatePresence>
            )}

            <div ref={loaderRef} className="flex justify-center py-6">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more events…
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {isModalOpen && <CreateEventModal onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default EventsHubPage;
