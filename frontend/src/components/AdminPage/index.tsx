import { useState, useEffect, useRef, type FormEvent } from "react";
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
import { useAdminUserSearch } from "@/api/useAdminUserSearch";
import { useAdminUserQsos } from "@/api/useAdminUserQsos";
import { useAdminUsersList } from "@/api/useAdminUsersList";
import { useConnectedUsers } from "@/api/useConnectedUsers";
import { useAdminUserLimit, useUpdateUserLimit } from "@/api/useUserLimit";
import QsoTable from "@/components/QsoTable";
import QsoStatsCard from "@/components/QsoStatsCard";
import PaginationControls from "@/components/PaginationControls";
import { Activity, Shield, ShieldOff, Loader2, ArrowLeft, Search, Users } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Admin
        </h1>
      </div>

      <ConnectedUsersSection />

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

      <UserLimitSection />

      <AllUsersSection />

      <UserLogsSection />

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

const ConnectedUsersSection = () => {
  const { data, isLoading, isError } = useConnectedUsers();

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Connected Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Users seen in the last 90 seconds.
          </p>
        </div>
        <Activity className="h-5 w-5 text-green-600" />
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading connected users...
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load connected users.
        </div>
      ) : (
        <p className="mt-4 text-3xl font-bold">{data?.connected_users ?? 0}</p>
      )}
    </section>
  );
};

const UserLimitSection = () => {
  const { data, isLoading, isError } = useAdminUserLimit();
  const updateMutation = useUpdateUserLimit();
  const [limitInput, setLimitInput] = useState("");

  useEffect(() => {
    if (data) {
      setLimitInput(data.user_limit?.toString() ?? "");
    }
  }, [data]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedLimit = limitInput.trim();
    const nextLimit = trimmedLimit === "" ? null : Number(trimmedLimit);
    if (
      nextLimit !== null &&
      (!Number.isInteger(nextLimit) || nextLimit < 0)
    ) {
      toast.error("User limit must be a whole number greater than or equal to 0");
      return;
    }

    try {
      await updateMutation.mutateAsync(nextLimit);
      toast.success(
        nextLimit === null ? "User limit cleared" : "User limit updated",
      );
    } catch (error) {
      toast.error("Failed to update user limit", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">User Limit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Limit new non-admin accounts. Admins are excluded from this count.
          </p>
        </div>
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading user limit...
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load user limit.
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total non-admin Users
              </p>
              <p className="mt-1 text-2xl font-bold">{data.current_users}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Limit
              </p>
              <p className="mt-1 text-2xl font-bold">
                {data.user_limit === null ? "Unlimited" : data.user_limit}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  data.limit_reached ? "text-amber-600" : "text-green-600"
                }`}
              >
                {data.user_limit === null
                  ? "Open"
                  : data.limit_reached
                    ? "Limit reached"
                    : `${data.remaining_slots} slots available`}
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Leave blank for unlimited"
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Limit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLimitInput("")}
                disabled={updateMutation.isPending}
              >
                Clear
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
};

const AllUsersSection = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const isSearching = debouncedQuery.length > 0;

  const { data: listData, isLoading: listLoading, isError: listError } =
    useAdminUsersList(page, pageSize);
  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
  } = useAdminUserSearch(debouncedQuery);

  const users = isSearching ? searchData?.users : listData?.users;
  const total = isSearching ? searchData?.total : listData?.total;
  const isLoading = isSearching ? searchLoading : listLoading;
  const isError = isSearching ? searchError : listError;

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Registered Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All users registered in the system.
          </p>
        </div>
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by callsign, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isSearching ? "Searching..." : "Loading users..."}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load users.
        </div>
      ) : isSearching && total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No users found matching "{debouncedQuery}".
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {users?.map((user) => (
              <div
                key={user.clerk_user_id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    {user.callsign && (
                      <p className="font-semibold uppercase">
                        {user.callsign}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {user.email || user.username || user.clerk_user_id}
                    </p>
                  </div>
                  {user.region !== null && user.region !== undefined && (
                    <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      Region {user.region}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isSearching && listData && listData.total > 0 && (
            <PaginationControls
              page={listData.page}
              totalPages={listData.total_pages}
              totalItems={listData.total}
              pageSize={listData.page_size}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="users"
            />
          )}
        </div>
      )}
    </section>
  );
};

const UserLogsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserLabel, setSelectedUserLabel] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const { data: searchData, isLoading: searchLoading } =
    useAdminUserSearch(debouncedQuery);

  const { data: qsosData, isLoading: qsosLoading } = useAdminUserQsos(
    selectedUserId,
    page,
    pageSize,
  );

  const handleSelectUser = (user: {
    clerk_user_id: string;
    callsign: string | null;
    email: string | null;
  }) => {
    setSelectedUserId(user.clerk_user_id);
    setSelectedUserLabel(user.callsign || user.email || user.clerk_user_id);
    setPage(1);
    setPageSize(50);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleBack = () => {
    setSelectedUserId(null);
    setSelectedUserLabel("");
    setPage(1);
    setPageSize(50);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  if (selectedUserId) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold">User QSO Logs</h2>
              <p className="text-sm text-muted-foreground">
                {selectedUserLabel}
              </p>
            </div>
          </div>
        </div>

        {qsosLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading QSOs...
          </div>
        ) : (
          <div className="space-y-4">
            <QsoStatsCard
              totalQsos={qsosData?.total_qsos ?? 0}
              callsigns={qsosData?.callsigns ?? []}
            />

            <QsoTable
              title={`QSOs for ${selectedUserLabel}`}
              qsos={qsosData?.qsos ?? []}
              emptyMessage="No QSOs found for this user."
            />

            {qsosData && qsosData.total_qsos > 0 && (
              <PaginationControls
                page={qsosData.page}
                totalPages={qsosData.total_pages}
                totalItems={qsosData.total_qsos}
                pageSize={qsosData.page_size}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">User Logs</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Search for a user by callsign, email, or username to view their QSO
        logs.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {searchLoading && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {!searchLoading && debouncedQuery && searchData?.total === 0 && (
        <p className="py-4 text-sm text-muted-foreground">
          No users found matching "{debouncedQuery}".
        </p>
      )}

      {!searchLoading && searchData && searchData.total > 0 && (
        <div className="space-y-2">
          {searchData.users.map((user) => (
            <button
              key={user.clerk_user_id}
              type="button"
              onClick={() => handleSelectUser(user)}
              className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-accent/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  {user.callsign && (
                    <p className="font-semibold uppercase">{user.callsign}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {user.email || user.username || user.clerk_user_id}
                  </p>
                </div>
                {user.region !== null && user.region !== undefined && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    Region {user.region}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminPage;
