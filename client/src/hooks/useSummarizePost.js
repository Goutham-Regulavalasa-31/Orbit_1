import { useMutation, useQueryClient } from "@tanstack/react-query";
import { summarizePost } from "@/api/posts.api";

/**
 * useSummarizePost — triggers (or re-triggers) AI summarization for a note.
 *
 * The mutation's own `data` is the primary read path — PostCard stays
 * mounted while the summary card toggles open/closed, so the last result
 * survives collapsing it. The query-cache write is a secondary convenience
 * so other views rendering the same post (e.g. ProfilePage's PostCard) can
 * pick up an already-generated summary without re-calling the LLM.
 *
 * @param {string} postId
 */
const useSummarizePost = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ refresh = false } = {}) => summarizePost(postId, { refresh }),
    onSuccess: (data) => {
      queryClient.setQueryData(["posts", postId, "aiSummary"], data);
    },
  });
};

export default useSummarizePost;
