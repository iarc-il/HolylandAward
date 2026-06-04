import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { USER_QSOS_QUERY_KEY } from "@/api/queryKeys";
import type { Qso } from "@/components/QsoTable";
import { apiClient } from "@/lib/api";

export type UserQsosResponse = {
  callsign: string;
  callsigns: string[];
  total_qsos: number;
  qsos: Qso[];
};

export const useUserQsos = () => {
  const { getToken } = useAuth();

  return useQuery<UserQsosResponse>({
    queryKey: USER_QSOS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiClient.get("/qsos/by-user/logs", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};
