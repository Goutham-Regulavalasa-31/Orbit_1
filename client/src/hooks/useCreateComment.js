import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/api/comments.api";

const useCreateComment = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ text, parentCommentId }) => createComment({ postId, text, parentCommentId }),
    
    // FIX: Removed buggy optimistic UI. We now let the blazing-fast 
    // Socket connection inject the real comment directly into the UI!
    
    onSettled: () => {
      // Fallback: silently refresh cache in background
      queryClient.invalidateQueries({ queryKey: ["comments", postId], exact: true });
    },
  });
};

export default useCreateComment;