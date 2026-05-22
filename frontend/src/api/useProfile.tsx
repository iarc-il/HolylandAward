import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";
import { useState } from "react";

interface UserProfile {
  id: number;
  clerk_user_id: string;
  email?: string;
  username?: string;
  callsign?: string;
  region?: number;
}

interface UpdateProfileRequest {
  callsign: string;
  region: string;
}

interface CachedProfile {
  callsign?: string;
  region?: number | string;
}

const normalizeRegion = (region: unknown): number | undefined => {
  if (region === null || region === undefined || region === "") {
    return undefined;
  }

  const normalizedRegion = Number(region);
  return [0, 1, 2, 3].includes(normalizedRegion)
    ? normalizedRegion
    : undefined;
};

// Safe localStorage hook that doesn't break when userId is null
function useSafeLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined" || !key || key.includes("null")) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined" && key && !key.includes("null")) {
        if (value === null || value === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export const useProfile = () => {
  const { getToken, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();

  // Use localStorage with user-specific key to avoid conflicts between users
  const shouldUseCache = !!userId && userId !== "null";
  const cacheKey = shouldUseCache ? `profile_${userId}` : "";

  const [cachedProfile, setCachedProfile] =
    useSafeLocalStorage<CachedProfile | null>(cacheKey, null);
  const cachedRegion = normalizeRegion(cachedProfile?.region);

  // Check if cached profile is complete (region can be 0, so check for null/undefined explicitly)
  const isCacheComplete = !!(cachedProfile?.callsign && cachedRegion !== undefined);

  // Query for fetching profile
  const profileQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async (): Promise<UserProfile> => {
      const token = await getToken();
      const response = await apiClient.get("/user/profile", {
        Authorization: `Bearer ${token}`,
      });
      const profile = await response.json();
      const normalizedProfile = {
        ...profile,
        region: normalizeRegion(profile.region),
      };

      // Update localStorage cache when we get fresh data (only if we have a valid userId)
      if (shouldUseCache) {
        setCachedProfile({
          callsign: normalizedProfile.callsign,
          region: normalizedProfile.region,
        });
      }

      return normalizedProfile;
    },
    enabled: isSignedIn, // Always fetch so stale local profile cache cannot mask server data
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutation for updating profile
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest): Promise<UserProfile> => {
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
        },
      );

      const profile = await response.json();
      return {
        ...profile,
        region: normalizeRegion(profile.region),
      };
    },
    onSuccess: (data) => {
      console.log("Profile updated successfully:", data);

      // Update localStorage cache immediately (only if we have a valid userId)
      if (shouldUseCache) {
        setCachedProfile({
          callsign: data.callsign,
          region: data.region,
        });
      }

      // Update the query cache optimistically
      queryClient.setQueryData(["user", "profile"], data);

      // Optionally invalidate areas/regions data as well since callsign might have changed
      queryClient.invalidateQueries({ queryKey: ["user-areas-regions"] });
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
    },
  });

  // Use fresh API data when available; cached data is only an initial fallback.
  const cachedCombinedProfile = isCacheComplete
    ? ({
        id: 0,
        clerk_user_id: userId || "",
        callsign: cachedProfile.callsign,
        region: cachedRegion,
      } as UserProfile)
    : undefined;
  const combinedProfile = profileQuery.data ?? cachedCombinedProfile;

  return {
    // Profile query data and states (use combined profile)
    profile: combinedProfile,
    isLoading: !combinedProfile && profileQuery.isLoading,
    error: profileQuery.error,
    isError: profileQuery.isError,

    // Update mutation
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    isUpdateError: updateMutation.isError,

    // Combined loading state
    isAnyLoading: (!combinedProfile && profileQuery.isLoading) || updateMutation.isPending,

    // Refetch function
    refetch: profileQuery.refetch,

    // Profile completion helpers (use combined profile)
    hasCallsign: !!combinedProfile?.callsign,
    hasRegion:
      combinedProfile?.region !== undefined && combinedProfile?.region !== null,
    isProfileComplete: !!(
      combinedProfile?.callsign &&
      combinedProfile?.region !== undefined &&
      combinedProfile?.region !== null
    ),

    // Cache management
    hasCachedData: shouldUseCache && !!cachedProfile,
    clearCache: () => shouldUseCache && setCachedProfile(null),
  };
};
