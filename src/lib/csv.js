function csvCell(value) {
  const str = value == null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Builds a CSV from an array of objects and triggers a browser download.
// `columns` maps CSV header -> either a key on each row or a (row) => value fn.
export function downloadCsv(filename, rows, columns) {
  const header = columns.map(([label]) => csvCell(label)).join(",");
  const body = rows
    .map((row) => columns.map(([, get]) => csvCell(typeof get === "function" ? get(row) : row[get])).join(","))
    .join("\n");

  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
