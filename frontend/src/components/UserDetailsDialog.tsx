import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Zod validation schema
const userDetailsSchema = z
  .object({
    callsign: z
      .string()
      .min(1, "Callsign is required")
      .max(10, "Callsign too long")
      .regex(/^[A-Z0-9]+$/, "Callsign must contain only letters and numbers"),
    callsignConfirm: z.string().min(1, "Please confirm your callsign"),
    region: z.enum(["0", "1", "2", "3"], { message: "Please select a region" }),
  })
  .refine((data) => data.callsign === data.callsignConfirm, {
    message: "Callsigns don't match",
    path: ["callsignConfirm"],
  });

type UserDetailsFormData = z.infer<typeof userDetailsSchema>;

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UserDetailsDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: UserDetailsDialogProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
  });

  const { updateProfileAsync, isUpdating } = useProfile();

  const onFormSubmit = async (data: UserDetailsFormData) => {
    try {
      await updateProfileAsync({
        callsign: data.callsign,
        region: data.region,
      });

      // Success! Close dialog and call success callback
      onClose();
      onSuccess?.();
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please fill in your amateur radio details to get started with the
            HolyLand Award system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Callsign Fields */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Callsign</label>
              <div className="col-span-3">
                <Input
                  {...register("callsign")}
                  placeholder="4Z1ABC"
                  className="uppercase"
                  maxLength={10}
                />
                {errors.callsign && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.callsign.message}
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Callsign */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Confirm Callsign</label>
              <div className="col-span-3">
                <Input
                  {...register("callsignConfirm")}
                  placeholder="4Z1ABC"
                  className="uppercase"
                  maxLength={10}
                />
                {errors.callsignConfirm && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.callsignConfirm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Region Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Region</label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    setValue("region", value as "0" | "1" | "2" | "3")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Israel</SelectItem>
                    <SelectItem value="1">Region 1</SelectItem>
                    <SelectItem value="2">Region 2</SelectItem>
                    <SelectItem value="3">Region 3</SelectItem>
                  </SelectContent>
                </Select>
                {errors.region && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.region.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
