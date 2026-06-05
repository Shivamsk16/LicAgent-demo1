-- Phase 4: reminders, grace periods, revivals, notifications

ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS revival_deadline DATE,
  ADD COLUMN IF NOT EXISTS lapsed_on DATE;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_revival_payment BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.policy_grace_periods (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_id            UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  missed_due_date      DATE NOT NULL,
  grace_start          DATE NOT NULL,
  grace_end            DATE NOT NULL,
  status               TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cured')),
  cured_on             DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.policy_revivals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_id            UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  requested_by         UUID NOT NULL REFERENCES public.users(id),
  revival_date         DATE NOT NULL,
  arrears_amount       NUMERIC(12,2) NOT NULL,
  interest_amount      NUMERIC(10,2) NOT NULL,
  penalty_amount       NUMERIC(10,2) DEFAULT 0,
  total_revival_cost   NUMERIC(12,2) NOT NULL,
  payment_mode         TEXT,
  receipt_number       TEXT,
  medical_required     BOOLEAN DEFAULT FALSE,
  medical_report_url   TEXT,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','completed','rejected')),
  approved_by          UUID REFERENCES public.users(id),
  approved_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS revival_id UUID REFERENCES public.policy_revivals(id);

CREATE TABLE IF NOT EXISTS public.premium_reminders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_id            UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id             UUID NOT NULL REFERENCES public.users(id),
  due_date             DATE NOT NULL,
  reminder_date        DATE NOT NULL,
  days_before_due      INTEGER NOT NULL,
  channel              TEXT[] NOT NULL,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','dismissed','skipped')),
  sent_at              TIMESTAMPTZ,
  error_message        TEXT,
  sms_message_id       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_send ON public.premium_reminders(reminder_date, status) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.notifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  title                TEXT NOT NULL,
  body                 TEXT,
  link                 TEXT,
  read                 BOOLEAN DEFAULT FALSE,
  read_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.premium_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_grace_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_revivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY reminders_tenant ON public.premium_reminders FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY notifications_own ON public.notifications FOR ALL USING (
  user_id = auth.uid()
);

CREATE POLICY grace_periods_tenant ON public.policy_grace_periods FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY revivals_tenant ON public.policy_revivals FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
