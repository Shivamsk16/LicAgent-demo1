#!/usr/bin/env node
/**
 * Smoke-test all Vercel cron routes.
 * Usage: CRON_SECRET=xxx node scripts/test-crons.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

const base = process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("Set CRON_SECRET environment variable");
  process.exit(1);
}

const routes = [
  "/api/cron/check-trials",
  "/api/cron/check-grace",
  "/api/cron/check-lapse",
  "/api/cron/check-maturity",
  "/api/cron/revival-deadlines",
  "/api/cron/send-reminders",
  "/api/cron/escalate-overdue",
];

let failed = 0;

for (const path of routes) {
  const url = `${base.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    const status = res.ok ? "OK" : "FAIL";
    if (!res.ok) failed++;
    console.log(`${status} ${res.status} ${path}`);
    if (!res.ok) console.log("  ", body.slice(0, 200));
  } catch (e) {
    failed++;
    console.log(`FAIL ${path}`, e.message);
  }
}

process.exit(failed > 0 ? 1 : 0);
