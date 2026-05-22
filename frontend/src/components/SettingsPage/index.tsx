import { useEffect } from "react";
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
import { useProfile } from "@/api/useProfile";

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
    updateProfileAsync,
    isUpdating,
  } = useProfile();

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      callsign: "",
      region: undefined,
    },
  });

  useEffect(() => {
    reset({
      callsign: profile?.callsign ?? "",
      region: getRegionFormValue(profile?.region),
    });
  }, [profile?.callsign, profile?.region, reset]);

  const onSubmit = async (data: ProfileSettingsFormData) => {
    try {
      const updatedProfile = await updateProfileAsync(data);

      reset({
        callsign: updatedProfile.callsign ?? "",
        region: getRegionFormValue(updatedProfile.region),
      });

      toast.success("Profile updated", {
        description: "Your callsign and region have been saved.",
      });
    } catch (submitError) {
      toast.error("Could not update profile", {
        description:
          submitError instanceof Error ? submitError.message : "Please try again.",
      });
    }
  };

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="callsign" className="text-sm font-medium">
              Callsign
            </label>
            <Input
              id="callsign"
              {...register("callsign")}
              className="uppercase"
              disabled={isLoading || isUpdating}
              maxLength={10}
              placeholder="4Z1ABC"
            />
            {errors.callsign && (
              <p className="text-sm text-destructive">
                {errors.callsign.message}
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
                  disabled={isLoading || isUpdating}
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
              <p className="text-sm text-destructive">{errors.region.message}</p>
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
              disabled={isLoading || isUpdating || !isDirty}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading || isUpdating || !isDirty}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;
