import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleClubMembership } from "@/api/clubs.api";

/**
 * useToggleClubMembership — optimistic join/leave toggle for a club.
 *
 * Previously rolled back the optimistic UI silently on failure — a real
 * error (creator trying to leave, expired session, network issue) looked
 * identical to nothing happening. `onError` now always fires with a
 * human-readable message so the caller can surface it.
 *
 * @param {string} clubId
 * @param {{ onError?: (message: string) => void }} [options]
 */
const useToggleClubMembership = (clubId, { onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleClubMembership(clubId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clubs", clubId, "detail"] });

      const previousDetail = queryClient.getQueryData(["clubs", clubId, "detail"]);

      queryClient.setQueryData(["clubs", clubId, "detail"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isMember: !oldData.isMember,
          membersCount: oldData.isMember
            ? Math.max(0, oldData.membersCount - 1)
            : oldData.membersCount + 1,
        };
      });

      return { previousDetail };
    },

    onError: (error, _variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(["clubs", clubId, "detail"], context.previousDetail);
      }
      const message = error?.response?.data?.message ?? "Failed to update club membership";
      onError?.(message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "detail"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", "directory"], exact: false });
    },
  });
};

export default useToggleClubMembership;
