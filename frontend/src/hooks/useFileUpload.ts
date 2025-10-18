import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

type QSO = {
  id?: number;
  date: string;
  freq: number;
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

  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      return postAdif(file, token);
    },
  });
};

export default useAdifUpload;
