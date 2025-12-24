import type { DataRow, Dataset, DataValue, Dimension, DimensionType } from "../types";
import { decodeTextSmart, sniffFormat } from "./sniff";
import type { IngestionFormat } from "../types";
import * as XLSX from "xlsx";
import * as Papa from "papaparse";


export function parseDataset(data: Uint8Array | string): { dataset: Dataset; format: IngestionFormat } {
  if (!data) {
    return null;
  }
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);;
  }
  const sniff = sniffFormat(data);

  switch (sniff.format) {
    case "xlsx":
      return { dataset: parseXlsxToDataset(data), format: "xlsx" };

    case "json": {
      const text = sniff.text ?? decodeTextSmart(data).text;
      return { dataset: parseJsonToDataset(text), format: "json" };
    }

    case "csv": {
      const text = sniff.text ?? decodeTextSmart(data).text;
      return { dataset: parseCsvToDataset(text), format: "csv" };
    }

    default:
      // last-ditch: try text → json → csv-ish
      {
        const { text } = decodeTextSmart(data);
        try {
          return { dataset: parseJsonToDataset(text), format: "json" };
        } catch {
          return { dataset: parseCsvToDataset(text), format: "csv" };
        }
      }
  }
}



/* =========================
   Parquet → Dataset (WASM)
   ========================= */


/* =========================
   XLSX → Dataset (SheetJS)
   ========================= */

function parseXlsxToDataset(bytes: Uint8Array): Dataset {

  // cellDates makes date cells come out as Date objects (where possible)
  const wb = XLSX.read(bytes, { type: "array", cellDates: true });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { dimensions: [], source: [] };

  const sheet = wb.Sheets[sheetName]!;
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,       // array-of-arrays
    raw: true,       // preserve numbers/dates where possible
    defval: null,    // fill blanks as null
    blankrows: false,
  });

  return fromRowTable(aoa);
}

/* =========================
   CSV → Dataset (PapaParse)
   ========================= */

function parseCsvToDataset(text: string): Dataset {

  const parsed = Papa.parse(text, {
    skipEmptyLines: "greedy",
    quoteChar: '"',
    escapeChar: '"',
    delimitersToGuess: [",", ";", "\t", "|"],
  });

  if (parsed.errors?.length) {
    // You might want to surface errors in UI; here we just continue best-effort.
  }

  const rows: any[] = (parsed.data ?? []).filter((r) => r && r.length > 0);
  return fromRowTable(rows);
}

/* =========================
   JSON → Dataset
   ========================= */

function parseJsonToDataset(text: string): Dataset {
  const obj = JSON.parse(text);

  // If it already matches your Dataset shape, accept it (light validation)
  if (obj && typeof obj === "object" && Array.isArray(obj.dimensions) && Array.isArray(obj.source)) {
    return finalizeDataset(
      obj.dimensions.map((d: any) => String(d.name ?? d)),
      obj.source as any[][]
    );
  }

  // Array of objects: [{a:1,b:"x"}, ...]
  if (Array.isArray(obj) && obj.length && isPlainObject(obj[0])) {
    const keys = unionKeys(obj as Record<string, unknown>[]);
    const rows: DataRow[] = (obj as Record<string, unknown>[]).map((r) =>
      keys.map((k) => normalizeValue((r as any)[k]))
    );
    return finalizeDataset(keys, rows);
  }

  // Array of arrays: [[...], [...]]
  if (Array.isArray(obj) && obj.length && Array.isArray(obj[0])) {
    return fromRowTable(obj as any[][]);
  }

  // Object of arrays: {col1:[...], col2:[...]}
  if (isPlainObject(obj)) {
    const keys = Object.keys(obj);
    if (keys.length && keys.every((k) => Array.isArray((obj as any)[k]))) {
      const cols = keys.map((k) => (obj as any)[k] as unknown[]);
      const n = Math.max(...cols.map((c) => c.length));
      const rows: DataRow[] = new Array(n);
      for (let i = 0; i < n; i++) rows[i] = keys.map((_, ci) => normalizeValue(cols[ci]![i]));
      return finalizeDataset(keys, rows);
    }
  }

  throw new Error("Unsupported JSON shape for dataset ingestion.");
}

/* =========================
   Common table → Dataset
   ========================= */

function fromRowTable(table: any[][]): Dataset {
  const aoa = (table ?? []).filter((r) => Array.isArray(r) && r.some((x) => x != null && String(x).trim() !== ""));
  if (!aoa.length) return { dimensions: [], source: [] };

  // Normalize row lengths
  const width = Math.max(...aoa.map((r) => r.length));
  const rows = aoa.map((r) => {
    const out = new Array(width).fill(null);
    for (let i = 0; i < width; i++) out[i] = i < r.length ? r[i] : null;
    return out;
  });

  // Header detection: if first row is mostly non-numeric + distinct-ish, treat as header
  const first = rows[0]?.map((v) => (v == null ? "" : String(v).trim())) ?? [];
  const headerLike = looksLikeHeader(first);

  const dimNames = headerLike
    ? first.map((x, i) => (x ? x : `col_${i + 1}`))
    : new Array(width).fill(0).map((_, i) => `col_${i + 1}`);

  const body = headerLike ? rows.slice(1) : rows;

  const dataRows: DataRow[] = body.map((r) => r.map(normalizeValue));
  return finalizeDataset(dimNames, dataRows);
}

function finalizeDataset(dimNames: string[], rows: DataRow[]): Dataset {
  // Trim empty trailing rows
  const data = rows.filter((r) => r.some((v) => v != null && String(v).trim() !== ""));

  // Coerce + infer types
  const { types, coerced } = inferAndCoerce(dimNames, data);

  const dimensions: Dimension[] = dimNames.map((name, i) => ({
    name,
    type: types[i]!,
    displayName: name,
  }));

  return { dimensions, source: coerced };
}

/* =========================
   Type inference + coercion
   ========================= */

function inferAndCoerce(dimNames: string[], rows: DataRow[]): { types: DimensionType[]; coerced: DataRow[] } {
  const ncol = dimNames.length;
  const sampleLimit = 500;

  // Column samples
  const samples: unknown[][] = Array.from({ length: ncol }, () => []);
  for (let ri = 0; ri < rows.length; ri++) {
    const r = rows[ri]!;
    for (let ci = 0; ci < ncol; ci++) {
      const v = r[ci];
      if (v == null || v === "") continue;
      if (samples[ci]!.length < sampleLimit) samples[ci]!.push(v);
    }
  }

  const types: DimensionType[] = samples.map((col) => inferType(col));

  const coerced: DataRow[] = rows.map((r) => {
    const out: DataValue[] = new Array(ncol);
    for (let ci = 0; ci < ncol; ci++) {
      out[ci] = coerceValue(r[ci], types[ci]!);
    }
    return out;
  });

  return { types, coerced };
}

function inferType(values: unknown[]): DimensionType {
  if (!values.length) return "ordinal";

  // If many are Date already
  const dateObjs = values.filter((v) => v instanceof Date).length;
  if (dateObjs / values.length >= 0.9) return "time";

  // Strict numeric strings / numbers
  const numCount = values.filter((v) => isNumberish(v)).length;
  if (numCount / values.length >= 0.95) return "number"; // you said: only "number" for numeric

  // ISO-ish date strings
  const dateCount = values.filter((v) => isDateishString(v)).length;
  if (dateCount / values.length >= 0.9) return "time";

  return "ordinal";
}

function coerceValue(v: unknown, t: DimensionType): DataValue {
  if (v == null) return null;

  // Preserve Date
  if (v instanceof Date) return t === "time" ? v : v.toISOString();

  const s = typeof v === "string" ? v.trim() : null;

  if (s === "") return null;

  if (t === "number") {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "bigint") return Number(v);

    if (typeof v === "string") {
      // strict number parse (avoid “1,234” guessing games)
      const m = s?.match(/^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i);
      if (!m) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  if (t === "time") {
    if (typeof v === "string") {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === "number") {
      // ambiguous: could be unix ms or excel serial. We do NOT guess here.
      return null;
    }
    return null;
  }

  // ordinal
  if (typeof v === "string") return s;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : null;
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function normalizeValue(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" ? null : s;
  }
  return v;
}

function isNumberish(v: unknown): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "bigint") return true;
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  return /^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(s);
}

function isDateishString(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;

  // Strong bias toward ISO formats to avoid random strings parsing as dates
  const isoLike =
    /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(s) ||
    /^\d{4}\/\d{2}\/\d{2}$/.test(s);

  if (!isoLike) return false;

  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function looksLikeHeader(firstRow: string[]): boolean {
  if (!firstRow.length) return false;
  const nonEmpty = firstRow.filter((x) => x !== "");
  if (nonEmpty.length === 0) return false;

  const numericish = nonEmpty.filter((x) => isNumberish(x)).length;
  if (numericish / nonEmpty.length > 0.2) return false; // too many numbers to be header

  const uniq = new Set(nonEmpty.map((x) => x.toLowerCase()));
  if (uniq.size / nonEmpty.length < 0.8) return false; // too many repeats

  return true;
}

function unionKeys(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) set.add(k);
  return Array.from(set);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && (v as any).constructor === Object;
}
