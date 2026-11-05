import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const migrationDir = fileURLToPath(new URL("../migrations/", import.meta.url));
const migrationFiles = ["001_init.sql", "002_sekolah_nama_unik.sql"];

async function expectQueryToFail(
  db: PGlite,
  sql: string,
  values: unknown[] = [],
): Promise<void> {
  let failed = false;
  try {
    await db.query(sql, values);
  } catch {
    failed = true;
  }
  assert.equal(failed, true, `Query seharusnya gagal: ${sql}`);
}

async function main(): Promise<void> {
  const db = new PGlite();
  for (const file of migrationFiles) {
    const sql = await readFile(`${migrationDir}${file}`, "utf8");
    await db.exec(sql);
  }
  console.log("✓ Migrasi berhasil dijalankan pada PostgreSQL (PGlite)");

  const admin = await db.query<{ id: string; role: string }>(
    `INSERT INTO admin_kecamatan (username, password_hash, role)
     VALUES ('operator', 'hash', 'operator') RETURNING id, role`,
  );
  assert.equal(admin.rows[0].role, "operator");

  const school = await db.query<{ id: string }>(
    `INSERT INTO sekolah (nama_sekolah, username, password_hash)
     VALUES ('SD Negeri 1', 'sdn-1', 'hash') RETURNING id`,
  );
  const schoolId = school.rows[0].id;

  await expectQueryToFail(
    db,
    `INSERT INTO sekolah (nama_sekolah, username, password_hash)
     VALUES ('  sd   negeri   1 ', 'sdn-1-lain', 'hash')`,
  );
  console.log("✓ Nama sekolah duplikat ditolak (abaikan kapital & spasi)");

  const peserta = await db.query<{ id: string }>(
    `INSERT INTO peserta (sekolah_id, nama, peran, nomor_undian)
     VALUES ($1, 'Budi', 'guru', 'KEC-0001') RETURNING id`,
    [schoolId],
  );
  const pesertaId = peserta.rows[0].id;
  console.log("✓ Tabel sekolah, peserta, dan operator dapat diisi");

  await expectQueryToFail(
    db,
    `INSERT INTO peserta (sekolah_id, nama, peran, nomor_undian)
     VALUES ($1, 'Siti', 'guru', 'NOMOR-SALAH')`,
    [schoolId],
  );
  console.log("✓ Format nomor undian divalidasi database");

  const sesi = await db.query<{ id: string }>(
    `INSERT INTO sesi_hadiah (nama_hadiah, urutan, jumlah_pemenang)
     VALUES ('Sepeda Listrik', 1, 1) RETURNING id`,
  );
  const sesiId = sesi.rows[0].id;

  await db.query(
    `INSERT INTO pemenang (sesi_id, peserta_id, hadiah_ke)
     VALUES ($1, $2, 1)`,
    [sesiId, pesertaId],
  );
  await expectQueryToFail(
    db,
    `INSERT INTO pemenang (sesi_id, peserta_id, hadiah_ke)
     VALUES ($1, $2, 2)`,
    [sesiId, pesertaId],
  );
  console.log("✓ Anti-double-win ditegakkan oleh constraint database");

  const seq = await db.query<{ nomor: string }>(
    `SELECT nextval('nomor_undian_seq')::text AS nomor`,
  );
  assert.equal(seq.rows[0].nomor, "1");
  console.log("✓ Sequence nomor undian tersedia");

  await db.close();
  console.log("\nSemua pemeriksaan skema lulus.");
}

main().catch((error) => {
  console.error("Pemeriksaan skema gagal:", error);
  process.exit(1);
});
