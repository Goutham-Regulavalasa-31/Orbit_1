import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "@/api/events.api";

/**
 * useCreateEvent — mutation hook for creating a new event.
 *
 * On success, invalidates the upcoming-events query cache so the new event
 * appears immediately without requiring a manual refresh.
 */
const useCreateEvent = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,

    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events", "upcoming"] });
      onSuccess?.(event);
    },

    onError: (error) => {
      const message = error?.response?.data?.message ?? "Failed to create event";
      onError?.(message);
    },
  });
};

export default useCreateEvent;
