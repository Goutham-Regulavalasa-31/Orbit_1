import { useQuery } from "@tanstack/react-query";
import { fetchClubById } from "@/api/clubs.api";

/**
 * useClubDetail — fetches a single club's details.
 *
 * @param {string} clubId
 */
const useClubDetail = (clubId) => {
  const query = useQuery({
    queryKey: ["clubs", clubId, "detail"],
    queryFn: () => fetchClubById(clubId),
    enabled: Boolean(clubId),
    staleTime: 60 * 1000,
  });

  return {
    club: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useClubDetail;
