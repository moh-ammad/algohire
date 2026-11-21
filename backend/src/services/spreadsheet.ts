import * as XLSX from "xlsx";
import { z } from "zod";

export type CandidateRow = {
  rowNumber: number;
  fullName: string;
  phone: string;
  nationalId: string | null;
  courseName: string;
};

export type RowError = {
  row: number;
  field?: string;
  message: string;
};

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{8,20}$/, "Phone must be 8–20 digits/symbols");

const candidateSchema = z.object({
  fullName: z.string().trim().min(2, "fullName is required").max(120),
  phone: phoneSchema,
  nationalId: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  courseName: z.string().trim().min(2, "courseName is required").max(120),
});

const HEADER_ALIASES: Record<string, keyof z.infer<typeof candidateSchema>> = {
  fullname: "fullName",
  "full name": "fullName",
  name: "fullName",
  phone: "phone",
  mobile: "phone",
  "phone number": "phone",
  nationalid: "nationalId",
  "national id": "nationalId",
  aadhaar: "nationalId",
  coursename: "courseName",
  "course name": "courseName",
  course: "courseName",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/_/g, " ");
}

function mapHeaders(rawHeaders: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  rawHeaders.forEach((header, index) => {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key) map[key] = index;
  });
  return map;
}

/** Parse CSV/XLSX buffer. Validates every data row; never returns partial valid set if errors exist. */
export function parseCandidateSpreadsheet(buffer: Buffer): {
  rows: CandidateRow[];
  errors: RowError[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: "Spreadsheet is empty" }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(
    sheet,
    { header: 1, defval: "", blankrows: false },
  );

  if (matrix.length < 2) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message:
            "Need a header row plus at least one candidate. Columns: fullName, phone, courseName, nationalId?",
        },
      ],
    };
  }

  const headerCells = (matrix[0] ?? []).map((c) => String(c ?? ""));
  const col = mapHeaders(headerCells);

  const missing: string[] = [];
  if (col.fullName === undefined) missing.push("fullName");
  if (col.phone === undefined) missing.push("phone");
  if (col.courseName === undefined) missing.push("courseName");

  if (missing.length) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing required column(s): ${missing.join(", ")}`,
        },
      ],
    };
  }

  const errors: RowError[] = [];
  const rows: CandidateRow[] = [];
  const phones = new Set<string>();

  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const spreadsheetRow = i + 1; // 1-based including header

    const raw = {
      fullName: String(line[col.fullName!] ?? "").trim(),
      phone: String(line[col.phone!] ?? "").trim(),
      nationalId:
        col.nationalId !== undefined
          ? String(line[col.nationalId] ?? "").trim()
          : "",
      courseName: String(line[col.courseName!] ?? "").trim(),
    };

    // Skip fully blank lines
    if (!raw.fullName && !raw.phone && !raw.courseName && !raw.nationalId) {
      continue;
    }

    const parsed = candidateSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          row: spreadsheetRow,
          field: issue.path.join(".") || undefined,
          message: issue.message,
        });
      }
      continue;
    }

    const phoneKey = parsed.data.phone.replace(/\s+/g, "");
    if (phones.has(phoneKey)) {
      errors.push({
        row: spreadsheetRow,
        field: "phone",
        message: "Duplicate phone in this file",
      });
      continue;
    }
    phones.add(phoneKey);

    rows.push({
      rowNumber: spreadsheetRow,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      nationalId: parsed.data.nationalId ?? null,
      courseName: parsed.data.courseName,
    });
  }

  if (errors.length === 0 && rows.length === 0) {
    errors.push({ row: 0, message: "No candidate rows found" });
  }

  // Atomic rule: if any row error, discard all parsed rows for the caller
  if (errors.length > 0) {
    return { rows: [], errors };
  }

  return { rows, errors: [] };
}
