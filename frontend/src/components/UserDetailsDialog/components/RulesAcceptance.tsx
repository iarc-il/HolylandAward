import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface RulesAcceptanceProps {
  register: UseFormRegister<any>;
  onCheckedChange: (checked: boolean) => void;
  onShowRules: () => void;
  errors: FieldErrors;
}

const RulesAcceptance: React.FC<RulesAcceptanceProps> = ({
  register,
  onCheckedChange,
  onShowRules,
  errors,
}) => {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="acceptedRules"
          {...register("acceptedRules")}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
        />
        <div className="flex-1">
          <label
            htmlFor="acceptedRules"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I have read and accept the{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onShowRules();
              }}
              className="text-primary underline hover:text-primary/80"
            >
              HolyLand Award rules and guidelines
            </button>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            You must accept the rules and guidelines before you can upload any
            logs.
          </p>
          {errors.acceptedRules && (
            <p className="text-sm text-red-500 mt-1">
              {errors.acceptedRules?.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RulesAcceptance;
