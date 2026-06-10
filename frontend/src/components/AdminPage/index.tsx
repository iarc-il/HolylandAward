import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiBaseUrl } from "@/lib/api";
import {
  usePendingCallsignRequests,
  useApproveCallsignRequest,
  useDenyCallsignRequest,
} from "@/api/useCallsignRequests";
import { Shield, ShieldOff, Loader2 } from "lucide-react";

const AdminPage = () => {
  const { getToken } = useAuth();

  const { data: requests, isLoading, isError } = usePendingCallsignRequests();
  const approveMutation = useApproveCallsignRequest();
  const denyMutation = useDenyCallsignRequest();

  const [denyDialog, setDenyDialog] = useState<{
    open: boolean;
    requestId: number;
  }>({ open: false, requestId: 0 });
  const [denyReason, setDenyReason] = useState("");

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

  const handleApprove = async (requestId: number) => {
    try {
      await approveMutation.mutateAsync(requestId);
      toast.success("Request approved", {
        description: "The callsign change has been applied.",
      });
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const handleDeny = async () => {
    try {
      await denyMutation.mutateAsync({
        requestId: denyDialog.requestId,
        reason: denyReason || undefined,
      });
      toast.success("Request denied");
      setDenyDialog({ open: false, requestId: 0 });
      setDenyReason("");
    } catch {
      toast.error("Failed to deny request");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Admin
        </h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold">
            Pending Callsign Change Requests
            {requests && requests.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                {requests.length}
              </span>
            )}
          </h2>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load pending requests.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Request #{req.id}
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">User: </span>
                      <span className="font-medium">
                        {req.user_callsign ||
                          req.user_email ||
                          `User #${req.user_id}`}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-lg">
                      {req.old_callsign && (
                        <>
                          <span className="font-bold uppercase">
                            {req.old_callsign}
                          </span>
                          <span className="text-muted-foreground">&rarr;</span>
                        </>
                      )}
                      <span className="font-bold uppercase text-blue-600">
                        {req.new_callsign}
                      </span>
                    </div>
                    {req.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(req.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(req.id)}
                      disabled={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() =>
                        setDenyDialog({ open: true, requestId: req.id })
                      }
                      disabled={denyMutation.isPending}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pending requests.</p>
        )}
      </section>

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
                    <span className="font-semibold text-green-500">
                      INACTIVE
                    </span>
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

      <Dialog
        open={denyDialog.open}
        onOpenChange={(open) =>
          setDenyDialog(open ? denyDialog : { open: false, requestId: 0 })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Callsign Change Request</DialogTitle>
            <DialogDescription>
              Provide an optional reason for denying this request.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Reason (optional)"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDenyDialog({ open: false, requestId: 0 });
                setDenyReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny}>
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;