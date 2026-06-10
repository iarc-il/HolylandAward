import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

const AdminPage = () => {
  const { getToken } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/maintenance-mode`)
      .then((res) => res.json())
      .then((data) => {
        setMaintenanceMode(data.maintenance_mode);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBaseUrl()}/admin/maintenance-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maintenance_mode: !maintenanceMode }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Admin
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking status…
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {maintenanceMode ? (
                <Shield className="h-5 w-5 text-amber-500" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">
                {maintenanceMode ? (
                  <>
                    Maintenance mode is{" "}
                    <span className="font-semibold text-amber-500">ACTIVE</span>
                    . Non-admin users cannot access the site.
                  </>
                ) : (
                  <>
                    Maintenance mode is{" "}
                    <span className="font-semibold text-green-500">INACTIVE</span>
                    .
                  </>
                )}
              </span>
            </div>
            <Button
              variant={maintenanceMode ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {maintenanceMode ? "Disable" : "Enable"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;