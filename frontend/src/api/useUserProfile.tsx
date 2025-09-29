import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

interface UserProfile {
  id: number;
  clerk_user_id: string;
  email?: string;
  username?: string;
  callsign?: string;
  region?: number;
}

export const useUserProfile = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async (): Promise<UserProfile> => {
      const token = await getToken();
      const response = await apiClient.get("/user/profile", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn, // Only run query if user is signed in
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};
