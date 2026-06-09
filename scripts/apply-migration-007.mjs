/**
 * Applies 007_payments_summary_rpc.sql to the linked Supabase project.
 * Requires DATABASE_URL or SUPABASE_DB_URL in .env.local (Direct connection string).
 *
 * Usage: node scripts/apply-migration-007.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const migrationPath = resolve(
  root,
  "supabase/migrations/007_payments_summary_rpc.sql"
);

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

const env = loadEnv();
const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_URL in .env.local.\n" +
      "Add your Supabase direct Postgres connection string, then re-run:\n" +
      "  node scripts/apply-migration-007.mjs\n\n" +
      "Or paste supabase/migrations/007_payments_summary_rpc.sql into the Supabase SQL editor."
  );
  process.exit(1);
}

const sql = readFileSync(migrationPath, "utf8");

try {
  execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -c "${sql.replace(/"/g, '\\"')}"`, {
    stdio: "inherit",
    shell: true,
  });
  console.log("Migration 007 applied successfully.");
} catch {
  console.error(
    "psql failed. Install PostgreSQL client tools or run the SQL manually in Supabase Dashboard → SQL editor."
  );
  process.exit(1);
}
