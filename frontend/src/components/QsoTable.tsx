import { Checkbox } from "@/components/ui/checkbox";

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
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
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
  selectedIds,
  onSelectionChange,
}: QsoTableProps) => {
  const isSelectable = Boolean(onSelectionChange);
  const allSelected = isSelectable && qsos.length > 0 && qsos.every((q) => q.id !== undefined && selectedIds!.has(q.id));
  const someSelected = isSelectable && !allSelected && qsos.some((q) => q.id !== undefined && selectedIds!.has(q.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const newSet = new Set(selectedIds);
      for (const q of qsos) {
        if (q.id !== undefined) {
          newSet.add(q.id);
        }
      }
      onSelectionChange(newSet);
    }
  };

  const toggleOne = (id: number) => {
    if (!onSelectionChange) return;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md">
      <div className="px-6 py-4 bg-secondary border-b border-border">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              {isSelectable && (
                <th className="px-4 py-3 w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
              )}
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
                  colSpan={isSelectable ? 6 : 5}
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
                  {isSelectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={qso.id !== undefined && selectedIds!.has(qso.id)}
                        onCheckedChange={() => qso.id !== undefined && toggleOne(qso.id)}
                        aria-label={`Select QSO ${qso.id ?? index}`}
                      />
                    </td>
                  )}
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
