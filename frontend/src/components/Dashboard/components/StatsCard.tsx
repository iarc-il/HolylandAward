import ProgressBar from "./ProgressBar";

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
  return (
    <div
      className={`p-6 bg-card border border-border rounded-xl shadow-md transition-all duration-300 ${
        isClickable && !isLoading && !isError
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
          : ""
      }`}
      onClick={isClickable && !isLoading && !isError ? onClick : undefined}
    >
      <h3 className="font-semibold mb-3 text-lg">{title}</h3>
      {isLoading ? (
        <p className="text-2xl font-bold">...</p>
      ) : isError ? (
        <p className="text-2xl font-bold text-destructive">N/A</p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{current}</span>
            <span className="text-lg text-muted-foreground">/</span>
            <span className="text-lg font-semibold text-muted-foreground">
              {total}
            </span>
          </div>
          <ProgressBar current={current} total={total} />
        </div>
      )}
      {isClickable && !isLoading && !isError && (
        <p className="text-xs text-muted-foreground mt-2">
          Click to view {title.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
