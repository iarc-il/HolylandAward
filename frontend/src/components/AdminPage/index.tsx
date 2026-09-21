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
import { getApiBaseUrl, apiClient } from "@/lib/api";
import { buildQsoReportCsv, downloadCsv } from "@/lib/csv";
import { getRequiredAmounts } from "@/lib/regionRequirements";
import {
  usePendingCallsignRequests,
  useApproveCallsignRequest,
  useDenyCallsignRequest,
} from "@/api/useCallsignRequests";
import { useAdminUserSearch } from "@/api/useAdminUserSearch";
import { useAdminUserQsos } from "@/api/useAdminUserQsos";
import type { UserQsosResponse } from "@/api/useUserQsos";
import { useAdminUsersList } from "@/api/useAdminUsersList";
import { useConnectedUsers } from "@/api/useConnectedUsers";
import { useAdminUserLimit, useUpdateUserLimit } from "@/api/useUserLimit";
import QsoTable from "@/components/QsoTable";
import QsoStatsCard from "@/components/QsoStatsCard";
import PaginationControls from "@/components/PaginationControls";
import { Activity, Shield, ShieldOff, Loader2, ArrowLeft, Search, Users, ChevronRight, Download } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

// Region 0 is Israel; the rest don't have more specific names in the app
// yet, so they just stay "Region N".
const REGION_NAMES: Record<number, string> = { 0: "Israel" };
const getRegionLabel = (region: number) => REGION_NAMES[region] ?? `Region ${region}`;

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

  const handleSetMaintenance = async (targetValue: boolean) => {
    setToggling(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getApiBaseUrl()}/admin/maintenance-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maintenance_mode: targetValue }),
      });
      if (res.ok) {
        // Admins always bypass the maintenance gate regardless of this
        // value, so there's no need to reload the whole page - just
        // reflect the new state directly.
        setMaintenanceMode(targetValue);
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Admin
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="flex flex-col gap-6">

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
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleSetMaintenance(true)}
              disabled={toggling}
              className={
                maintenanceMode
                  ? "bg-red-600 font-bold text-white hover:bg-red-700"
                  : "border-2 border-gray-300 bg-white font-bold text-gray-400 hover:bg-gray-50"
              }
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Maintenance Mode
            </Button>
            <Button
              onClick={() => handleSetMaintenance(false)}
              disabled={toggling}
              className={
                !maintenanceMode
                  ? "bg-green-600 font-bold text-white hover:bg-green-700"
                  : "border-2 border-gray-300 bg-white font-bold text-gray-400 hover:bg-gray-50"
              }
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}
              Site on the Air
            </Button>
          </div>
        )}
      </div>

      <UserLimitSection />

      </div>

      <div className="flex flex-col gap-6">

      <AllUsersSection />

      <UserLogsSection />

      </div>
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
                      {getRegionLabel(user.region)}
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
  const { getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserLabel, setSelectedUserLabel] = useState("");
  const [selectedUserRegion, setSelectedUserRegion] = useState<
    number | null
  >(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [exporting, setExporting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  // Browse-all list shown when the search box is empty, so admins don't
  // have to know/type anything to find a user.
  const { data: allUsersData, isLoading: allUsersLoading } =
    useAdminUsersList(1, 500); // 500 is the backend's own max page_size

  const isBrowsingAll = !debouncedQuery;
  const displayedUsers = isBrowsingAll
    ? (allUsersData?.users ?? [])
    : (searchData?.users ?? []);
  const displayedTotal = isBrowsingAll
    ? (allUsersData?.total ?? 0)
    : (searchData?.total ?? 0);
  const listLoading = isBrowsingAll ? allUsersLoading : searchLoading;

  const { data: qsosData, isLoading: qsosLoading } = useAdminUserQsos(
    selectedUserId,
    page,
    pageSize,
  );

  const handleSelectUser = (user: {
    clerk_user_id: string;
    callsign: string | null;
    email: string | null;
    region: number | null;
  }) => {
    setSelectedUserId(user.clerk_user_id);
    setSelectedUserLabel(user.callsign || user.email || user.clerk_user_id);
    setSelectedUserRegion(user.region);
    setPage(1);
    setPageSize(50);
    setSearchQuery("");
    setDebouncedQuery("");
    setIsDropdownOpen(false);
  };

  const handleBack = () => {
    setSelectedUserId(null);
    setSelectedUserLabel("");
    setSelectedUserRegion(null);
    setPage(1);
    setPageSize(50);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleExportCsv = async () => {
    if (!selectedUserId || !qsosData || qsosData.total_qsos === 0) return;
    setExporting(true);
    try {
      const token = await getToken();
      // Fetch every QSO in one request (not just the current page) so the
      // export always contains the user's full log.
      const response = await apiClient.get(
        `/admin/users/${selectedUserId}/qsos?page=1&page_size=${qsosData.total_qsos}`,
        { Authorization: `Bearer ${token}` },
      );
      const fullData: UserQsosResponse = await response.json();
      const required = getRequiredAmounts(selectedUserRegion);
      const csv = buildQsoReportCsv(
        fullData.callsign || selectedUserLabel,
        fullData.qsos,
        required.areas,
        required.regions,
      );
      const safeLabel = selectedUserLabel.replace(/[^a-z0-9]+/gi, "_");
      downloadCsv(csv, `${safeLabel}_qsos.csv`);
    } catch {
      toast.error("Failed to export QSOs");
    } finally {
      setExporting(false);
    }
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
          {!qsosLoading && qsosData && qsosData.total_qsos > 0 && (
            <Button
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting}
              className="bg-green-800 font-bold text-white hover:bg-green-900"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export CSV
            </Button>
          )}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          placeholder="Search users, or click to browse all..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            clearTimeout(blurTimeoutRef.current);
            setIsDropdownOpen(true);
          }}
          onBlur={() => {
            // Delay so a click on a dropdown item (which blurs the input
            // first) still registers before the dropdown disappears.
            blurTimeoutRef.current = setTimeout(
              () => setIsDropdownOpen(false),
              150,
            );
          }}
          className="pl-9"
        />

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
            {listLoading && (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isBrowsingAll ? "Loading users..." : "Searching..."}
              </div>
            )}

            {!listLoading && !isBrowsingAll && displayedTotal === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No users found matching "{debouncedQuery}".
              </p>
            )}

            {!listLoading && displayedTotal > 0 && (
              <div className="space-y-1">
                {isBrowsingAll && (
                  <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    All users{" "}
                    {allUsersData && allUsersData.total > displayedUsers.length
                      ? `(showing ${displayedUsers.length} of ${allUsersData.total} - type to search the rest)`
                      : ""}
                  </p>
                )}
                {displayedUsers.map((user) => (
                  <button
                    key={user.clerk_user_id}
                    type="button"
                    onMouseDown={(e) => {
                      // Fires before the input's onBlur, so selection
                      // registers before the dropdown closes.
                      e.preventDefault();
                      handleSelectUser(user);
                    }}
                    className="w-full cursor-pointer rounded-lg border border-transparent p-3 text-left transition-colors hover:border-primary hover:bg-accent/20"
                  >
                    <div className="flex items-center justify-between gap-3">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {user.region !== null && user.region !== undefined && (
                          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {getRegionLabel(user.region)}
                          </span>
                        )}
                        <span className="hidden sm:inline text-xs text-muted-foreground">
                          View QSO log
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
