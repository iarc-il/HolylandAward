import React from "react";
import { Input } from "@/components/ui/input";
import { UseFormRegister, FieldErrors } from "react-hook-form";

interface CallsignFieldProps {
  label: string;
  name: "callsign" | "callsignConfirm";
  register: UseFormRegister<any>;
  errors: FieldErrors;
  placeholder?: string;
}

const CallsignField: React.FC<CallsignFieldProps> = ({
  label,
  name,
  register,
  errors,
  placeholder = "4Z1ABC",
}) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label className="text-right font-medium">{label}</label>
      <div className="col-span-3">
        <Input
          {...register(name)}
          placeholder={placeholder}
          className="uppercase"
          maxLength={10}
        />
        {errors[name] && (
          <p className="text-sm text-red-500 mt-1">
            {errors[name]?.message as string}
          </p>
        )}
      </div>
    </div>
  );
};

export default CallsignField;
