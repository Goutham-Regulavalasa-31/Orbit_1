import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleRSVP } from "@/api/events.api";

/**
 * useToggleRSVP — optimistic RSVP toggle for an event.
 *
 * Mirrors useToggleClubMembership's shape exactly (onMutate snapshot+flip,
 * onError rollback, onSettled reconcile), but touches two cache locations
 * instead of one: the event can be toggled either from its own detail page
 * or straight from its EventCard in the /events grid, so both the detail
 * cache and the paginated list cache get the same optimistic flip.
 *
 * @param {string} eventId
 */
const useToggleRSVP = (eventId) => {
  const queryClient = useQueryClient();

  const applyFlip = (isAttending, attendeesCount) => ({
    isAttending: !isAttending,
    attendeesCount: isAttending ? Math.max(0, attendeesCount - 1) : attendeesCount + 1,
  });

  return useMutation({
    mutationFn: () => toggleRSVP(eventId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["events", eventId, "detail"] });
      await queryClient.cancelQueries({ queryKey: ["events", "upcoming"] });

      const previousDetail = queryClient.getQueryData(["events", eventId, "detail"]);
      const previousList = queryClient.getQueriesData({ queryKey: ["events", "upcoming"] });

      queryClient.setQueryData(["events", eventId, "detail"], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...applyFlip(oldData.isAttending, oldData.attendeesCount) };
      });

      queryClient.setQueriesData({ queryKey: ["events", "upcoming"] }, (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            events: page.events.map((e) =>
              e._id === eventId ? { ...e, ...applyFlip(e.isAttending, e.attendeesCount) } : e
            ),
          })),
        };
      });

      return { previousDetail, previousList };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(["events", eventId, "detail"], context.previousDetail);
      }
      if (context?.previousList) {
        context.previousList.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "detail"] });
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
    },
  });
};

export default useToggleRSVP;
