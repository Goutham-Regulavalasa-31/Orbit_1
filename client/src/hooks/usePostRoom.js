import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSocket from "./useSocket";

/**
 * Every query-key root that can hold a paginated list of post objects —
 * see the identical constant (and its rationale) in useToggleLike.js. Kept
 * as a separate copy here rather than a shared import: this file has no
 * other dependency on that module, and the two lists are free to diverge
 * if a future feed type needs different real-time handling.
 */
const POST_QUERY_ROOTS = [
  ["posts", "feed"],
  ["clubs"],
  ["users"],
];

const usePostRoom = (postId) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !postId) return;

    socket.emit("join_post", { postId });

    const onNewComment = (comment) => {
      queryClient.setQueryData(["comments", postId], (oldData) => {
        if (!oldData) return oldData;

        if (!comment.parentCommentId) {
          // Check for top level duplicate across all loaded pages
          if (oldData.pages.some((page) => page.comments.some((c) => c._id === comment._id))) return oldData;
          // Comments are sorted oldest-first (matches server order), so a new
          // top-level comment belongs at the end of the last loaded page.
          const lastIndex = oldData.pages.length - 1;
          return {
            ...oldData,
            pages: oldData.pages.map((page, i) =>
              i === lastIndex ? { ...page, comments: [...page.comments, { ...comment, replies: [] }] } : page
            ),
          };
        }

        // Append nested reply
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.map((c) => appendReply(c, comment.parentCommentId, comment)),
          })),
        };
      });
      updateFeedCommentsCount(queryClient, postId, +1);
    };

    const onCommentLiked = ({ commentId, likesCount }) => {
      queryClient.setQueryData(["comments", postId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.map((c) => updateCommentInTree(c, commentId, { likesCount })),
          })),
        };
      });
    };

    const onPostLiked = ({ postId: pid, likesCount }) => {
      if (String(pid) !== String(postId)) return;

      POST_QUERY_ROOTS.forEach((queryKey) => {
        queryClient.setQueriesData({ queryKey }, (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => {
              if (!Array.isArray(page?.posts)) return page;
              return {
                ...page,
                posts: page.posts.map((post) => {
                  if (post._id !== pid) return post;
                  return { ...post, likesCount };
                }),
              };
            }),
          };
        });
      });
    };

    socket.on("new_comment", onNewComment);
    socket.on("comment_liked", onCommentLiked);
    socket.on("post_liked", onPostLiked);

    return () => {
      socket.emit("leave_post", { postId });
      socket.off("new_comment", onNewComment);
      socket.off("comment_liked", onCommentLiked);
      socket.off("post_liked", onPostLiked);
    };
  }, [socket, isConnected, postId, queryClient]);
};

const appendReply = (comment, parentId, newReply) => {
  if (comment._id === parentId) {
    if (comment.replies?.some(r => r._id === newReply._id)) return comment;
    return { ...comment, replies: [...(comment.replies ?? []), { ...newReply, replies: [] }] };
  }
  if (!comment.replies?.length) return comment;
  return { ...comment, replies: comment.replies.map((r) => appendReply(r, parentId, newReply)) };
};

const updateCommentInTree = (comment, targetId, updates) => {
  if (comment._id === targetId) return { ...comment, ...updates };
  if (!comment.replies?.length) return comment;
  return { ...comment, replies: comment.replies.map((r) => updateCommentInTree(r, targetId, updates)) };
};

/**
 * Bumps a post's commentsCount by `delta` wherever it appears — the global
 * feed, any club feed, any profile feed. `setQueriesData` with these broad
 * roots also touches non-post-list caches sharing the same prefix (club
 * detail, user profile); the `!oldData?.pages` / `!Array.isArray(page?.posts)`
 * guards make that a safe no-op rather than a crash.
 */
const updateFeedCommentsCount = (queryClient, postId, delta) => {
  POST_QUERY_ROOTS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey }, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => {
          if (!Array.isArray(page?.posts)) return page;
          return {
            ...page,
            posts: page.posts.map((post) => {
              if (post._id !== postId) return post;
              return { ...post, commentsCount: Math.max(0, (post.commentsCount ?? 0) + delta) };
            }),
          };
        }),
      };
    });
  });
};

export default usePostRoom;
