import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Search, Loader2, RefreshCw, Users } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import ClubCard from "@/components/clubs/ClubCard";
import CreateClubModal from "@/components/clubs/CreateClubModal";
import useClubs from "@/hooks/useClubs";

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Users className="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <p className="font-medium text-foreground">No clubs yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Start the first study group or club for your community.</p>
    </div>
    <Button size="sm" onClick={onCreate} className="gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      Create a Club
    </Button>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12 text-center">
    <p className="text-sm text-muted-foreground">Failed to load clubs. Check your connection.</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </Button>
  </div>
);

const ClubsDirectoryPage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loaderRef = useRef(null);

  // Debounce search input so we don't refetch on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const { clubs, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isError, refetch } = useClubs({
    search: debouncedSearch || undefined,
  });

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
        title="Clubs & Study Groups"
        description="Find your people, or start something new."
        action={
          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Club
          </Button>
        }
      />

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clubs by name or tag…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      )}

      {isError && !isLoading && <ErrorState onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {clubs.length === 0 ? (
            <EmptyState onCreate={() => setIsModalOpen(true)} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clubs.map((club) => (
                  <ClubCard key={club._id} club={club} />
                ))}
              </div>
            </AnimatePresence>
          )}

          <div ref={loaderRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more clubs…
              </div>
            )}
          </div>
        </>
      )}

      {isModalOpen && <CreateClubModal onClose={() => setIsModalOpen(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default ClubsDirectoryPage;
