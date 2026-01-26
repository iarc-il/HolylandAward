import { useState } from "react";
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
import { useProfile } from "@/api/useProfile";
import RulesAndGuidlines from "./components/RulesAndGuidlines";
import CallsignField from "./components/CallsignField";
import RegionSelect from "./components/RegionSelect";
import RulesAcceptance from "./components/RulesAcceptance";

// Zod validation schema
const userDetailsSchema = z
  .object({
    callsign: z
      .string()
      .min(1, "Callsign is required")
      .max(10, "Callsign too long")
      .transform((val) => val.toUpperCase())
      .pipe(
        z
          .string()
          .regex(
            /^[A-Z0-9]+$/,
            "Callsign must contain only letters and numbers",
          ),
      ),
    callsignConfirm: z
      .string()
      .min(1, "Please confirm your callsign")
      .transform((val) => val.toUpperCase()),
    region: z.enum(["0", "1", "2", "3"], { message: "Please select a region" }),
    acceptedRules: z.boolean().refine((val) => val === true, {
      message: "You must read and accept the award rules and guidelines",
    }),
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
    watch,
    formState: { errors },
  } = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
  });

  const acceptedRules = watch("acceptedRules");

  const { updateProfileAsync, isUpdating } = useProfile();
  const [showRulesModal, setShowRulesModal] = useState(false);

  const onFormSubmit = async (data: UserDetailsFormData) => {
    try {
      await updateProfileAsync({
        callsign: data.callsign,
        region: data.region,
      });

      // Success! Let the success callback handle closing
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback if no success handler provided
        onClose();
      }
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
            <CallsignField
              label="Callsign"
              name="callsign"
              register={register}
              errors={errors}
            />

            {/* Confirm Callsign */}
            <CallsignField
              label="Confirm Callsign"
              name="callsignConfirm"
              register={register}
              errors={errors}
            />

            {/* Region Select */}
            <RegionSelect
              onValueChange={(value) => setValue("region", value)}
              errors={errors}
            />

            {/* Rules and Guidelines Acceptance */}
            <RulesAcceptance
              register={register}
              onCheckedChange={(checked) => setValue("acceptedRules", checked)}
              onShowRules={() => setShowRulesModal(true)}
              errors={errors}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !acceptedRules}>
              {isUpdating ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Rules and Guidelines Modal */}
      <RulesAndGuidlines
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </Dialog>
  );
};

export default UserDetailsDialog;
