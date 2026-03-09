import ProgressBar from "./ProgressBar";
import { CheckCircle2, Sparkles } from "lucide-react";

interface StatsCardProps {
  title: string;
  current: number;
  total: number;
  isLoading: boolean;
  isError: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  current,
  total,
  isLoading,
  isError,
  isClickable = true,
  onClick,
}: StatsCardProps) => {
  const isComplete = current >= total && total > 0;

  return (
    <div
      className={`p-6 bg-card border rounded-xl shadow-md transition-all duration-300 relative overflow-hidden ${
        isComplete
          ? "border-green-500/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50"
          : "border-border"
      } ${
        isClickable && !isLoading && !isError
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
          : ""
      }`}
      onClick={isClickable && !isLoading && !isError ? onClick : undefined}
    >
      {isComplete && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 animate-in zoom-in duration-500" />
        </div>
      )}
      <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
        {title}
        {isComplete && (
          <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
        )}
      </h3>
      {isLoading ? (
        <p className="text-2xl font-bold">...</p>
      ) : isError ? (
        <p className="text-2xl font-bold text-destructive">N/A</p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                isComplete ? "text-green-600" : "text-primary"
              }`}
            >
              {current}
            </span>
            <span className="text-lg text-muted-foreground">/</span>
            <span className="text-lg font-semibold text-muted-foreground">
              {total}
            </span>
          </div>
          <ProgressBar current={current} total={total} />
          {isComplete && (
            <p className="text-sm font-medium text-green-600 mt-2">
              ✓ Requirement met!
            </p>
          )}
        </div>
      )}
      {isClickable && !isLoading && !isError && !isComplete && (
        <p className="text-xs text-muted-foreground mt-2">
          Click to view {title.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
