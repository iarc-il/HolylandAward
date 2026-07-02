import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { USER_QSOS_QUERY_KEY } from "@/api/queryKeys";
import { getApiBaseUrl } from "@/lib/api";

export const useDeleteQsos = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${getApiBaseUrl()}/qsos/by-user/logs`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        const message = Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ")
          : detail || errorData.message;
        throw new Error(message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QSOS_QUERY_KEY });
    },
  });
};