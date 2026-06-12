-- Idempotent customer creation via X-Submission-Id header
CREATE TABLE IF NOT EXISTS public.customer_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id  TEXT NOT NULL,
  customer_id    UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_submissions_created
  ON public.customer_submissions (created_at);
