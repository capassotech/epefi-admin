type ExportRow = Record<string, string | number | boolean>;

function escapeCsvCell(value: string | number | boolean): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: ExportRow[], keys: string[]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const body = rows.map((row) =>
    keys.map((k) => escapeCsvCell(row[k] ?? "")).join(",")
  );
  return [headerLine, ...body].join("\r\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvExport(
  filename: string,
  headers: string[],
  rows: ExportRow[],
  keys: string[]
) {
  const BOM = "\uFEFF";
  const csv = BOM + rowsToCsv(headers, rows, keys);
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
}

/** Excel abre bien tablas HTML exportadas con este MIME. */
export function downloadExcelExport(
  filename: string,
  headers: string[],
  rows: ExportRow[],
  keys: string[]
) {
  const th = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = rows
    .map(
      (row) =>
        `<tr>${keys.map((k) => `<td>${escapeHtml(String(row[k] ?? ""))}</td>`).join("")}</tr>`
    )
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></body></html>`;
  downloadBlob(
    new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    filename.endsWith(".xls") ? filename : `${filename}.xls`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
