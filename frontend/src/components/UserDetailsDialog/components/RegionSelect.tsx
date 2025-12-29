import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldErrors } from "react-hook-form";

interface RegionSelectProps {
  onValueChange: (value: "0" | "1" | "2" | "3") => void;
  errors: FieldErrors;
}

const RegionSelect: React.FC<RegionSelectProps> = ({
  onValueChange,
  errors,
}) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label className="text-right font-medium">Region</label>
      <div className="col-span-3">
        <Select
          onValueChange={(value) =>
            onValueChange(value as "0" | "1" | "2" | "3")
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
            {errors.region?.message as string}
          </p>
        )}
      </div>
    </div>
  );
};

export default RegionSelect;
