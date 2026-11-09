type Cell = string | number | null;

/**
 * Text starting with one of these is run as a formula by Excel and Sheets.
 * Such cells get a leading ' so they open as plain text (OWASP CSV injection).
 * Numbers are left alone, so negative amounts stay numeric.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (v: Cell) => {
  const text = typeof v === "string" && FORMULA_START.test(v) ? `'${v}` : String(v ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

/** [header] and [rows] as CSV text. Cells are quoted, so commas and quotes are safe; null is empty. */
export function toCsv(header: string[], rows: Cell[][]) {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

/** Downloads [rows] as a CSV file. */
export function downloadCsv(fileName: string, header: string[], rows: Cell[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(header, rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
