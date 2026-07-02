import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USER_QSOS_QUERY_KEY } from "@/api/queryKeys";
import type { UserQsosResponse } from "@/api/useUserQsos";
import { apiClient } from "@/lib/api";

export const useAdminUserQsos = (
  clerkUserId: string | null,
  page: number,
  pageSize: number,
) => {
  const { getToken } = useAuth();

  return useQuery<UserQsosResponse>({
    queryKey: [...ADMIN_USER_QSOS_QUERY_KEY, clerkUserId, page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get(
        `/admin/users/${clerkUserId}/qsos?page=${page}&page_size=${pageSize}`,
        {
          Authorization: `Bearer ${token}`,
        },
      );
      return response.json();
    },
    enabled: !!clerkUserId,
    staleTime: 5 * 60 * 1000,
  });
};