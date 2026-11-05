import { type PoolClient, query, withTransaction } from "@hari-guru/db";

export type Peran = "kepsek" | "guru";

export interface PesertaRecord {
  id: string;
  nomorUndian: string;
  nama: string;
  peran: Peran;
}

export interface PesertaInput {
  id?: string;
  nama: string;
  peran: Peran;
}

export interface PesertaKartu {
  id: string;
  nomorUndian: string;
  nama: string;
  peran: Peran;
  sekolah: string;
}

interface PesertaRow {
  id: string;
  nomor_undian: string;
  nama: string;
  peran: Peran;
}

export class PesertaError extends Error {}

const MAX_PESERTA = 1000;
const MAX_NAMA = 120;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapRow(row: PesertaRow): PesertaRecord {
  return {
    id: row.id,
    nomorUndian: row.nomor_undian,
    nama: row.nama,
    peran: row.peran,
  };
}

export function validasiBarisPeserta(
  value: unknown,
  options: { izinkanId?: boolean } = {},
): PesertaInput[] {
  if (!Array.isArray(value)) {
    throw new PesertaError("Daftar peserta tidak valid.");
  }
  if (value.length === 0) {
    throw new PesertaError("Minimal harus ada satu peserta.");
  }
  if (value.length > MAX_PESERTA) {
    throw new PesertaError(`Maksimal ${MAX_PESERTA} peserta per penyimpanan.`);
  }

  const ids = new Set<string>();
  const rows: PesertaInput[] = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") {
      throw new PesertaError(`Baris ${index + 1} tidak valid.`);
    }
    const candidate = item as {
      id?: unknown;
      nama?: unknown;
      peran?: unknown;
    };
    const nama =
      typeof candidate.nama === "string" ? candidate.nama.trim() : "";
    const peran = candidate.peran;

    if (!nama) {
      throw new PesertaError(`Nama pada baris ${index + 1} wajib diisi.`);
    }
    if (nama.length > MAX_NAMA) {
      throw new PesertaError(
        `Nama pada baris ${index + 1} maksimal ${MAX_NAMA} karakter.`,
      );
    }
    if (peran !== "kepsek" && peran !== "guru") {
      throw new PesertaError(
        `Peran pada baris ${index + 1} harus kepsek atau guru.`,
      );
    }

    let id: string | undefined;
    if (options.izinkanId && candidate.id !== undefined) {
      if (typeof candidate.id !== "string" || !UUID_PATTERN.test(candidate.id)) {
        throw new PesertaError(`ID peserta pada baris ${index + 1} tidak valid.`);
      }
      if (ids.has(candidate.id)) {
        throw new PesertaError("Ada peserta yang muncul lebih dari sekali.");
      }
      ids.add(candidate.id);
      id = candidate.id;
    }

    rows.push({ ...(id ? { id } : {}), nama, peran });
  }

  return rows;
}

async function nextNomorUndian(client: PoolClient): Promise<string> {
  const result = await client.query<{ nomor: string }>(
    "SELECT nextval('nomor_undian_seq')::text AS nomor",
  );
  return `KEC-${String(Number(result.rows[0].nomor)).padStart(4, "0")}`;
}

async function listPesertaWithClient(
  client: PoolClient,
  sekolahId: string,
): Promise<PesertaRecord[]> {
  const result = await client.query<PesertaRow>(
    `SELECT id, nomor_undian, nama, peran
     FROM peserta
     WHERE sekolah_id = $1
     ORDER BY split_part(nomor_undian, '-', 2)::int`,
    [sekolahId],
  );
  return result.rows.map(mapRow);
}

export async function getPesertaByNomor(
  nomorUndian: string,
): Promise<PesertaKartu | null> {
  const result = await query<PesertaRow & { nama_sekolah: string }>(
    `SELECT p.id, p.nomor_undian, p.nama, p.peran, s.nama_sekolah
     FROM peserta p
     JOIN sekolah s ON s.id = p.sekolah_id
     WHERE p.nomor_undian = $1`,
    [nomorUndian],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    nomorUndian: row.nomor_undian,
    nama: row.nama,
    peran: row.peran,
    sekolah: row.nama_sekolah,
  };
}

export async function listPeserta(
  sekolahId: string,
): Promise<PesertaRecord[]> {
  const result = await query<PesertaRow>(
    `SELECT id, nomor_undian, nama, peran
     FROM peserta
     WHERE sekolah_id = $1
     ORDER BY split_part(nomor_undian, '-', 2)::int`,
    [sekolahId],
  );
  return result.rows.map(mapRow);
}

export async function simpanPeserta(
  sekolahId: string,
  rows: PesertaInput[],
): Promise<PesertaRecord[]> {
  return withTransaction(async (client) => {
    const school = await client.query(
      "SELECT id FROM sekolah WHERE id = $1 FOR UPDATE",
      [sekolahId],
    );
    if (!school.rowCount) {
      throw new PesertaError("Sekolah tidak ditemukan.");
    }

    const existingResult = await client.query<{ id: string }>(
      "SELECT id FROM peserta WHERE sekolah_id = $1",
      [sekolahId],
    );
    const existingIds = new Set(existingResult.rows.map((row) => row.id));
    const keepIds = new Set(rows.flatMap((row) => (row.id ? [row.id] : [])));

    for (const id of keepIds) {
      if (!existingIds.has(id)) {
        throw new PesertaError("Ada peserta yang bukan milik sekolah ini.");
      }
    }

    const removedIds = [...existingIds].filter((id) => !keepIds.has(id));
    if (removedIds.length > 0) {
      const winners = await client.query(
        `SELECT 1 FROM pemenang WHERE peserta_id = ANY($1::uuid[]) LIMIT 1`,
        [removedIds],
      );
      if (winners.rowCount) {
        throw new PesertaError(
          "Peserta yang sudah menang tidak dapat dihapus dari daftar.",
        );
      }

      await client.query(
        "DELETE FROM peserta WHERE id = ANY($1::uuid[])",
        [removedIds],
      );
    }

    for (const row of rows) {
      if (!row.id) continue;
      await client.query(
        `UPDATE peserta SET nama = $1, peran = $2
         WHERE id = $3 AND sekolah_id = $4`,
        [row.nama, row.peran, row.id, sekolahId],
      );
    }

    for (const row of rows) {
      if (row.id) continue;
      const nomor = await nextNomorUndian(client);
      await client.query(
        `INSERT INTO peserta (sekolah_id, nama, peran, nomor_undian)
         VALUES ($1, $2, $3, $4)`,
        [sekolahId, row.nama, row.peran, nomor],
      );
    }

    return listPesertaWithClient(client, sekolahId);
  });
}

export async function tambahPeserta(
  sekolahId: string,
  rows: PesertaInput[],
): Promise<PesertaRecord[]> {
  return withTransaction(async (client) => {
    const school = await client.query(
      "SELECT id FROM sekolah WHERE id = $1 FOR UPDATE",
      [sekolahId],
    );
    if (!school.rowCount) {
      throw new PesertaError("Sekolah tidak ditemukan.");
    }

    for (const row of rows) {
      const nomor = await nextNomorUndian(client);
      await client.query(
        `INSERT INTO peserta (sekolah_id, nama, peran, nomor_undian)
         VALUES ($1, $2, $3, $4)`,
        [sekolahId, row.nama, row.peran, nomor],
      );
    }

    return listPesertaWithClient(client, sekolahId);
  });
}
