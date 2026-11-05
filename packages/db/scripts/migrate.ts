import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { closePool, getPool } from "../src/index.js";

config({ path: path.resolve(process.cwd(), "../../.env") });
config({ path: path.resolve(process.cwd(), ".env") });

const migrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

async function main(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nama_file text PRIMARY KEY,
        diterapkan_pada timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE nama_file = $1",
        [file],
      );
      if (alreadyApplied.rowCount) {
        console.log(`Lewati (sudah ada): ${file}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (nama_file) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`Diterapkan: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error("Migrasi gagal:", error);
  process.exit(1);
});
