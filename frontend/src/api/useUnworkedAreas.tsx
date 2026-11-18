import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

interface UnworkedAreas {
  areas: string[]; // squares no registered user has worked
  worked_areas: string[]; // squares at least one registered user has worked
  total_squares: number;
  total_unworked: number;
  registered_users: number; // how many users the squares were checked against
  users_with_logs: number; // how many of them have uploaded a log
}

// Squares that no registered user has worked yet (square codes only - the
// server never says who worked what).
export const useUnworkedAreas = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<UnworkedAreas>({
    queryKey: ["unworked-areas"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get("/qsos/unworked-areas", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
};
