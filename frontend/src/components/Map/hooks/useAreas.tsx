import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

const useAreas = (callSign: string) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["areas"],
    queryFn: async (): Promise<{ areas: string[] }> => {
      const token = await getToken();
      const response = await fetch(`http://localhost:1293/areas/${callSign}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    },
  });
};

export default useAreas;
