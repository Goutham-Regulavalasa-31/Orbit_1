import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClub } from "@/api/clubs.api";

/**
 * useCreateClub — mutation hook for creating a new club.
 *
 * On success, invalidates the directory query cache so the new club appears
 * immediately without requiring a manual refresh.
 */
const useCreateClub = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClub,

    onSuccess: (club) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", "directory"], exact: false });
      onSuccess?.(club);
    },

    onError: (error) => {
      const message = error?.response?.data?.message ?? "Failed to create club";
      onError?.(message);
    },
  });
};

export default useCreateClub;
