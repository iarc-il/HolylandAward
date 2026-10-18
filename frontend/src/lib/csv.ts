import type { Qso } from "@/components/QsoTable";

const escapeCsvValue = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const qsosToCsv = (qsos: Qso[]): string => {
  const headers = ["Date", "Frequency (MHz)", "Callsign", "DX Station", "Area"];
  const rows = qsos.map((qso) =>
    [qso.date, qso.freq.toFixed(3), qso.spotter, qso.dx, qso.area]
      .map((value) => escapeCsvValue(String(value)))
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
};

// A region is the last 2 characters of a square/area code (e.g. "AK" from
// "H03AK") - matches the backend's get_regions_from_areas logic exactly.
const countUniqueSquaresAndRegions = (qsos: Qso[]) => {
  const squares = new Set(qsos.map((q) => q.area).filter(Boolean));
  const regions = new Set(
    Array.from(squares)
      .filter((area) => area.length >= 2)
      .map((area) => area.slice(-2)),
  );
  return { squareCount: squares.size, regionCount: regions.size };
};

export const buildQsoReportCsv = (
  callsign: string,
  qsos: Qso[],
  requiredSquares: number,
  requiredRegions: number,
): string => {
  const { squareCount, regionCount } = countUniqueSquaresAndRegions(qsos);
  const dateCreated = new Date().toLocaleDateString("en-CA");

  const headerLines = [
    `User Callsign:,${escapeCsvValue(callsign)}`,
    // Leading apostrophe forces Excel to treat this as literal text instead
    // of auto-detecting it as a date value (which right-aligns and
    // reformats it) - same trick as typing '2026-09-15 directly into a cell.
    `Date created:,'${dateCreated}`,
    `No of Squares:,${squareCount} out of ${requiredSquares}`,
    `No. of regions:,${regionCount} out of ${requiredRegions}`,
    "", // blank row as the separation line
  ];

  return [...headerLines, qsosToCsv(qsos)].join("\n");
};

export const downloadCsv = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
