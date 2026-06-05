# LIC Agent Management SaaS

Next.js 14 · Supabase · Tailwind CSS

**Production:** [docs/PRODUCTION.md](docs/PRODUCTION.md) · Health: `/api/health` · Crons: `npm run test:crons`

## Phase 6 — Advanced features (implemented)

- `/dashboard/import` — CSV bulk import (customers, policies, payments) with templates + preview
- `/dashboard/team` — invite agents, change roles, suspend/reactivate (branch manager)
- `/dashboard/audit` — branch audit log with filters + CSV export
- Customer **KYC** tab — upload JPG/PNG/PDF, manager verify/reject
- Notification bell — Supabase Realtime + 30s polling fallback

Run `005_phase6_advanced.sql`. Create Storage bucket `kyc-documents` (private) in Supabase. Enable Realtime on `notifications` table.

## Phase 5 — Commission & Reports (implemented)

- `/dashboard/commission` — earnings summary, filters, charts (manager), CSV + print/PDF
- `/dashboard/reports` — reports hub (manager + senior agent)
- 10 report types with Recharts visualizations
- `GET /api/commissions`, `GET /api/reports/[type]`, CSV export routes
- Run `004_phase5_commissions.sql` after prior migrations

## Phase 4 — Automation (implemented)

- Reminder generation on policy create + payment (30/7/1 day schedule)
- `/dashboard/reminders` list + calendar views
- Cron jobs: grace, lapse, maturity, send-reminders, escalate-overdue, revival-deadlines, check-trials
- Policy grace → lapse state machine with notifications + email + SMS
- Revival initiate + manager approval flow
- In-app notification bell
- MSG91 SMS + Resend email integrations

Run `003_phase4_automation.sql` after prior migrations. Set `CRON_SECRET` in `.env.local`.

Test cron locally:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-reminders
```

## Phase 3 — Agent dashboard (implemented)

- Dashboard layout with branch switcher
- Home: stats, due this week, recent payments
- Customers: list, 3-step add, 360 view (tabs), edit
- Policies: list, 4-step add, detail + premium timeline, mark lapsed
- Payments: record form (auto-suggest installment), ledger, receipt
- Commission auto-calculated on payment (DB trigger via app logic)

Run migration `002_phase3_columns.sql` after `001_initial_schema.sql`.

## Phase 2 — SuperAdmin (implemented)

- SuperAdmin layout (sidebar + topbar)
- Platform overview with stats, charts, trial alerts
- Branch list with filters + suspend/reactivate
- Provision new branch (roles seeding + manager invitation)
- Branch detail: overview, members, audit, settings
- Commission rate editor
- Global audit log

## Setup

1. Copy `.env.local.example` → `.env.local` and fill Supabase + Resend keys.

2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

3. Create a SuperAdmin user in Supabase Auth, then:

```sql
UPDATE public.users SET super_admin = true WHERE email = 'your@email.com';
```

4. Start the app:

```bash
npm run dev
```

5. Sign in at `/login` → redirected to `/superadmin`.

## Routes

| Route | Description |
|---|---|
| `/superadmin` | Platform overview |
| `/superadmin/tenants` | All branches |
| `/superadmin/tenants/new` | Provision branch |
| `/superadmin/tenants/[id]` | Branch overview |
| `/superadmin/tenants/[id]/members` | Members |
| `/superadmin/tenants/[id]/audit` | Branch audit |
| `/superadmin/tenants/[id]/settings` | Branch settings |
| `/superadmin/commission-rates` | Commission rates |
| `/superadmin/audit` | Global audit |

## Dashboard routes (Phase 5)

| Route | Description |
|---|---|
| `/dashboard/commission` | Commission earnings |
| `/dashboard/reports` | Reports hub |
| `/dashboard/reports/[type]` | Individual report |

## Phase 6 routes

| Route | Access |
|---|---|
| `/dashboard/import` | Manager, senior agent |
| `/dashboard/team` | Branch manager |
| `/dashboard/audit` | Branch manager |

## Phase 7 — Polish & production (implemented)

- Loading **skeletons** on all major list/detail/report views
- **Empty states** with icons on customers, policies, payments, reminders, commission, team, audit, tenants
- **Error boundaries** (`app/error.tsx`, `app/dashboard/error.tsx`)
- **`GET /api/health`** — deployment health check
- **`docs/PRODUCTION.md`** — env vars, Vercel, Supabase, security checklist
- **`npm run test:crons`** — smoke-test all cron routes
- Migration **`006_phase7_rls_hardening.sql`** — commissions + superadmin RLS
- Mobile: reduced padding on small screens, touch-friendly targets

Run `006_phase7_rls_hardening.sql` after prior migrations.

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for deploy steps.

## Invitation flow

After provisioning a branch or inviting staff, users may receive:

1. **Supabase invite email** → redirects to `/invite/complete#access_token=...` (set password + activate)
2. **Branded Resend email** → link to `/invite/[token]` (create password + accept)

Configure Supabase **Redirect URLs** to include `http://localhost:3000/invite/complete` and `/auth/callback`.
