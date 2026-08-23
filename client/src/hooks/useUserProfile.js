import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "@/api/users.api";

/**
 * useUserProfile — fetches a single user's public profile.
 *
 * @param {string} userId
 */
const useUserProfile = (userId) => {
  const query = useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: () => fetchUserProfile(userId),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useUserProfile;
