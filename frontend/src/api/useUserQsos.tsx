import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { USER_QSOS_QUERY_KEY } from "@/api/queryKeys";
import type { Qso } from "@/components/QsoTable";
import { apiClient } from "@/lib/api";

export type UserQsosResponse = {
  callsign: string;
  callsigns: string[];
  total_qsos: number;
  page: number;
  page_size: number;
  total_pages: number;
  qsos: Qso[];
};

export const useUserQsos = (page: number, pageSize: number) => {
  const { getToken } = useAuth();

  return useQuery<UserQsosResponse>({
    queryKey: [...USER_QSOS_QUERY_KEY, page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get(
        `/qsos/by-user/logs?page=${page}&page_size=${pageSize}`,
        {
          Authorization: `Bearer ${token}`,
        },
      );
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};
