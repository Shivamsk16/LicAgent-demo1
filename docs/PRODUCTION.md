# Production deployment guide

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview).

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only, never expose to client) |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://your-domain.com` (no trailing slash) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name |
| `CRON_SECRET` | Yes | Long random string; Vercel Cron sends `Authorization: Bearer <value>` |
| `RESEND_API_KEY` | Yes* | Email invitations & alerts |
| `RESEND_FROM_EMAIL` | Yes* | Verified sender domain |
| `RESEND_FROM_NAME` | No | Default: LIC Agent Management |
| `MSG91_AUTH_KEY` | No | SMS reminders |
| `MSG91_SENDER_ID` | No | DLT sender ID |
| `MSG91_DEFAULT_TEMPLATE_ID` | No | Default MSG91 template |
| `SUPABASE_STORAGE_BUCKET_KYC` | No | Default: `kyc-documents` |

\*Required for invite emails and automation emails.

## Database migrations

Run in order in **Supabase SQL Editor**:

1. `001_initial_schema.sql`
2. `002_phase3_columns.sql`
3. `003_phase4_automation.sql`
4. `004_phase5_commissions.sql`
5. `005_phase6_advanced.sql`
6. `006_phase7_rls_hardening.sql`

## Supabase checklist

- [ ] **Auth**: Email provider enabled; Site URL = `NEXT_PUBLIC_APP_URL`
- [ ] **Redirect URLs** (Supabase → Authentication → URL Configuration):
  - `http://localhost:3000/**` (dev)
  - `https://your-domain.com/**` (prod)
  - Explicit: `/invite/complete`, `/auth/callback`, `/login`, `/invite/*`
- [ ] **Storage**: Private bucket `kyc-documents` (or your `SUPABASE_STORAGE_BUCKET_KYC`)
- [ ] **Realtime**: Enable replication for `notifications` (optional, for live bell)
- [ ] **RLS**: All tables use RLS; API routes use service role where needed
- [ ] **SuperAdmin**: `UPDATE users SET super_admin = true WHERE email = '...'`

## Vercel deployment

1. Connect Git repo; set **Root Directory** to `app` if monorepo.
2. Framework: Next.js (auto-detected).
3. Add all env vars above.
4. Deploy. `vercel.json` cron schedules run on Production only (Hobby: limited cron).

### Custom domain

Vercel → Domains → add domain → update DNS → set `NEXT_PUBLIC_APP_URL` to HTTPS URL → redeploy.

## Health check

After deploy:

```bash
curl https://your-domain.com/api/health
```

Expect `{ "status": "ok", ... }` when Supabase env is set.

## Cron smoke test

```bash
cd app
CRON_SECRET=your-secret node scripts/test-crons.mjs https://your-domain.com
```

PowerShell:

```powershell
$env:CRON_SECRET="your-secret"
.\scripts\test-crons.ps1 -BaseUrl "https://your-domain.com"
```

## Security audit (manual)

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client bundles
- [ ] `CRON_SECRET` not in `NEXT_PUBLIC_*`
- [ ] SuperAdmin routes guarded in middleware + API
- [ ] Tenant isolation: all dashboard APIs use `getDashboardContext()` + `tenant_id` filters
- [ ] KYC files served via signed URLs only (1h expiry)
- [ ] File uploads: type + size validated server-side

## Performance (large tenants)

Recommend indexes (included in migrations). For 1000+ customers per branch:

- Use list pagination (future enhancement)
- Run reports with narrow date ranges
- Monitor Supabase query performance in Dashboard → Reports

## Post-deploy smoke test

1. Login as SuperAdmin → `/superadmin`
2. Provision test branch → manager invite email
3. Login as manager → add customer, policy, record payment
4. Check commission row + notification bell
5. Trigger one cron manually via curl
6. Upload KYC doc → verify as manager
