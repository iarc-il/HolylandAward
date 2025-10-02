import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "../lib/api";

interface UserAreasAndRegions {
  callsign: string;
  areas: string[];
  regions: string[];
  total_areas: number;
  total_regions: number;
}

export const useUserAreasAndRegions = () => {
  const { getToken } = useAuth();

  return useQuery<UserAreasAndRegions>({
    queryKey: ["user-areas-regions"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get("/qsos/by-user", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
