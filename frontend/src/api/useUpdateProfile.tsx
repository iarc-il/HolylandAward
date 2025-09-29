import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

interface UpdateProfileRequest {
  callsign: string;
  region: string;
}

interface UpdateProfileResponse {
  id: number;
  clerk_user_id: string;
  email?: string;
  username?: string;
  callsign?: string;
  region?: number;
}

export const useUpdateProfile = () => {
  const { getToken } = useAuth();

  const updateProfile = async (
    data: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> => {
    const token = await getToken();

    console.log("token:", token);
    const response = await apiClient.patch(
      "/user/profile",
      {
        callsign: data.callsign,
        region: parseInt(data.region),
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    return response.json();
  };

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      console.log("Profile updated successfully:", data);
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
    },
  });
};
