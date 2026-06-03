import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  USER_AREAS_REGIONS_QUERY_KEY,
  USER_QSOS_QUERY_KEY,
} from "@/api/queryKeys";
import { apiClient } from "@/lib/api";

type QSO = {
  id?: number;
  date: string;
  freq: number;
  spotter: string;
  dx: string;
  area: string;
};

type UploadResponse = {
  total_qsos: number;
  callsign: string;
  qsos: QSO[];
};

const postAdif = async (file: File, token: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file); // field name must be "file" to match UploadFile=File(...)

  const res = await apiClient.upload("/read-file", formData, {
    Authorization: `Bearer ${token}`,
  });
  return res.json();
};

const useAdifUpload = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      return postAdif(file, token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USER_AREAS_REGIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: USER_QSOS_QUERY_KEY });
    },
  });
};

export default useAdifUpload;
