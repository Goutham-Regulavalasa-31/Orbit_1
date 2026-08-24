import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/api/posts.api";

/**
 * useCreatePost — mutation hook for creating a new post.
 *
 * On success, invalidates the relevant feed query cache so the new post
 * appears immediately without requiring a manual refresh — the global feed
 * normally, or a specific club's feed when `clubId` is passed (see
 * ClubDetailPage, which renders CreatePostCard with clubId set).
 *
 * Usage:
 *   const { mutate, isPending } = useCreatePost();
 *   mutate(formData); // FormData with caption, postType, tags, media files
 */
const useCreatePost = ({ clubId, onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,

    onSuccess: (newPost) => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "posts"] });
      } else {
        // Invalidate all feed variants (regardless of active postType filter)
        queryClient.invalidateQueries({
          queryKey: ["posts", "feed"],
          exact: false, // invalidate all sub-keys (filter variants)
        });
      }

      onSuccess?.(newPost);
    },

    onError: (error) => {
      const message =
        error?.response?.data?.message ?? "Failed to create post";
      onError?.(message);
    },
  });
};

export default useCreatePost;
