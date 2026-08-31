import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSocket from "./useSocket";
import useAuthStore from "@/store/useAuthStore";

/**
 * useEventRoom — live "event_rsvp_updated" listener for one event.
 *
 * Mirrors usePostRoom's join-per-render pattern exactly: every rendered
 * EventCard (in the /events grid) and the EventDetailPage call this with
 * the same eventId, each joining the server's `event:<id>` room for as
 * long as they're mounted. That way an RSVP toggle reaches every client
 * currently looking at that event, wherever it's rendered — closing the
 * gap where User B only saw the new attendee count after a hard refresh.
 *
 * `attendeesCount` is patched unconditionally for every recipient. The
 * `isAttending` flag is only flipped for the user who actually triggered
 * the toggle (matched against the current session) — otherwise User B
 * would see themselves marked "going" because User A just RSVP'd.
 *
 * @param {string} eventId
 */
const useEventRoom = (eventId) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!socket || !isConnected || !eventId) return;

    socket.emit("join_event", { eventId });

    const onRsvpUpdated = ({ eventId: id, userId, attending, attendeesCount }) => {
      if (String(id) !== String(eventId)) return;
      const isSelf = userId && currentUserId && String(userId) === String(currentUserId);

      queryClient.setQueryData(["events", eventId, "detail"], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, attendeesCount, ...(isSelf ? { isAttending: attending } : {}) };
      });

      queryClient.setQueriesData({ queryKey: ["events", "upcoming"] }, (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            events: page.events.map((e) =>
              e._id === eventId
                ? { ...e, attendeesCount, ...(isSelf ? { isAttending: attending } : {}) }
                : e
            ),
          })),
        };
      });
    };

    socket.on("event_rsvp_updated", onRsvpUpdated);

    return () => {
      socket.emit("leave_event", { eventId });
      socket.off("event_rsvp_updated", onRsvpUpdated);
    };
  }, [socket, isConnected, eventId, currentUserId, queryClient]);
};

export default useEventRoom;
