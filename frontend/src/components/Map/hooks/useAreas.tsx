import { useQuery } from "@tanstack/react-query";

const useAreas = (callSign: string) => {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async (): Promise<{ areas: string[] }> => {
      const response = await fetch(`http://localhost:1293/areas/${callSign}`);
      return response.json();
    },
  });
};

export default useAreas;
