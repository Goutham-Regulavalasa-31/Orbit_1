import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Loader2, RefreshCw, Calendar } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/events/EventCard";
import CreateEventModal from "@/components/events/CreateEventModal";
import useEvents from "@/hooks/useEvents";

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Calendar className="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <p className="font-medium text-foreground">No upcoming events</p>
      <p className="mt-1 text-sm text-muted-foreground">Be the first to put something on the calendar.</p>
    </div>
    <Button size="sm" onClick={onCreate} className="gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      Create an Event
    </Button>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12 text-center">
    <p className="text-sm text-muted-foreground">Failed to load events. Check your connection.</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </Button>
  </div>
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Campus Events"
        description="See what's happening, or put something on the calendar."
        action={
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-card" />
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

      {isModalOpen && <CreateEventModal onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default EventsHubPage;
