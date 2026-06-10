export type Qso = {
  id?: number;
  date: string;
  freq: number;
  spotter: string;
  dx: string;
  area: string;
};

type QsoTableProps = {
  title: string;
  qsos: Qso[];
  emptyMessage?: string;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const cleaned = dateStr.replace(/[^0-9]/g, "");
  if (cleaned.length === 8) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-CA");
  }
  return dateStr;
};

const QsoTable = ({
  title,
  qsos,
  emptyMessage = "No QSOs found",
}: QsoTableProps) => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md">
      <div className="px-6 py-4 bg-secondary border-b border-border">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Frequency
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Callsign
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                DX Station
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Area
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {qsos.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              qsos.map((qso, index) => (
                <tr
                  key={qso.id || index}
                  className="hover:bg-accent/10 transition-colors"
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(qso.date)}</td>
                  <td className="px-4 py-3 text-sm">
                    {qso.freq.toFixed(3)} MHz
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {qso.spotter}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{qso.dx}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                      {qso.area}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QsoTable;
