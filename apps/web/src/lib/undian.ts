import { randomInt } from "node:crypto";
import { query, withTransaction } from "@hari-guru/db";
import { ApiError } from "./api";
import type {
  HasilSesi,
  KandidatUndian,
  LiveState,
  OperatorData,
  PemenangRecord,
  SesiRingkas,
  StatusSesi,
} from "./undian-types";

export type {
  HasilSesi,
  KandidatUndian,
  LiveState,
  OperatorData,
  PemenangRecord,
  SesiRingkas,
} from "./undian-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Kunci advisory global untuk menserialkan seluruh aksi undian.
const DRAW_LOCK_KEY = 20261125;

interface SesiDbRow {
  id: string;
  nama_hadiah: string;
  urutan: number;
  jumlah_pemenang: number;
  status: StatusSesi;
  total_pemenang: number;
}

interface PemenangDbRow {
  id: string;
  sesi_id: string;
  hadiah_ke: number;
  waktu_menang: Date;
  nomor_undian: string;
  nama: string;
  peran: "kepsek" | "guru";
  nama_sekolah: string;
}

const SESI_SELECT = `
  SELECT sh.id, sh.nama_hadiah, sh.urutan, sh.jumlah_pemenang, sh.status,
    count(pm.id)::int AS total_pemenang
  FROM sesi_hadiah sh
  LEFT JOIN pemenang pm ON pm.sesi_id = sh.id`;

const SESI_GROUP = "GROUP BY sh.id";

const PEMENANG_SELECT = `
  SELECT pm.id, pm.sesi_id, pm.hadiah_ke, pm.waktu_menang,
    p.nomor_undian, p.nama, p.peran, s.nama_sekolah
  FROM pemenang pm
  JOIN peserta p ON p.id = pm.peserta_id
  JOIN sekolah s ON s.id = p.sekolah_id`;

function mapSesi(row: SesiDbRow): SesiRingkas {
  return {
    id: row.id,
    namaHadiah: row.nama_hadiah,
    urutan: row.urutan,
    jumlahPemenang: row.jumlah_pemenang,
    status: row.status,
    totalPemenang: row.total_pemenang,
  };
}

function mapPemenang(row: PemenangDbRow): PemenangRecord {
  return {
    id: row.id,
    hadiahKe: row.hadiah_ke,
    nomorUndian: row.nomor_undian,
    nama: row.nama,
    peran: row.peran,
    sekolah: row.nama_sekolah,
    waktuMenang: new Date(row.waktu_menang).toISOString(),
  };
}

function validasiIdSesi(id: string): string {
  if (!UUID_PATTERN.test(id)) {
    throw new ApiError(400, "ID sesi tidak valid.");
  }
  return id;
}

/**
 * Fisher-Yates memakai crypto.randomInt (CSPRNG), bukan Math.random().
 */
function pilihPesertaAcak(ids: string[]): string {
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids[0];
}

export async function listSesi(): Promise<SesiRingkas[]> {
  const result = await query<SesiDbRow>(
    `${SESI_SELECT}
     ${SESI_GROUP}
     ORDER BY sh.urutan`,
  );
  return result.rows.map(mapSesi);
}

export async function getPemenangSesi(
  sesiId: string,
): Promise<PemenangRecord[]> {
  const result = await query<PemenangDbRow>(
    `${PEMENANG_SELECT}
     WHERE pm.sesi_id = $1
     ORDER BY pm.hadiah_ke`,
    [sesiId],
  );
  return result.rows.map(mapPemenang);
}

async function getPemenangById(id: string): Promise<PemenangRecord | null> {
  const result = await query<PemenangDbRow>(
    `${PEMENANG_SELECT}
     WHERE pm.id = $1`,
    [id],
  );
  return result.rows[0] ? mapPemenang(result.rows[0]) : null;
}

/**
 * Sesi yang ditampilkan di panggung:
 * 1. sesi yang sedang berjalan,
 * 2. sesi selesai terakhir,
 * 3. sesi berikutnya yang belum dimulai.
 */
export async function getLiveState(): Promise<LiveState> {
  const sesiResult = await query<SesiDbRow>(
    `${SESI_SELECT}
     ${SESI_GROUP}
     ORDER BY
       CASE sh.status
         WHEN 'berjalan' THEN 0
         WHEN 'selesai' THEN 1
         ELSE 2
       END,
       CASE WHEN sh.status = 'selesai' THEN -sh.urutan ELSE sh.urutan END
     LIMIT 1`,
  );

  const sesi = sesiResult.rows[0] ? mapSesi(sesiResult.rows[0]) : null;
  const pemenang = sesi ? await getPemenangSesi(sesi.id) : [];

  return {
    sesi,
    pemenang,
    updatedAt: new Date().toISOString(),
  };
}

export async function getOperatorData(): Promise<OperatorData> {
  const [sesi, live] = await Promise.all([listSesi(), getLiveState()]);
  return { sesi, live };
}

export async function getHasilData(): Promise<HasilSesi[]> {
  const [sesi, pemenangResult] = await Promise.all([
    listSesi(),
    query<PemenangDbRow>(
      `${PEMENANG_SELECT}
       ORDER BY pm.sesi_id, pm.hadiah_ke`,
    ),
  ]);

  const grouped = new Map<string, PemenangRecord[]>();
  for (const row of pemenangResult.rows) {
    const list = grouped.get(row.sesi_id) ?? [];
    list.push(mapPemenang(row));
    grouped.set(row.sesi_id, list);
  }

  return sesi.map((item) => ({
    ...item,
    pemenang: grouped.get(item.id) ?? [],
  }));
}

export async function mulaiSesi(id: string): Promise<void> {
  const sesiId = validasiIdSesi(id);

  await withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [DRAW_LOCK_KEY]);

    const result = await client.query<{ status: StatusSesi }>(
      "SELECT status FROM sesi_hadiah WHERE id = $1 FOR UPDATE",
      [sesiId],
    );
    const sesi = result.rows[0];
    if (!sesi) {
      throw new ApiError(404, "Sesi hadiah tidak ditemukan.");
    }
    if (sesi.status === "selesai") {
      throw new ApiError(409, "Sesi ini sudah selesai dan tidak dapat dibuka lagi.");
    }

    await client.query(
      `UPDATE sesi_hadiah
       SET status = 'selesai'
       WHERE status = 'berjalan' AND id <> $1`,
      [sesiId],
    );
    await client.query(
      "UPDATE sesi_hadiah SET status = 'berjalan' WHERE id = $1",
      [sesiId],
    );
  });
}

export async function undiPemenang(
  sesiIdInput: string,
): Promise<PemenangRecord> {
  const sesiId = validasiIdSesi(sesiIdInput);

  const pemenangId = await withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [DRAW_LOCK_KEY]);

    const sesiResult = await client.query<{
      id: string;
      jumlah_pemenang: number;
      status: StatusSesi;
    }>(
      `SELECT id, jumlah_pemenang, status
       FROM sesi_hadiah
       WHERE id = $1
       FOR UPDATE`,
      [sesiId],
    );
    const sesi = sesiResult.rows[0];
    if (!sesi) {
      throw new ApiError(404, "Sesi hadiah tidak ditemukan.");
    }
    if (sesi.status === "selesai") {
      throw new ApiError(409, "Sesi ini sudah selesai.");
    }

    const countResult = await client.query<{ jumlah: number }>(
      "SELECT count(*)::int AS jumlah FROM pemenang WHERE sesi_id = $1",
      [sesiId],
    );
    const jumlahPemenang = countResult.rows[0].jumlah;
    if (jumlahPemenang >= sesi.jumlah_pemenang) {
      await client.query(
        "UPDATE sesi_hadiah SET status = 'selesai' WHERE id = $1",
        [sesiId],
      );
      throw new ApiError(409, "Jumlah pemenang sesi ini sudah terpenuhi.");
    }

    const eligibleResult = await client.query<{ id: string }>(
      `SELECT p.id
       FROM peserta p
       WHERE NOT EXISTS (
         SELECT 1 FROM pemenang pm WHERE pm.peserta_id = p.id
       )
       ORDER BY p.id`,
    );
    if (eligibleResult.rows.length === 0) {
      throw new ApiError(
        409,
        "Tidak ada peserta yang masih memenuhi syarat untuk diundi.",
      );
    }

    const hadiahKe = jumlahPemenang + 1;
    const chosenId = pilihPesertaAcak(
      eligibleResult.rows.map((row) => row.id),
    );

    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO pemenang (sesi_id, peserta_id, hadiah_ke)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [sesiId, chosenId, hadiahKe],
    );

    await client.query(
      `UPDATE sesi_hadiah
       SET status = $2
       WHERE id = $1`,
      [sesiId, hadiahKe >= sesi.jumlah_pemenang ? "selesai" : "berjalan"],
    );

    return insertResult.rows[0].id;
  });

  const pemenang = await getPemenangById(pemenangId);
  if (!pemenang) {
    throw new ApiError(500, "Pemenang gagal dibaca setelah pengundian.");
  }
  return pemenang;
}

export async function getKandidatUndian(
  limit = 24,
): Promise<KandidatUndian[]> {
  const result = await query<{
    nomor_undian: string;
    nama: string;
    nama_sekolah: string;
  }>(
    `SELECT p.nomor_undian, p.nama, s.nama_sekolah
     FROM peserta p
     JOIN sekolah s ON s.id = p.sekolah_id
     WHERE NOT EXISTS (
       SELECT 1 FROM pemenang pm WHERE pm.peserta_id = p.id
     )
     ORDER BY random()
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 30)],
  );

  return result.rows.map((row) => ({
    nomorUndian: row.nomor_undian,
    nama: row.nama,
    sekolah: row.nama_sekolah,
  }));
}

/**
 * Menyisipkan pemenang ke daftar kandidat animasi pada posisi acak,
 * supaya nama pemenang ikut "berputar" sebelum reveal.
 */
export function sisipkanPemenangKeKandidat(
  kandidat: KandidatUndian[],
  pemenang: PemenangRecord,
): KandidatUndian[] {
  const daftar = [...kandidat];
  const posisi = randomInt(daftar.length + 1);
  daftar.splice(posisi, 0, {
    nomorUndian: pemenang.nomorUndian,
    nama: pemenang.nama,
    sekolah: pemenang.sekolah,
  });
  return daftar;
}

export async function getPemenangForExport(sesiIdInput: string): Promise<{
  sesi: SesiRingkas;
  pemenang: PemenangRecord[];
}> {
  const sesiId = validasiIdSesi(sesiIdInput);
  const result = await query<SesiDbRow>(
    `${SESI_SELECT}
     WHERE sh.id = $1
     ${SESI_GROUP}`,
    [sesiId],
  );
  const sesi = result.rows[0];
  if (!sesi) {
    throw new ApiError(404, "Sesi hadiah tidak ditemukan.");
  }

  return {
    sesi: mapSesi(sesi),
    pemenang: await getPemenangSesi(sesiId),
  };
}
