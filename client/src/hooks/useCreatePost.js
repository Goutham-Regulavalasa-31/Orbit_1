import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/api/posts.api";

/**
 * useCreatePost — mutation hook for creating a new post.
 *
 * On success, invalidates the feed query cache so new posts appear immediately
 * without requiring a manual refresh.
 *
 * Usage:
 *   const { mutate, isPending } = useCreatePost();
 *   mutate(formData); // FormData with caption, postType, tags, media files
 */
const useCreatePost = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,

    onSuccess: (newPost) => {
      // Invalidate all feed variants (regardless of active postType filter)
      queryClient.invalidateQueries({
        queryKey: ["posts", "feed"],
        exact: false, // invalidate all sub-keys (filter variants)
      });

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
