import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "@/api/posts.api";

/**
 * useToggleLike — mutation hook with optimistic UI updates.
 *
 * Optimistic update strategy:
 *  1. onMutate:   Snapshot the current cache, immediately update the UI
 *                 (like fills, count changes) before the server responds.
 *  2. onError:    Roll back to the snapshot if the server request fails.
 *  3. onSettled:  Always invalidate to reconcile with server truth,
 *                 catching edge cases like concurrent likes from other devices.
 *
 * This pattern ensures zero-latency UI feedback while maintaining consistency.
 */
const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }) => toggleLike(postId),

    onMutate: async ({ postId, currentlyLiked, currentLikesCount }) => {
      // Cancel any in-flight feed refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });

      // Snapshot all feed cache entries (there may be multiple filter variants)
      const previousFeedData = queryClient.getQueriesData({
        queryKey: ["posts", "feed"],
      });

      // Optimistically update every cached feed page that contains this post
      queryClient.setQueriesData(
        { queryKey: ["posts", "feed"] },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
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
            })),
          };
        }
      );

      // Return snapshot so onError can roll back
      return { previousFeedData };
    },

    onError: (_error, _variables, context) => {
      // Rollback: restore all feed entries to their pre-mutation state
      if (context?.previousFeedData) {
        context.previousFeedData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      // Sync with server truth after mutation resolves (success or failure)
      queryClient.invalidateQueries({
        queryKey: ["posts", "feed"],
        exact: false,
      });
    },
  });
};

export default useToggleLike;
