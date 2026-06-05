-- Phase 5: commission columns + RLS

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS policy_type TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_payment
  ON public.commissions(payment_id)
  WHERE payment_id IS NOT NULL;

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commissions_select ON public.commissions;
CREATE POLICY commissions_select ON public.commissions FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND (
    agent_id = auth.uid()
    OR public.is_manager(auth.uid(), tenant_id)
  )
);
