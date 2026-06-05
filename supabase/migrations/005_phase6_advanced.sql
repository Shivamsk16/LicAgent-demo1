-- Phase 6: KYC documents, bulk import jobs, imported flag

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS imported BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  doc_type             TEXT NOT NULL CHECK (doc_type IN (
    'aadhaar_front','aadhaar_back','pan','passport',
    'voter_id','driving_license','photo','other'
  )),
  file_name            TEXT NOT NULL,
  file_url             TEXT NOT NULL,
  file_size_kb         INTEGER,
  uploaded_by          UUID REFERENCES public.users(id),
  verified             BOOLEAN DEFAULT FALSE,
  verified_by          UUID REFERENCES public.users(id),
  verified_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_customer ON public.kyc_documents(customer_id);

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  uploaded_by          UUID NOT NULL REFERENCES public.users(id),
  file_name            TEXT NOT NULL,
  import_type          TEXT NOT NULL CHECK (import_type IN ('customers','policies','payments')),
  status               TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','processing','completed','failed','partial'
  )),
  total_rows           INTEGER DEFAULT 0,
  processed_rows       INTEGER DEFAULT 0,
  success_rows         INTEGER DEFAULT 0,
  failed_rows          INTEGER DEFAULT 0,
  error_details        JSONB DEFAULT '[]',
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant ON public.import_jobs(tenant_id, created_at DESC);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kyc_documents_tenant ON public.kyc_documents;
CREATE POLICY kyc_documents_tenant ON public.kyc_documents FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

DROP POLICY IF EXISTS import_jobs_tenant ON public.import_jobs;
CREATE POLICY import_jobs_tenant ON public.import_jobs FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND public.is_manager(auth.uid(), tenant_id)
);

DROP POLICY IF EXISTS audit_logs_branch ON public.audit_logs;
CREATE POLICY audit_logs_branch ON public.audit_logs FOR SELECT USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
  AND public.is_manager(auth.uid(), tenant_id)
);
