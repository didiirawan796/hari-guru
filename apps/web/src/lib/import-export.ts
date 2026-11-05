import { parse } from "csv-parse/sync";
import { readSheet } from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import type { Peran } from "./peserta";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 1000;

export interface PesertaImport {
  nama: string;
  peran: Peran;
  baris: number;
}

export class ImportError extends Error {}

function normalizePeran(value: unknown): Peran | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["kepsek", "kepala sekolah", "ks"].includes(normalized)) {
    return "kepsek";
  }
  if (["guru", "pendidik", "guru kelas"].includes(normalized)) {
    return "guru";
  }
  return null;
}

function rowsToPeserta(rows: unknown[][]): PesertaImport[] {
  if (rows.length < 2) {
    throw new ImportError("File tidak memiliki baris data peserta.");
  }

  const headers = (rows[0] ?? []).map((cell) =>
    String(cell ?? "")
      .trim()
      .toLowerCase(),
  );
  const namaIndex = headers.findIndex(
    (header) => header === "nama" || header === "name",
  );
  const peranIndex = headers.findIndex(
    (header) => header === "peran" || header === "role",
  );

  if (namaIndex === -1 || peranIndex === -1) {
    throw new ImportError(
      'Header file harus memiliki kolom "NAMA" dan "PERAN".',
    );
  }

  const result: PesertaImport[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const nama = String(row[namaIndex] ?? "").trim();
    const peranRaw = row[peranIndex];

    if (!nama && !peranRaw) continue;

    if (!nama) {
      throw new ImportError(`Nama pada baris ${index + 1} kosong.`);
    }
    if (nama.length > 120) {
      throw new ImportError(
        `Nama pada baris ${index + 1} melebihi 120 karakter.`,
      );
    }

    const peran = normalizePeran(peranRaw);
    if (!peran) {
      throw new ImportError(
        `Peran pada baris ${index + 1} tidak valid. Gunakan "kepsek" atau "guru".`,
      );
    }

    result.push({ nama, peran, baris: index + 1 });
    if (result.length > MAX_IMPORT_ROWS) {
      throw new ImportError(`Maksimal ${MAX_IMPORT_ROWS} peserta per import.`);
    }
  }

  if (result.length === 0) {
    throw new ImportError("Tidak ada data peserta yang bisa diimport.");
  }

  return result;
}

export async function parsePesertaFile(file: File): Promise<PesertaImport[]> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError("Ukuran file maksimal 2 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    const text = await file.text();
    if (!text.trim()) {
      throw new ImportError("File CSV kosong.");
    }
    const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
    const semicolonCount = (firstLine.match(/;/g) ?? []).length;
    const commaCount = (firstLine.match(/,/g) ?? []).length;
    const delimiter = semicolonCount > commaCount ? ";" : ",";

    let records: unknown[][];
    try {
      records = parse(text, {
        bom: true,
        delimiter,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      }) as unknown[][];
    } catch {
      throw new ImportError("File CSV tidak dapat dibaca.");
    }
    return rowsToPeserta(records);
  }

  if (extension === "xlsx") {
    let rows: unknown[][];
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      rows = (await readSheet(buffer)) as unknown[][];
    } catch {
      throw new ImportError(
        "File Excel tidak dapat dibaca. Gunakan format .xlsx.",
      );
    }
    return rowsToPeserta(rows);
  }

  throw new ImportError("Format file harus .xlsx atau .csv.");
}

export async function buildTemplateExcel(): Promise<Buffer> {
  const headerStyle = {
    fontWeight: "bold" as const,
    textColor: "#FFFFFF",
    backgroundColor: "#C8102E",
    align: "center" as const,
  };

  const pesertaSheet = [
    [
      { value: "NAMA", ...headerStyle },
      { value: "PERAN", ...headerStyle },
    ],
  ];

  const petunjukSheet = [
    [{ value: "PETUNJUK PENGISIAN", fontWeight: "bold" as const, fontSize: 14 }],
    [""],
    ["1. Isi data pada sheet \"Peserta\"."],
    ["2. Kolom NAMA wajib diisi, maksimal 120 karakter."],
    ["3. Kolom PERAN hanya boleh diisi: kepsek atau guru."],
    ["4. Jangan mengubah nama header NAMA dan PERAN."],
    ["5. Satu baris untuk satu peserta."],
    [""],
    ["Contoh:"],
    ["Budi Santoso | guru"],
    ["Siti Aminah | kepsek"],
  ];

  return writeExcelFile([
    {
      data: pesertaSheet,
      sheet: "Peserta",
      columns: [{ width: 38 }, { width: 18 }],
      stickyRowsCount: 1,
    },
    {
      data: petunjukSheet,
      sheet: "Petunjuk",
      columns: [{ width: 70 }],
    },
  ]).toBuffer();
}

export function csvEscape(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return (
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\r\n")
  );
}
