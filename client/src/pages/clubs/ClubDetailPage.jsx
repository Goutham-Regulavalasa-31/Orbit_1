import { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Crown, Loader2, LogOut, UserPlus, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreatePostCard from "@/components/posts/CreatePostCard";
import PostCard from "@/components/posts/PostCard";
import PostCardSkeleton from "@/components/posts/PostCardSkeleton";
import useClubDetail from "@/hooks/useClubDetail";
import useClubPosts from "@/hooks/useClubPosts";
import useToggleClubMembership from "@/hooks/useToggleClubMembership";
import { cn } from "@/lib/utils";

// ── Hero skeleton ─────────────────────────────────────────────────────────────
const HeroSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
    <div className="h-32 bg-muted" />
    <div className="space-y-2 p-6">
      <div className="h-5 w-48 rounded bg-muted" />
      <div className="h-3 w-72 rounded bg-muted" />
    </div>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ClubError = () => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
    <p className="text-sm text-muted-foreground">This club couldn&apos;t be found.</p>
    <Link
      to="/clubs"
      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Clubs
    </Link>
  </div>
);

const ClubDetailPage = () => {
  const { id: clubId } = useParams();
  const loaderRef = useRef(null);
  const [membershipError, setMembershipError] = useState(null);

  const { club, isLoading: isClubLoading, isError: isClubError } = useClubDetail(clubId);
  const {
    posts,
    isLoading: isPostsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: isPostsError,
  } = useClubPosts(clubId);
  const { mutate: toggleMembership, isPending: isToggling } = useToggleClubMembership(clubId, {
    onError: (message) => setMembershipError(message),
  });

  const handleToggleMembership = () => {
    setMembershipError(null);
    toggleMembership();
  };

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {isClubLoading && <HeroSkeleton />}

        {isClubError && !isClubLoading && <ClubError />}

        {!isClubLoading && !isClubError && club && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative h-32">
              {club.coverImage?.url ? (
                <img src={club.coverImage.url} alt={club.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">{club.name}</h1>
                  {club.isCreator && (
                    <span className="flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      <Crown className="h-3 w-3" />
                      Creator
                    </span>
                  )}
                </div>

                {club.isCreator ? (
                  <span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    You created this club
                  </span>
                ) : (
                  <Button
                    onClick={handleToggleMembership}
                    disabled={isToggling}
                    variant={club.isMember ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "gap-1.5",
                      club.isMember && "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    )}
                  >
                    {club.isMember ? <LogOut className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {club.isMember ? "Leave Club" : "Join Club"}
                  </Button>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{club.description}</p>

              {club.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {club.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary/80">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {club.membersCount} {club.membersCount === 1 ? "member" : "members"}
                </span>
                <span>
                  Created by <span className="font-medium text-foreground/80">{club.creator?.name}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Membership error banner ──────────────────────────────────────── */}
        <AnimatePresence>
          {membershipError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {membershipError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Club feed ─────────────────────────────────────────────────────── */}
        {!isClubError && club && (
          <div className="mt-6 space-y-4">
            {club.isMember ? (
              <CreatePostCard clubId={clubId} />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Join this club to post here.
              </div>
            )}

            {isPostsLoading && (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            )}

            {isPostsError && !isPostsLoading && (
              <p className="py-8 text-center text-xs text-muted-foreground/60">Failed to load posts.</p>
            )}

            {!isPostsLoading && !isPostsError && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
                <p className="text-sm text-muted-foreground">No posts in this club yet.</p>
              </div>
            )}

            {!isPostsLoading &&
              !isPostsError &&
              posts.map((post) => <PostCard key={post._id} post={post} />)}

            <div ref={loaderRef} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more posts…
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default ClubDetailPage;
