/**
 * PostCardSkeleton — animated shimmer placeholder while posts are loading.
 *
 * Matches the visual height and structure of a PostCard so the layout
 * doesn't shift when real content arrives.
 */
const Shimmer = ({ className }) => (
  <div
    className={`animate-pulse rounded-lg bg-muted/40 ${className}`}
    aria-hidden="true"
  />
);

const PostCardSkeleton = () => (
  <div className="rounded-2xl border border-border/30 bg-card/25 p-5 space-y-4">
    {/* Header */}
    <div className="flex items-center gap-3">
      <Shimmer className="h-9 w-9 shrink-0 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="h-2.5 w-20" />
      </div>
      <Shimmer className="h-5 w-16 rounded-lg" />
    </div>

    {/* Caption lines */}
    <div className="space-y-2">
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-5/6" />
      <Shimmer className="h-3 w-4/6" />
    </div>

    {/* Optional: fake image block (shown on ~60% of skeletons) */}
    <Shimmer className="h-40 w-full rounded-xl" />

    {/* Action bar */}
    <div className="flex items-center gap-3 border-t border-border/20 pt-3">
      <Shimmer className="h-7 w-16 rounded-lg" />
      <Shimmer className="h-7 w-16 rounded-lg" />
      <div className="flex-1" />
      <Shimmer className="h-7 w-14 rounded-lg" />
    </div>
  </div>
);

export default PostCardSkeleton;
