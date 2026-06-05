-- Phase 3: expand business tables for agent dashboard

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS annual_income NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_last4 TEXT,
  ADD COLUMN IF NOT EXISTS nominee_name TEXT,
  ADD COLUMN IF NOT EXISTS nominee_relation TEXT,
  ADD COLUMN IF NOT EXISTS nominee_dob DATE,
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS plan_code TEXT,
  ADD COLUMN IF NOT EXISTS premium_term_years INTEGER,
  ADD COLUMN IF NOT EXISTS policy_term_years INTEGER,
  ADD COLUMN IF NOT EXISTS maturity_date DATE,
  ADD COLUMN IF NOT EXISTS last_premium_date DATE,
  ADD COLUMN IF NOT EXISTS next_premium_due DATE,
  ADD COLUMN IF NOT EXISTS grace_period_end DATE,
  ADD COLUMN IF NOT EXISTS lapsed_on DATE,
  ADD COLUMN IF NOT EXISTS mode_of_payment TEXT,
  ADD COLUMN IF NOT EXISTS rider_details JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS branch_office TEXT,
  ADD COLUMN IF NOT EXISTS division_code TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS late_fee NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS financial_year TEXT,
  ADD COLUMN IF NOT EXISTS payment_year INTEGER,
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS is_revival_payment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_due ON public.policies(tenant_id, next_premium_due) WHERE status = 'in_force';
CREATE INDEX IF NOT EXISTS idx_payments_policy ON public.payments(policy_id, payment_date DESC);

-- RLS helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT AS $$
  SELECT r.name FROM public.roles r
  JOIN public.tenant_members tm ON tm.role_id = r.id
  WHERE tm.user_id = p_user_id
    AND tm.tenant_id = p_tenant_id
    AND tm.status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    JOIN public.roles r ON r.id = tm.role_id
    WHERE tm.user_id = p_user_id
      AND tm.tenant_id = p_tenant_id
      AND tm.status = 'active'
      AND r.name IN ('branch_manager', 'senior_agent')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_select ON public.customers;
CREATE POLICY customers_select ON public.customers FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND (
    assigned_agent_id = auth.uid()
    OR public.is_manager(auth.uid(), tenant_id)
  )
);

DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert ON public.customers FOR INSERT WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update ON public.customers FOR UPDATE USING (
  assigned_agent_id = auth.uid()
  OR public.is_manager(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS policies_tenant ON public.policies;
CREATE POLICY policies_tenant ON public.policies FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND (
    agent_id = auth.uid()
    OR public.is_manager(auth.uid(), tenant_id)
  )
);

DROP POLICY IF EXISTS payments_tenant ON public.payments;
CREATE POLICY payments_tenant ON public.payments FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY IF EXISTS tenant_members_read ON public.tenant_members;
CREATE POLICY tenant_members_read ON public.tenant_members FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members tm2
    WHERE tm2.user_id = auth.uid() AND tm2.status = 'active'
  )
);

DROP POLICY IF EXISTS tenants_member_read ON public.tenants;
CREATE POLICY tenants_member_read ON public.tenants FOR SELECT USING (
  id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
