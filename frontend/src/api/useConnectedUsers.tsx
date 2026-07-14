import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_CONNECTED_USERS_QUERY_KEY } from "@/api/queryKeys";
import { apiClient } from "@/lib/api";

export interface ConnectedUsersStatus {
  connected_users: number;
}

export const useConnectedUsers = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<ConnectedUsersStatus>({
    queryKey: ADMIN_CONNECTED_USERS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get("/admin/connected-users", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn,
    refetchInterval: 30 * 1000,
  });
};
