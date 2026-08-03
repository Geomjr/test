import Papa from "papaparse";

/**
 * CSV import tuned for LinkedIn's connections export
 * (First Name, Last Name, URL, Email Address, Company, Position, Connected On)
 * while accepting any reasonable contacts CSV.
 */

export type ColumnMapping = {
  firstName?: number;
  lastName?: number;
  name?: number;
  email?: number;
  company?: number;
  role?: number;
  linkedinUrl?: number;
  connectedOn?: number;
  city?: number;
  phone?: number;
};

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
  skippedPreamble: number;
};

export type ImportRow = {
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  linkedinUrl: string | null;
  city: string | null;
  phone: string | null;
  connectedOn: string | null; // YYYY-MM-DD
};

export type DedupeStatus = { status: "new" } | { status: "duplicate"; matchId: string };

const HEADER_HINTS = ["first name", "name", "email", "company"];

/**
 * LinkedIn exports often prepend a "Notes:" preamble before the real header
 * row — scan the first rows for one that looks like a header.
 */
export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  const rows = (result.data ?? []).filter((r) => Array.isArray(r));
  let headerIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const lowered = (rows[i] ?? []).map((c) => (c ?? "").trim().toLowerCase());
    if (HEADER_HINTS.some((hint) => lowered.includes(hint))) {
      headerIndex = i;
      break;
    }
  }
  return {
    headers: (rows[headerIndex] ?? []).map((h) => (h ?? "").trim()),
    rows: rows.slice(headerIndex + 1),
    skippedPreamble: headerIndex,
  };
}

const MAPPING_RULES: [keyof ColumnMapping, RegExp][] = [
  ["firstName", /^first[ _-]?name$/i],
  ["lastName", /^last[ _-]?name$/i],
  ["name", /^(full[ _-]?name|name)$/i],
  ["email", /^e-?mail([ _-]?address)?$/i],
  ["company", /^(company|organi[sz]ation|employer)$/i],
  ["role", /^(position|title|role|job[ _-]?title)$/i],
  ["linkedinUrl", /^(url|profile[ _-]?url|linkedin)$/i],
  ["connectedOn", /^connected[ _-]?on$/i],
  ["city", /^(city|location)$/i],
  ["phone", /^phone([ _-]?number)?$/i],
];

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    for (const [field, pattern] of MAPPING_RULES) {
      if (mapping[field] === undefined && pattern.test(trimmed)) {
        mapping[field] = index;
        break;
      }
    }
  });
  return mapping;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * LinkedIn's "Connected On" format is "12 Mar 2024". Parsed with an explicit
 * month table — never `new Date(str)`, which is locale/timezone-dependent.
 */
export function parseConnectedOn(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  let match = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(trimmed);
  if (match) {
    const month = MONTHS[(match[2] ?? "").slice(0, 3).toLowerCase()];
    if (!month) return null;
    return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
  }

  match = /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/.exec(trimmed);
  if (match) {
    const month = MONTHS[(match[1] ?? "").slice(0, 3).toLowerCase()];
    if (!month) return null;
    return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}`;
  }

  return null;
}

function cell(row: string[], index: number | undefined): string | null {
  if (index === undefined) return null;
  const value = (row[index] ?? "").trim();
  return value || null;
}

export function buildImportRows(parsed: ParsedCsv, mapping: ColumnMapping): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const row of parsed.rows) {
    const first = cell(row, mapping.firstName);
    const last = cell(row, mapping.lastName);
    const full = cell(row, mapping.name);
    const name = full ?? [first, last].filter(Boolean).join(" ").trim();
    if (!name) continue;

    const connectedRaw = cell(row, mapping.connectedOn);
    rows.push({
      name,
      email: cell(row, mapping.email)?.toLowerCase() ?? null,
      company: cell(row, mapping.company),
      role: cell(row, mapping.role),
      linkedinUrl: cell(row, mapping.linkedinUrl),
      city: cell(row, mapping.city),
      phone: cell(row, mapping.phone),
      connectedOn: connectedRaw ? parseConnectedOn(connectedRaw) : null,
    });
  }
  return rows;
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Dedupe by email when both sides have one (LinkedIn often omits emails),
 * otherwise by normalized full name.
 */
export function dedupeRows(
  existing: { id: string; name: string; email: string | null }[],
  rows: ImportRow[],
): DedupeStatus[] {
  const byEmail = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const contact of existing) {
    if (contact.email) byEmail.set(contact.email.toLowerCase(), contact.id);
    byName.set(normalizeName(contact.name), contact.id);
  }

  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();

  return rows.map((row) => {
    const email = row.email?.toLowerCase();
    const name = normalizeName(row.name);

    if (email) {
      const matchId = byEmail.get(email);
      if (matchId) return { status: "duplicate", matchId };
      if (seenEmails.has(email)) return { status: "duplicate", matchId: "earlier-row" };
    }
    const matchId = byName.get(name);
    if (matchId) return { status: "duplicate", matchId };
    if (seenNames.has(name)) return { status: "duplicate", matchId: "earlier-row" };

    if (email) seenEmails.add(email);
    seenNames.add(name);
    return { status: "new" };
  });
}
