import { useQuery } from "@tanstack/react-query";
import { fetchEventById } from "@/api/events.api";

/**
 * useEventDetail — fetches a single event's details.
 *
 * @param {string} eventId
 */
const useEventDetail = (eventId) => {
  const query = useQuery({
    queryKey: ["events", eventId, "detail"],
    queryFn: () => fetchEventById(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });

  return {
    event: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useEventDetail;
