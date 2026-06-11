import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USER_SEARCH_QUERY_KEY } from "@/api/queryKeys";
import { apiClient } from "@/lib/api";

export interface AdminUserResult {
  id: number;
  clerk_user_id: string;
  email: string | null;
  username: string | null;
  callsign: string | null;
  region: number | null;
}

export interface AdminUserSearchResponse {
  users: AdminUserResult[];
  total: number;
}

export const useAdminUserSearch = (q: string) => {
  const { getToken } = useAuth();

  return useQuery<AdminUserSearchResponse>({
    queryKey: [...ADMIN_USER_SEARCH_QUERY_KEY, q],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get(
        `/admin/users/search?q=${encodeURIComponent(q)}`,
        {
          Authorization: `Bearer ${token}`,
        },
      );
      return response.json();
    },
    enabled: q.length >= 1,
    staleTime: 30 * 1000,
  });
};