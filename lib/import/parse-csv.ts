/** Parse CSV text into rows of string cells (handles quoted fields). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

export function rowsToObjects(
  rows: string[][]
): { headers: string[]; records: Record<string, string>[] } {
  if (rows.length < 2) {
    return { headers: [], records: [] };
  }
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records = rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i]?.trim() ?? "";
    });
    return obj;
  });
  return { headers, records };
}

/** DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD */
export function parseDateCell(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
