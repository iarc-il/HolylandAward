import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ADMIN_USER_LIMIT_QUERY_KEY,
  REGISTRATION_STATUS_QUERY_KEY,
} from "@/api/queryKeys";
import { apiClient } from "@/lib/api";

export interface UserLimitStatus {
  user_limit: number | null;
  current_users: number;
  limit_reached: boolean;
  remaining_slots: number | null;
}

export const useRegistrationStatus = () => {
  return useQuery<UserLimitStatus>({
    queryKey: REGISTRATION_STATUS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get("/registration-status");
      return response.json();
    },
    staleTime: 30 * 1000,
  });
};

export const useAdminUserLimit = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<UserLimitStatus>({
    queryKey: ADMIN_USER_LIMIT_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get("/admin/user-limit", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn,
  });
};

export const useUpdateUserLimit = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userLimit: number | null) => {
      const token = await getToken();
      const response = await apiClient.post(
        "/admin/user-limit",
        { user_limit: userLimit },
        { Authorization: `Bearer ${token}` },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_LIMIT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REGISTRATION_STATUS_QUERY_KEY });
    },
  });
};
