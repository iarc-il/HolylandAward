interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressBar = ({ current, total, className = "" }: ProgressBarProps) => {
  const percentage = Math.min((current / total) * 100, 100);
  const isComplete = current >= total && total > 0;

  return (
    <div className={`w-full bg-secondary rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${
          isComplete
            ? "bg-gradient-to-r from-green-500 to-emerald-500"
            : "bg-primary"
        }`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
