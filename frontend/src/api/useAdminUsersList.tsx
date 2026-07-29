import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USERS_LIST_QUERY_KEY } from "@/api/queryKeys";
import type { AdminUserResult } from "@/api/useAdminUserSearch";
import { apiClient } from "@/lib/api";

export interface AdminUsersListResponse {
  users: AdminUserResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const useAdminUsersList = (page: number, pageSize: number) => {
  const { getToken } = useAuth();

  return useQuery<AdminUsersListResponse>({
    queryKey: [...ADMIN_USERS_LIST_QUERY_KEY, page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get(
        `/admin/users?page=${page}&page_size=${pageSize}`,
        {
          Authorization: `Bearer ${token}`,
        },
      );
      return response.json();
    },
    staleTime: 30 * 1000,
  });
};
