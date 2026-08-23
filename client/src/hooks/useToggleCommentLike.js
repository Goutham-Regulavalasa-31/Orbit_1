import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleCommentLike } from "@/api/comments.api";

/**
 * useToggleCommentLike — optimistic like toggle for comment nodes.
 *
 * Finds the target comment anywhere in the cached tree (recursive search)
 * and flips its like state before the server responds.
 *
 * @param {string} postId
 */
const useToggleCommentLike = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }) => toggleCommentLike({ postId, commentId }),

    onMutate: async ({ commentId, currentlyLiked, currentLikesCount }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      const previousData = queryClient.getQueryData(["comments", postId]);

      queryClient.setQueryData(["comments", postId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.map((c) =>
              updateLikeInTree(c, commentId, currentlyLiked, currentLikesCount)
            ),
          })),
        };
      });

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["comments", postId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", postId],
        exact: true,
      });
    },
  });
};

// ── Recursive tree updater ────────────────────────────────────────────────────
const updateLikeInTree = (comment, targetId, currentlyLiked, currentCount) => {
  if (comment._id === targetId) {
    return {
      ...comment,
      isLikedByCurrentUser: !currentlyLiked,
      likesCount: currentlyLiked
        ? Math.max(0, currentCount - 1)
        : currentCount + 1,
    };
  }
  if (!comment.replies?.length) return comment;
  return {
    ...comment,
    replies: comment.replies.map((r) =>
      updateLikeInTree(r, targetId, currentlyLiked, currentCount)
    ),
  };
};

export default useToggleCommentLike;
