import { describe, expect, it } from "vitest";
import {
  autoMapColumns,
  buildImportRows,
  dedupeRows,
  parseConnectedOn,
  parseCsv,
} from "@/lib/csv/linkedin";

const LINKEDIN_CSV = `Notes:
"When exporting your connection data, you may be missing information."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Priya,Raman,https://linkedin.com/in/priya,priya@example.com,Bain & Company,Consultant,12 Mar 2024
Marcus,Webb,https://linkedin.com/in/marcus,,Goldman Sachs,"VP, TMT",3 Jan 2023
,,,,,,
`;

describe("parseCsv", () => {
  it("skips LinkedIn's Notes preamble and finds the real header", () => {
    const parsed = parseCsv(LINKEDIN_CSV);
    expect(parsed.headers[0]).toBe("First Name");
    expect(parsed.skippedPreamble).toBe(2);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(2);
  });

  it("handles quoted fields containing commas", () => {
    const parsed = parseCsv(LINKEDIN_CSV);
    const mapping = autoMapColumns(parsed.headers);
    const rows = buildImportRows(parsed, mapping);
    expect(rows[1]?.role).toBe("VP, TMT");
  });
});

describe("autoMapColumns", () => {
  it("maps the standard LinkedIn columns", () => {
    const mapping = autoMapColumns([
      "First Name", "Last Name", "URL", "Email Address", "Company", "Position", "Connected On",
    ]);
    expect(mapping).toMatchObject({
      firstName: 0,
      lastName: 1,
      linkedinUrl: 2,
      email: 3,
      company: 4,
      role: 5,
      connectedOn: 6,
    });
  });

  it("maps a generic Name column", () => {
    expect(autoMapColumns(["Name", "Email"])).toMatchObject({ name: 0, email: 1 });
  });
});

describe("parseConnectedOn", () => {
  it("parses LinkedIn's 'd MMM yyyy' format", () => {
    expect(parseConnectedOn("12 Mar 2024")).toBe("2024-03-12");
    expect(parseConnectedOn("3 Jan 2023")).toBe("2023-01-03");
  });

  it("parses 'MMM d, yyyy'", () => {
    expect(parseConnectedOn("Mar 12, 2024")).toBe("2024-03-12");
  });

  it("passes through ISO dates", () => {
    expect(parseConnectedOn("2024-03-12")).toBe("2024-03-12");
  });

  it("returns null for garbage", () => {
    expect(parseConnectedOn("yesterday")).toBeNull();
    expect(parseConnectedOn("")).toBeNull();
  });
});

describe("buildImportRows", () => {
  it("joins first/last names and skips empty rows", () => {
    const parsed = parseCsv(LINKEDIN_CSV);
    const rows = buildImportRows(parsed, autoMapColumns(parsed.headers));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("Priya Raman");
    expect(rows[0]?.connectedOn).toBe("2024-03-12");
    expect(rows[1]?.email).toBeNull();
  });
});

describe("dedupeRows", () => {
  const existing = [
    { id: "e1", name: "Priya Raman", email: "priya@example.com" },
    { id: "e2", name: "Marcus  Webb", email: null },
  ];

  it("matches by email first", () => {
    const [status] = dedupeRows(existing, [
      { name: "P. Raman", email: "PRIYA@example.com", company: null, role: null, linkedinUrl: null, city: null, phone: null, connectedOn: null },
    ]);
    expect(status).toEqual({ status: "duplicate", matchId: "e1" });
  });

  it("falls back to normalized name matching", () => {
    const [status] = dedupeRows(existing, [
      { name: "marcus webb", email: null, company: null, role: null, linkedinUrl: null, city: null, phone: null, connectedOn: null },
    ]);
    expect(status).toEqual({ status: "duplicate", matchId: "e2" });
  });

  it("marks unknown people as new", () => {
    const [status] = dedupeRows(existing, [
      { name: "Somebody Else", email: null, company: null, role: null, linkedinUrl: null, city: null, phone: null, connectedOn: null },
    ]);
    expect(status).toEqual({ status: "new" });
  });
});
