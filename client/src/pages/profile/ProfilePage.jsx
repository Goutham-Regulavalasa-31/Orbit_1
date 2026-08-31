import { useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, GraduationCap, Loader2, Orbit, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCard from "@/components/posts/PostCard";
import PostCardSkeleton from "@/components/posts/PostCardSkeleton";
import useUserProfile from "@/hooks/useUserProfile";
import useUserPosts from "@/hooks/useUserPosts";
import useAuthStore from "@/store/useAuthStore";

const ROLE_LABEL = {
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

const formatJoinDate = (isoString) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(isoString));

// ── Header skeleton ────────────────────────────────────────────────────────────
const ProfileHeaderSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-border bg-card p-6">
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
    </div>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const ProfileError = () => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
    <p className="text-sm text-muted-foreground">This profile couldn&apos;t be found.</p>
    <Link
      to="/dashboard"
      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to feed
    </Link>
  </div>
);

const ProfilePage = () => {
  const { userId } = useParams();
  const loaderRef = useRef(null);
  const currentUserId = useAuthStore((s) => s.user?._id);

  const { profile, isLoading: isProfileLoading, isError: isProfileError } = useUserProfile(userId);
  const {
    posts,
    isLoading: isPostsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: isPostsError,
  } = useUserPosts(userId);

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

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {isProfileLoading && <ProfileHeaderSkeleton />}

      {isProfileError && !isProfileLoading && <ProfileError />}

      {!isProfileLoading && !isProfileError && profile && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-16 bg-muted" />

          <div className="px-6 pb-6">
            <Avatar className="-mt-10 h-20 w-20 ring-4 ring-background">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{profile.name}</h1>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {ROLE_LABEL[profile.role] ?? profile.role}
                </span>
              </div>
              {currentUserId && currentUserId !== profile._id && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/messages/${profile._id}`}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </Link>
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/80">{profile.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {profile.department && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {profile.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatJoinDate(profile.createdAt)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-4 text-sm">
              <span className="font-semibold text-foreground">{profile.postsCount}</span>
              <span className="text-muted-foreground">{profile.postsCount === 1 ? "post" : "posts"}</span>
            </div>
          </div>
        </div>
      )}

        {/* ── Post history ─────────────────────────────────────────────────── */}
        {!isProfileError && (
          <div className="mt-6 space-y-4">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Orbit className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No posts yet.</p>
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

export default ProfilePage;
