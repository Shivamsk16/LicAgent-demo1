/**
 * Verifies get_payments_collected_summary exists and is callable.
 * Usage: node scripts/verify-payments-rpc.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc("get_payments_collected_summary", {
  p_tenant_id: "00000000-0000-0000-0000-000000000000",
  p_recorded_by: null,
  p_is_manager: true,
  p_agent_id: null,
  p_status: null,
  p_from: null,
  p_to: null,
  p_customer_id: null,
  p_policy_id: null,
  p_search: null,
});

if (error) {
  console.error("RPC error:", error.message);
  process.exit(1);
}

const row = Array.isArray(data) ? data[0] : data;
console.log("RPC OK:", row);
