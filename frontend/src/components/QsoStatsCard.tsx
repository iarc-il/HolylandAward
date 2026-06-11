type QsoStatsCardProps = {
  totalQsos: number;
  callsigns: string[];
};

const QsoStatsCard = ({ totalQsos, callsigns }: QsoStatsCardProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Total QSOs
          </p>
          <p className="text-3xl font-bold text-primary">{totalQsos}</p>
        </div>
        {callsigns.length > 0 && (
          <div className="sm:text-right">
            <p className="text-sm font-medium text-muted-foreground">
              Counting callsigns
            </p>
            <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
              {callsigns.map((callsign) => (
                <span
                  key={callsign}
                  className="rounded-full border border-border bg-muted px-2 py-1 text-xs font-semibold text-foreground"
                >
                  {callsign}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QsoStatsCard;