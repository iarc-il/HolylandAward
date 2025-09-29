import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

const useAreas = (callSign: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["areas"],
    queryFn: async (): Promise<{ areas: string[] }> => {
      const token = await getToken();
      const response = await apiClient.get(`/areas/${callSign}`, {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
  });
};

export default useAreas;
