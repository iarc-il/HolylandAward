import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

export interface CallsignChangeRequest {
  id: number;
  user_id: number;
  old_callsign?: string | null;
  new_callsign: string;
  status: string;
  reason?: string | null;
  created_at?: string;
  updated_at?: string;
  user_callsign?: string | null;
  user_email?: string | null;
}

export const useMyCallsignRequests = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["user", "callsign-requests"],
    queryFn: async (): Promise<CallsignChangeRequest[]> => {
      const token = await getToken();
      const response = await apiClient.get("/user/callsign-requests", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn,
  });
};

export const usePendingCallsignRequests = () => {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["admin", "callsign-requests"],
    queryFn: async (): Promise<CallsignChangeRequest[]> => {
      const token = await getToken();
      const response = await apiClient.get("/admin/callsign-requests", {
        Authorization: `Bearer ${token}`,
      });
      return response.json();
    },
    enabled: isSignedIn,
  });
};

export const useCreateCallsignRequest = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callsign: string) => {
      const token = await getToken();
      const response = await apiClient.post(
        "/user/callsign-request",
        { callsign },
        { Authorization: `Bearer ${token}` },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "callsign-requests"] });
    },
  });
};

export const useApproveCallsignRequest = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const token = await getToken();
      const response = await apiClient.patch(
        `/admin/callsign-requests/${requestId}/approve`,
        {},
        { Authorization: `Bearer ${token}` },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "callsign-requests"] });
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-areas-regions"] });
    },
  });
};

export const useDenyCallsignRequest = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: number;
      reason?: string;
    }) => {
      const token = await getToken();
      const response = await apiClient.patch(
        `/admin/callsign-requests/${requestId}/deny`,
        { reason },
        { Authorization: `Bearer ${token}` },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "callsign-requests"] });
    },
  });
};

export const useUpdateRegion = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (region: string) => {
      const token = await getToken();
      const response = await apiClient.patch(
        "/user/region",
        { region: parseInt(region) },
        { Authorization: `Bearer ${token}` },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
};