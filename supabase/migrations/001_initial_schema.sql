-- LIC Agent Management SaaS — initial schema
-- Run in Supabase SQL Editor or via supabase db push

-- ============================================================
-- USERS (profile linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT UNIQUE NOT NULL,
  full_name        TEXT NOT NULL,
  phone            TEXT,
  avatar_url       TEXT,
  super_admin      BOOLEAN DEFAULT FALSE,
  email_verified   BOOLEAN DEFAULT FALSE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  branch_code      TEXT,
  city             TEXT,
  state            TEXT,
  address          TEXT,
  phone            TEXT,
  email            TEXT,
  plan             TEXT DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','enterprise')),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','cancelled')),
  trial_ends_at    TIMESTAMPTZ,
  max_agents       INTEGER DEFAULT 50,
  billing_cycle    TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  display_name     TEXT,
  permissions      JSONB DEFAULT '{}',
  is_system_role   BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id          UUID REFERENCES public.roles(id),
  employee_id      TEXT,
  status           TEXT DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','removed')),
  invited_at       TIMESTAMPTZ DEFAULT NOW(),
  joined_at        TIMESTAMPTZ,
  suspended_at     TIMESTAMPTZ,
  suspended_reason TEXT,
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by       UUID NOT NULL REFERENCES public.users(id),
  role_id          UUID REFERENCES public.roles(id),
  email            TEXT NOT NULL,
  token            TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours',
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id         UUID REFERENCES public.users(id),
  tenant_id        UUID REFERENCES public.tenants(id),
  action           TEXT NOT NULL,
  resource_type    TEXT,
  resource_id      UUID,
  before_state     JSONB,
  after_state      JSONB,
  ip_address       TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON public.audit_logs(tenant_id, created_at DESC);

-- Business tables (minimal for Phase 2 stats)
CREATE TABLE IF NOT EXISTS public.customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assigned_agent_id   UUID NOT NULL REFERENCES public.users(id),
  customer_code       TEXT,
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.policies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES public.customers(id),
  agent_id             UUID NOT NULL REFERENCES public.users(id),
  policy_number        TEXT NOT NULL,
  plan_name            TEXT NOT NULL,
  policy_type          TEXT NOT NULL,
  sum_assured          NUMERIC(14,2) NOT NULL,
  premium_amount       NUMERIC(10,2) NOT NULL,
  premium_frequency    TEXT NOT NULL,
  commencement_date    DATE NOT NULL,
  status               TEXT DEFAULT 'in_force',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, policy_number)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_id            UUID NOT NULL REFERENCES public.policies(id),
  customer_id          UUID NOT NULL REFERENCES public.customers(id),
  recorded_by          UUID NOT NULL REFERENCES public.users(id),
  payment_date         DATE NOT NULL,
  due_date             DATE NOT NULL,
  amount_due           NUMERIC(10,2) NOT NULL,
  amount_paid          NUMERIC(10,2) NOT NULL,
  installment_number   INTEGER NOT NULL,
  status               TEXT NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id             UUID NOT NULL REFERENCES public.users(id),
  policy_id            UUID NOT NULL REFERENCES public.policies(id),
  commission_type      TEXT NOT NULL,
  premium_amount       NUMERIC(10,2) NOT NULL,
  commission_rate      NUMERIC(5,2) NOT NULL,
  commission_amount    NUMERIC(10,2) NOT NULL,
  gst_amount           NUMERIC(8,2) DEFAULT 0,
  net_commission       NUMERIC(10,2) NOT NULL,
  financial_year       TEXT NOT NULL,
  month                TEXT NOT NULL,
  status               TEXT DEFAULT 'pending',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.commission_rates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type          TEXT NOT NULL,
  commission_type      TEXT NOT NULL CHECK (commission_type IN ('first_year','renewal','bonus')),
  rate_percentage      NUMERIC(5,2) NOT NULL,
  effective_from       DATE NOT NULL DEFAULT '2024-04-01',
  effective_to         DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(policy_type, commission_type, effective_from)
);

INSERT INTO public.commission_rates (policy_type, commission_type, rate_percentage, effective_from) VALUES
  ('endowment', 'first_year', 35.00, '2024-04-01'),
  ('endowment', 'renewal', 7.50, '2024-04-01'),
  ('whole_life', 'first_year', 35.00, '2024-04-01'),
  ('whole_life', 'renewal', 5.00, '2024-04-01'),
  ('term', 'first_year', 35.00, '2024-04-01'),
  ('term', 'renewal', 5.00, '2024-04-01'),
  ('money_back', 'first_year', 35.00, '2024-04-01'),
  ('money_back', 'renewal', 7.50, '2024-04-01'),
  ('ulip', 'first_year', 15.00, '2024-04-01'),
  ('ulip', 'renewal', 7.50, '2024-04-01'),
  ('pension', 'first_year', 20.00, '2024-04-01'),
  ('pension', 'renewal', 5.00, '2024-04-01'),
  ('child', 'first_year', 35.00, '2024-04-01'),
  ('child', 'renewal', 7.50, '2024-04-01')
ON CONFLICT DO NOTHING;

-- Auth → profile sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'super_admin')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_read_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY commission_rates_read ON public.commission_rates
  FOR SELECT TO authenticated USING (true);

-- Service role used by API routes bypasses RLS
