import type { Dataset } from "../types.js";
import type { IngestionFormat } from "../types.js";


type SniffResult =
  | { format: "parquet" }
  | { format: "xlsx" }
  | { format: "json"; text?: string }
  | { format: "csv"; text?: string; delimiter?: string }
  | { format: "unknown" };

export function sniffFormat(data: Uint8Array): SniffResult {
  // --- Parquet: "PAR1" at start, and commonly also at end
  if (startsWithAscii(data, "PAR1")) return { format: "parquet" };
  if (endsWithAscii(data, "PAR1") && startsWithAscii(data, "PAR1")) return { format: "parquet" };

  // --- ZIP container (XLSX is ZIP)
  if (isZip(data)) {
    // XLSX check: central directory contains file names like "xl/workbook.xml"
    // Those names appear uncompressed in the ZIP directory, so scanning bytes works.
    const looksLikeXlsx =
      asciiIncludesNearEnds(data, "[Content_Types].xml") &&
      (asciiIncludesNearEnds(data, "xl/workbook.xml") || asciiIncludesNearEnds(data, "xl/"));

    if (looksLikeXlsx) return { format: "xlsx" };

    // Could be other ZIP (docx, odt, etc.) — treat as unknown unless you want more checks
    return { format: "unknown" };
  }

  // --- Text-based sniff: JSON vs CSV
  const { text } = decodeTextSmart(data);
  const trimmed = text.trimStart();

  // JSON: cheap gate + parse attempt
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return { format: "json", text };
    } catch {
      // fall through; could be “{” in CSV first cell, or broken JSON
    }
  }

  // CSV/TSV: delimiter scoring on first N lines
  const csv = sniffCsv(text);
  if (csv.confidence >= 0.6) return { format: "csv", text, delimiter: csv.delimiter };

  return { format: "unknown" };
}

// -------------------- ZIP/XLSX helpers --------------------

function isZip(data: Uint8Array): boolean {
  // "PK\x03\x04" (local header) OR "PK\x05\x06" (empty archive) OR "PK\x07\x08" (spanned)
  return (
    data.length >= 4 &&
    data[0] === 0x50 &&
    data[1] === 0x4b &&
    (data[2] === 0x03 || data[2] === 0x05 || data[2] === 0x07) &&
    (data[3] === 0x04 || data[3] === 0x06 || data[3] === 0x08)
  );
}

function asciiIncludesNearEnds(data: Uint8Array, needle: string): boolean {
  // ZIP directory is near the end, but filenames can also appear early.
  // Scan a limited window to avoid O(n) on huge files.
  const window = 1024 * 1024; // 1MB
  const start = data.subarray(0, Math.min(window, data.length));
  const end = data.subarray(Math.max(0, data.length - window), data.length);
  return asciiIncludes(start, needle) || asciiIncludes(end, needle);
}

function asciiIncludes(haystack: Uint8Array, needle: string): boolean {
  const n = needle.length;
  if (n === 0 || haystack.length < n) return false;

  // needle ascii bytes
  const nb = new Uint8Array(n);
  for (let i = 0; i < n; i++) nb[i] = needle.charCodeAt(i) & 0xff;

  // naive search; ok for short needles + bounded windows
  outer: for (let i = 0; i <= haystack.length - n; i++) {
    for (let j = 0; j < n; j++) {
      if (haystack[i + j] !== nb[j]) continue outer;
    }
    return true;
  }
  return false;
}

function startsWithAscii(data: Uint8Array, s: string): boolean {
  if (data.length < s.length) return false;
  for (let i = 0; i < s.length; i++) {
    if (data[i] !== (s.charCodeAt(i) & 0xff)) return false;
  }
  return true;
}

function endsWithAscii(data: Uint8Array, s: string): boolean {
  if (data.length < s.length) return false;
  const off = data.length - s.length;
  for (let i = 0; i < s.length; i++) {
    if (data[off + i] !== (s.charCodeAt(i) & 0xff)) return false;
  }
  return true;
}

// -------------------- Text decoding helpers --------------------

export function decodeTextSmart(data: Uint8Array): { text: string; encoding: string } {
  if (data.length === 0) return { text: "", encoding: "utf-8" };

  // BOM detection
  if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
    return { text: new TextDecoder("utf-8").decode(data.subarray(3)), encoding: "utf-8" };
  }
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(data.subarray(2)), encoding: "utf-16le" };
  }
  if (data.length >= 2 && data[0] === 0xfe && data[1] === 0xff) {
    // utf-16be isn’t supported everywhere; if it throws, you can byte-swap and decode as utf-16le.
    try {
      return { text: new TextDecoder("utf-16be").decode(data.subarray(2)), encoding: "utf-16be" };
    } catch {
      const swapped = swap16(data.subarray(2));
      return { text: new TextDecoder("utf-16le").decode(swapped), encoding: "utf-16be" };
    }
  }

  // Heuristic UTF-16 without BOM: lots of NULs every other byte
  if (looksLikeUtf16(data)) {
    // guess LE (common on Windows)
    try {
      return { text: new TextDecoder("utf-16le").decode(data), encoding: "utf-16le" };
    } catch {
      // fallback: swap and decode as LE
      const swapped = swap16(data);
      return { text: new TextDecoder("utf-16le").decode(swapped), encoding: "utf-16be" };
    }
  }

  // Validate UTF-8 strictly; else fallback to windows-1252/latin1-ish
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(data), encoding: "utf-8" };
  } catch {
    // Most browsers support windows-1252; if not, iso-8859-1 usually exists.
    try {
      return { text: new TextDecoder("windows-1252").decode(data), encoding: "windows-1252" };
    } catch {
      return { text: new TextDecoder("iso-8859-1").decode(data), encoding: "iso-8859-1" };
    }
  }
}

function looksLikeUtf16(data: Uint8Array): boolean {
  const sampleLen = Math.min(data.length, 4096);
  if (sampleLen < 8) return false;

  let zeroEven = 0;
  let zeroOdd = 0;
  let pairs = 0;

  for (let i = 0; i + 1 < sampleLen; i += 2) {
    if (data[i] === 0x00) zeroEven++;
    if (data[i + 1] === 0x00) zeroOdd++;
    pairs++;
  }

  // If a large fraction of one side is zero, it’s probably UTF-16 text
  const evenRate = zeroEven / pairs;
  const oddRate = zeroOdd / pairs;
  return evenRate > 0.3 || oddRate > 0.3;
}

function swap16(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i + 1 < data.length; i += 2) {
    out[i] = data[i + 1]!;
    out[i + 1] = data[i]!;
  }
  if (data.length % 2 === 1) out[data.length - 1] = data[data.length - 1]!;
  return out;
}

// -------------------- CSV sniffing --------------------

function sniffCsv(text: string): { delimiter: string; confidence: number } {
  // Look at first ~50 lines, ignore huge files
  const lines = text
    .split(/\r\n|\n|\r/)
    .slice(0, 50)
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) return { delimiter: ",", confidence: 0 };

  const candidates = [",", ";", "\t", "|"];
  let best = { delimiter: ",", score: 0 };

  for (const d of candidates) {
    const counts = lines.map((l) => countCharOutsideQuotes(l, d));
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;

    // CSV-ish: consistently multiple delimiters per line
    const variance =
      counts.reduce((a, c) => a + (c - mean) * (c - mean), 0) / Math.max(1, counts.length - 1);

    // Heuristic score: prefer higher mean and low variance
    const score = Math.max(0, mean) / (1 + variance);

    if (score > best.score) best = { delimiter: d, score };
  }

  // Map score to a rough confidence (tweak to taste)
  const confidence = Math.max(0, Math.min(1, best.score / 5));
  return { delimiter: best.delimiter, confidence };
}

function countCharOutsideQuotes(line: string, ch: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      // Handle escaped quotes ""
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ch) count++;
  }
  return count;
}
