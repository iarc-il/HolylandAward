import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { apiClient } from "@/lib/api";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export const usePresenceHeartbeat = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    const sendHeartbeat = async () => {
      const token = await getToken();
      if (!token || cancelled) {
        return;
      }

      try {
        await apiClient.post("/presence/heartbeat", undefined, {
          Authorization: `Bearer ${token}`,
        });
      } catch {
        return;
      }
    };

    void sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [getToken, isSignedIn]);
};
