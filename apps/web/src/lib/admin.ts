import bcrypt from "bcryptjs";
import { query } from "./db";
import { ApiError } from "./api";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,49}$/;

/**
 * Merapikan nama sekolah: membuang spasi tepi dan menggabungkan spasi ganda.
 * Perbandingan duplikat juga mengabaikan huruf besar/kecil.
 */
export function normalisasiNamaSekolah(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function kunciNamaSekolah(value: string): string {
  return normalisasiNamaSekolah(value).toLowerCase();
}

function isUniqueViolation(error: unknown): error is {
  code: string;
  constraint?: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export interface RingkasanAdmin {
  sekolah: number;
  peserta: number;
  sesi: number;
  pemenang: number;
}

export interface SekolahAdminRow {
  id: string;
  namaSekolah: string;
  username: string;
  totalPeserta: number;
  totalKepsek: number;
  totalGuru: number;
  createdAt: string;
}

export interface PesertaAdminRow {
  id: string;
  nomorUndian: string;
  nama: string;
  peran: "kepsek" | "guru";
  sekolah: string;
}

export interface SesiAdminRow {
  id: string;
  namaHadiah: string;
  urutan: number;
  jumlahPemenang: number;
  status: "belum" | "berjalan" | "selesai";
  totalPemenang: number;
}

export interface AdminDashboardData {
  ringkasan: RingkasanAdmin;
  sekolah: SekolahAdminRow[];
  pesertaTerpilih: PesertaAdminRow[];
  sekolahTerpilih: SekolahAdminRow | null;
  sesi: SesiAdminRow[];
}

interface SekolahDbRow {
  id: string;
  nama_sekolah: string;
  username: string;
  total_peserta: number;
  total_kepsek: number;
  total_guru: number;
  created_at: Date;
}

interface PesertaDbRow {
  id: string;
  nomor_undian: string;
  nama: string;
  peran: "kepsek" | "guru";
  nama_sekolah: string;
}

interface SesiDbRow {
  id: string;
  nama_hadiah: string;
  urutan: number;
  jumlah_pemenang: number;
  status: "belum" | "berjalan" | "selesai";
  total_pemenang: number;
}

function mapSekolah(row: SekolahDbRow): SekolahAdminRow {
  return {
    id: row.id,
    namaSekolah: row.nama_sekolah,
    username: row.username,
    totalPeserta: row.total_peserta,
    totalKepsek: row.total_kepsek,
    totalGuru: row.total_guru,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getAdminDashboard(
  sekolahId?: string,
): Promise<AdminDashboardData> {
  const validSelectedId =
    sekolahId && UUID_PATTERN.test(sekolahId) ? sekolahId : undefined;

  const ringkasanResult = await query<{
    sekolah: number;
    peserta: number;
    sesi: number;
    pemenang: number;
  }>(`SELECT
      (SELECT count(*)::int FROM sekolah) AS sekolah,
      (SELECT count(*)::int FROM peserta) AS peserta,
      (SELECT count(*)::int FROM sesi_hadiah) AS sesi,
      (SELECT count(*)::int FROM pemenang) AS pemenang`);

  const sekolahResult = await query<SekolahDbRow>(`
    SELECT s.id, s.nama_sekolah, s.username, s.created_at,
      count(p.id)::int AS total_peserta,
      count(p.id) FILTER (WHERE p.peran = 'kepsek')::int AS total_kepsek,
      count(p.id) FILTER (WHERE p.peran = 'guru')::int AS total_guru
    FROM sekolah s
    LEFT JOIN peserta p ON p.sekolah_id = s.id
    GROUP BY s.id
    ORDER BY s.nama_sekolah
  `);

  const pesertaResult = validSelectedId
    ? await query<PesertaDbRow>(
        `SELECT p.id, p.nomor_undian, p.nama, p.peran, s.nama_sekolah
         FROM peserta p
         JOIN sekolah s ON s.id = p.sekolah_id
         WHERE p.sekolah_id = $1
         ORDER BY split_part(p.nomor_undian, '-', 2)::int`,
        [validSelectedId],
      )
    : { rows: [] as PesertaDbRow[] };

  const sesiResult = await query<SesiDbRow>(`
    SELECT sh.id, sh.nama_hadiah, sh.urutan, sh.jumlah_pemenang, sh.status,
      count(pm.id)::int AS total_pemenang
    FROM sesi_hadiah sh
    LEFT JOIN pemenang pm ON pm.sesi_id = sh.id
    GROUP BY sh.id
    ORDER BY sh.urutan
  `);

  const sekolah = sekolahResult.rows.map(mapSekolah);

  return {
    ringkasan: ringkasanResult.rows[0],
    sekolah,
    pesertaTerpilih: pesertaResult.rows.map((row) => ({
      id: row.id,
      nomorUndian: row.nomor_undian,
      nama: row.nama,
      peran: row.peran,
      sekolah: row.nama_sekolah,
    })),
    sekolahTerpilih:
      sekolah.find((item) => item.id === validSelectedId) ?? null,
    sesi: sesiResult.rows.map((row) => ({
      id: row.id,
      namaHadiah: row.nama_hadiah,
      urutan: row.urutan,
      jumlahPemenang: row.jumlah_pemenang,
      status: row.status,
      totalPemenang: row.total_pemenang,
    })),
  };
}

export async function createSekolah(input: {
  namaSekolah?: unknown;
  username?: unknown;
  password?: unknown;
}): Promise<string> {
  const namaSekolah =
    typeof input.namaSekolah === "string"
      ? normalisasiNamaSekolah(input.namaSekolah)
      : "";
  const username =
    typeof input.username === "string"
      ? input.username.trim().toLowerCase()
      : "";
  const password =
    typeof input.password === "string" ? input.password : "";

  if (!namaSekolah) {
    throw new ApiError(400, "Nama sekolah wajib diisi.");
  }
  if (namaSekolah.length > 160) {
    throw new ApiError(400, "Nama sekolah maksimal 160 karakter.");
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new ApiError(
      400,
      "Username harus 3-50 karakter, huruf kecil/angka/titik/strip, diawali huruf atau angka.",
    );
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password minimal 8 karakter.");
  }
  if (password.length > 72) {
    throw new ApiError(400, "Password maksimal 72 karakter.");
  }

  const duplikat = await query<{ id: string }>(
    `SELECT id
     FROM sekolah
     WHERE lower(regexp_replace(btrim(nama_sekolah), '[[:space:]]+', ' ', 'g')) = $1
     LIMIT 1`,
    [kunciNamaSekolah(namaSekolah)],
  );
  if (duplikat.rowCount) {
    throw new ApiError(
      409,
      "Nama sekolah sudah terdaftar. Gunakan nama resmi sekolah Anda atau hubungi panitia.",
    );
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO sekolah (nama_sekolah, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [namaSekolah, username, hash],
    );
    return result.rows[0].id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (error.constraint === "sekolah_nama_normal_unik") {
        throw new ApiError(
          409,
          "Nama sekolah sudah terdaftar. Gunakan nama resmi sekolah Anda atau hubungi panitia.",
        );
      }
      throw new ApiError(409, "Username sekolah sudah digunakan.");
    }
    throw error;
  }
}

export async function resetPasswordSekolah(
  id: string,
  passwordInput: unknown,
): Promise<void> {
  if (!UUID_PATTERN.test(id)) {
    throw new ApiError(400, "ID sekolah tidak valid.");
  }

  const password =
    typeof passwordInput === "string" ? passwordInput : "";
  if (password.length < 8) {
    throw new ApiError(400, "Password baru minimal 8 karakter.");
  }
  if (password.length > 72) {
    throw new ApiError(400, "Password baru maksimal 72 karakter.");
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `UPDATE sekolah
     SET password_hash = $2
     WHERE id = $1
     RETURNING id`,
    [id, hash],
  );

  if (!result.rowCount) {
    throw new ApiError(404, "Akun sekolah tidak ditemukan.");
  }
}

export async function createSesi(input: {
  namaHadiah?: unknown;
  urutan?: unknown;
  jumlahPemenang?: unknown;
}): Promise<string> {
  const namaHadiah =
    typeof input.namaHadiah === "string" ? input.namaHadiah.trim() : "";
  const urutan = Number(input.urutan);
  const jumlahPemenang = Number(input.jumlahPemenang);

  if (!namaHadiah) {
    throw new ApiError(400, "Nama hadiah wajib diisi.");
  }
  if (namaHadiah.length > 120) {
    throw new ApiError(400, "Nama hadiah maksimal 120 karakter.");
  }
  if (!Number.isInteger(urutan) || urutan < 1) {
    throw new ApiError(400, "Urutan sesi harus bilangan bulat minimal 1.");
  }
  if (!Number.isInteger(jumlahPemenang) || jumlahPemenang < 1) {
    throw new ApiError(400, "Jumlah pemenang minimal 1.");
  }
  if (jumlahPemenang > 100) {
    throw new ApiError(400, "Jumlah pemenang maksimal 100 per sesi.");
  }

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO sesi_hadiah (nama_hadiah, urutan, jumlah_pemenang)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [namaHadiah, urutan, jumlahPemenang],
    );
    return result.rows[0].id;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ApiError(409, "Urutan sesi sudah digunakan.");
    }
    throw error;
  }
}

export async function deleteSesi(id: string): Promise<void> {
  if (!UUID_PATTERN.test(id)) {
    throw new ApiError(400, "ID sesi tidak valid.");
  }

  const result = await query(
    `DELETE FROM sesi_hadiah sh
     WHERE sh.id = $1
       AND sh.status <> 'berjalan'
       AND NOT EXISTS (SELECT 1 FROM pemenang pm WHERE pm.sesi_id = sh.id)
     RETURNING sh.id`,
    [id],
  );

  if (!result.rowCount) {
    throw new ApiError(
      409,
      "Sesi tidak dapat dihapus karena sedang berjalan atau sudah memiliki pemenang.",
    );
  }
}

export async function getPesertaForExport(
  sekolahId?: string,
): Promise<PesertaAdminRow[]> {
  const validSelectedId =
    sekolahId && UUID_PATTERN.test(sekolahId) ? sekolahId : undefined;
  const result = await query<PesertaDbRow>(
    `SELECT p.id, p.nomor_undian, p.nama, p.peran, s.nama_sekolah
     FROM peserta p
     JOIN sekolah s ON s.id = p.sekolah_id
     ${validSelectedId ? "WHERE p.sekolah_id = $1" : ""}
     ORDER BY s.nama_sekolah, split_part(p.nomor_undian, '-', 2)::int`,
    validSelectedId ? [validSelectedId] : [],
  );

  return result.rows.map((row) => ({
    id: row.id,
    nomorUndian: row.nomor_undian,
    nama: row.nama,
    peran: row.peran,
    sekolah: row.nama_sekolah,
  }));
}
