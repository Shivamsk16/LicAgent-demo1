-- Phase 7: RLS hardening + audit read for service patterns

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

-- Allow managers/senior agents to run imports (matches is_manager)
DROP POLICY IF EXISTS import_jobs_tenant ON public.import_jobs;
CREATE POLICY import_jobs_tenant ON public.import_jobs FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND public.is_manager(auth.uid(), tenant_id)
);

-- Super admins read all tenants (via service role in API; authenticated super_admin optional)
DROP POLICY IF EXISTS tenants_superadmin_read ON public.tenants;
CREATE POLICY tenants_superadmin_read ON public.tenants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND super_admin = true
  )
);

DROP POLICY IF EXISTS audit_logs_superadmin ON public.audit_logs;
CREATE POLICY audit_logs_superadmin ON public.audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND super_admin = true
  )
);
