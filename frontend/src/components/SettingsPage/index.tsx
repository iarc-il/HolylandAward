import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from "@/api/useProfile";
import {
  useMyCallsignRequests,
  useCreateCallsignRequest,
  useUpdateRegion,
} from "@/api/useCallsignRequests";

const regionOptions = [
  { value: "0", label: "Israel" },
  { value: "1", label: "Region 1" },
  { value: "2", label: "Region 2" },
  { value: "3", label: "Region 3" },
] as const;

const profileSettingsSchema = z.object({
  callsign: z
    .string()
    .trim()
    .min(1, "Callsign is required")
    .max(10, "Callsign too long")
    .transform((value) => value.toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^[A-Z0-9]+$/, "Callsign must contain only letters and numbers"),
    )
    .pipe(
      z
        .string()
        .regex(
          /^(?=.*[A-Z])(?=.*\d).+$/,
          "Callsign must contain both letters and numbers",
        ),
    ),
  region: z.enum(["0", "1", "2", "3"], { message: "Please select a region" }),
});

type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
type RegionValue = ProfileSettingsFormData["region"];

const getRegionFormValue = (
  region?: number | string | null,
): RegionValue | undefined => {
  if (region === null || region === undefined || region === "") {
    return undefined;
  }

  return regionOptions.find((option) => option.value === String(region))?.value;
};

const SettingsPage = () => {
  const {
    profile,
    isLoading,
    isError,
    error,
  } = useProfile();

  const { data: myRequests } = useMyCallsignRequests();
  const createRequest = useCreateCallsignRequest();
  const updateRegion = useUpdateRegion();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<ProfileSettingsFormData | null>(null);

  const pendingRequest = myRequests?.find(
    (r) => r.status === "pending",
  );

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      callsign: "",
      region: undefined,
    },
  });

  const currentCallsign = watch("callsign");
  const linkedCallsigns = profile?.linked_callsigns ?? [];

  useEffect(() => {
    reset({
      callsign: profile?.callsign ?? "",
      region: getRegionFormValue(profile?.region),
    });
  }, [profile?.callsign, profile?.region, reset]);

  const onSubmit = async (data: ProfileSettingsFormData) => {
    const callsignChanged =
      data.callsign !== (profile?.callsign ?? "");
    const regionChanged =
      data.region !== getRegionFormValue(profile?.region);

    if (!callsignChanged && !regionChanged) return;

    if (callsignChanged) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
    } else {
      try {
        await updateRegion.mutateAsync(data.region);
        reset({
          callsign: profile?.callsign ?? "",
          region: data.region,
        });
        toast.success("Region updated", {
          description: "Your region has been saved.",
        });
      } catch (submitError) {
        toast.error("Could not update region", {
          description:
            submitError instanceof Error
              ? submitError.message
              : "Please try again.",
        });
      }
    }
  };

  const confirmCallsignChange = async () => {
    if (!pendingFormData) return;
    setShowConfirmDialog(false);

    try {
      await createRequest.mutateAsync(pendingFormData.callsign);

      reset({
        callsign: profile?.callsign ?? "",
        region: getRegionFormValue(profile?.region),
      });

      toast.success("Request submitted", {
        description:
          "Your callsign change request has been sent to the admins for review.",
      });
    } catch (submitError) {
      toast.error("Could not submit request", {
        description:
          submitError instanceof Error
            ? submitError.message
            : "Please try again.",
      });
    }
  };

  const statusBadge = () => {
    if (!pendingRequest) return null;
    return (
      <div className="rounded-lg border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Pending Callsign Change Request</p>
        <p className="mt-1">
          Changing from <strong>{pendingRequest.old_callsign}</strong> to{" "}
          <strong>{pendingRequest.new_callsign}</strong> &mdash; awaiting admin
          approval.
        </p>
      </div>
    );
  };

  const recentRequests = myRequests?.filter((r) => r.status !== "pending") ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-base">
          Edit your HolyLand Award profile details.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-md">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold">Your Profile</h2>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Could not load your profile."}
          </div>
        )}

        {statusBadge()}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="callsign" className="text-sm font-medium">
              Callsign
            </label>
            <Input
              id="callsign"
              {...register("callsign")}
              className="uppercase"
              disabled={isLoading || createRequest.isPending || !!pendingRequest}
              maxLength={10}
              placeholder="4Z1ABC"
            />
            {errors.callsign && (
              <p className="text-sm text-destructive">
                {errors.callsign.message}
              </p>
            )}
            {pendingRequest && (
              <p className="text-xs text-muted-foreground">
                Callsign changes are disabled while a request is pending.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="region" className="text-sm font-medium">
              Region
            </label>
            <Controller
              control={control}
              name="region"
              render={({ field }) => (
                <Select
                  key={field.value ?? "empty-region"}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading || updateRegion.isPending}
                >
                  <SelectTrigger id="region" className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.region && (
              <p className="text-sm text-destructive">
                {errors.region.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                reset({
                  callsign: profile?.callsign ?? "",
                  region: getRegionFormValue(profile?.region),
                })
              }
              disabled={isLoading || !isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                createRequest.isPending ||
                updateRegion.isPending ||
                !isDirty ||
                !!pendingRequest
              }
            >
              {createRequest.isPending || updateRegion.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </form>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="text-lg font-semibold">Linked Callsigns</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Previous callsigns remain linked and are included in award progress.
          </p>

          {linkedCallsigns.length > 0 ? (
            <div className="mt-4 space-y-2">
              {linkedCallsigns.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="font-medium uppercase">
                    {link.old_callsign}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-medium uppercase">
                    {link.new_callsign}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No previous callsigns are linked yet.
            </p>
          )}
        </div>

        {recentRequests.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="text-lg font-semibold">Previous Requests</h3>
            <div className="mt-4 space-y-2">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {req.old_callsign && (
                      <>
                        <span className="font-medium uppercase">
                          {req.old_callsign}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                      </>
                    )}
                    <span className="font-medium uppercase">
                      {req.new_callsign}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      req.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {req.status === "approved" ? "Approved" : "Denied"}
                    {req.reason ? `: ${req.reason}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Callsign Change</DialogTitle>
            <DialogDescription>
              Your callsign change request will be sent to the admins for review.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-center gap-3 text-lg">
              {profile?.callsign && (
                <>
                  <span className="font-bold uppercase">{profile.callsign}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                </>
              )}
              <span className="font-bold uppercase">
                {pendingFormData?.callsign}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmCallsignChange}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
