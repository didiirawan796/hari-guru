import path from "node:path";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { closePool, getPool } from "../src/index.js";

config({ path: path.resolve(process.cwd(), "../../.env") });
config({ path: path.resolve(process.cwd(), ".env") });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} wajib diatur untuk seed.`);
  }
  return value;
}

function password(name: string): string {
  const value = required(name);
  if (value.length < 8) {
    throw new Error(`${name} minimal 8 karakter.`);
  }
  return value;
}

async function upsertAdmin(
  username: string,
  plainPassword: string,
  role: "admin" | "operator",
): Promise<void> {
  const hash = await bcrypt.hash(plainPassword, 12);
  await getPool().query(
    `INSERT INTO admin_kecamatan (username, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
    [username.toLowerCase(), hash, role],
  );
  console.log(`Akun ${role} siap: ${username.toLowerCase()}`);
}

async function main(): Promise<void> {
  await upsertAdmin(
    required("ADMIN_USERNAME"),
    password("ADMIN_PASSWORD"),
    "admin",
  );
  await upsertAdmin(
    required("OPERATOR_USERNAME"),
    password("OPERATOR_PASSWORD"),
    "operator",
  );

  const schoolUsername = process.env.SEED_SCHOOL_USERNAME?.trim();
  if (schoolUsername) {
    const schoolPassword = password("SEED_SCHOOL_PASSWORD");
    const schoolName =
      process.env.SEED_SCHOOL_NAMA?.trim() || "Sekolah Contoh";
    const hash = await bcrypt.hash(schoolPassword, 12);

    await getPool().query(
      `INSERT INTO sekolah (nama_sekolah, username, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (username)
       DO UPDATE SET nama_sekolah = EXCLUDED.nama_sekolah,
                     password_hash = EXCLUDED.password_hash`,
      [schoolName, schoolUsername.toLowerCase(), hash],
    );
    console.log(`Akun sekolah siap: ${schoolUsername.toLowerCase()}`);
  }

  await closePool();
}

main().catch(async (error) => {
  console.error("Seed gagal:", error);
  await closePool();
  process.exit(1);
});
