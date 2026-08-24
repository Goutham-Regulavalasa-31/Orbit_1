import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "@/api/posts.api";

/**
 * Every query-key root that can hold a paginated list of post objects.
 * A post rendered via PostCard can currently appear in:
 *  - the global dashboard feed        ["posts", "feed", ...]
 *  - a club's post feed               ["clubs", clubId, "posts"]
 *  - a user's profile post history    ["users", userId, "posts"]
 *
 * These are root prefixes, not exact keys — `setQueriesData`/`invalidateQueries`
 * with `exact: false` matches every query nested under them. That also matches
 * non-post-list queries sharing the same root (e.g. ["clubs", "directory"] or
 * ["users", userId, "profile"]); `applyLikeUpdate` below is written to safely
 * no-op on any shape that isn't a paginated `{pages: [{posts: [...]}]}` list.
 */
const POST_QUERY_ROOTS = [
  ["posts", "feed"],
  ["clubs"],
  ["users"],
];

/**
 * Builds a cache updater that flips one post's like state wherever it's
 * found. Safe to run against cache entries that aren't post-list pages at
 * all (returns the data untouched) since POST_QUERY_ROOTS casts a wider net
 * than just feed-shaped queries.
 */
const applyLikeUpdate = (postId, currentlyLiked, currentLikesCount) => (oldData) => {
  if (!oldData?.pages) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => {
      if (!Array.isArray(page?.posts)) return page;

      return {
        ...page,
        posts: page.posts.map((post) => {
          if (post._id !== postId) return post;

          // Flip the like state optimistically
          return {
            ...post,
            isLikedByCurrentUser: !currentlyLiked,
            likesCount: currentlyLiked
              ? Math.max(0, currentLikesCount - 1) // unlike
              : currentLikesCount + 1,              // like
          };
        }),
      };
    }),
  };
};

/**
 * useToggleLike — mutation hook with optimistic UI updates.
 *
 * Optimistic update strategy:
 *  1. onMutate:   Snapshot every post-list query cache (feed, club feeds,
 *                 profile feeds), immediately update the UI (like fills,
 *                 count changes) before the server responds.
 *  2. onError:    Roll back every snapshot if the server request fails.
 *  3. onSettled:  Always invalidate all three roots to reconcile with
 *                 server truth, catching edge cases like concurrent likes
 *                 from other devices.
 *
 * This pattern ensures zero-latency UI feedback while maintaining consistency
 * everywhere a post can be rendered — not just the global dashboard feed.
 */
const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }) => toggleLike(postId),

    onMutate: async ({ postId, currentlyLiked, currentLikesCount }) => {
      // Cancel any in-flight refetches across all post-list roots to prevent
      // them from overwriting our optimistic update
      await Promise.all(
        POST_QUERY_ROOTS.map((queryKey) => queryClient.cancelQueries({ queryKey }))
      );

      // Snapshot every matching cache entry across all three roots (there
      // may be multiple filter/pagination variants of each)
      const previousData = POST_QUERY_ROOTS.flatMap((queryKey) =>
        queryClient.getQueriesData({ queryKey })
      );

      // Optimistically update every cached page — anywhere — that contains this post
      const updater = applyLikeUpdate(postId, currentlyLiked, currentLikesCount);
      POST_QUERY_ROOTS.forEach((queryKey) => queryClient.setQueriesData({ queryKey }, updater));

      // Return snapshot so onError can roll back
      return { previousData };
    },

    onError: (_error, _variables, context) => {
      // Rollback: restore every snapshotted entry to its pre-mutation state
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      // Sync with server truth after mutation resolves (success or failure)
      POST_QUERY_ROOTS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey, exact: false })
      );
    },
  });
};

export default useToggleLike;
