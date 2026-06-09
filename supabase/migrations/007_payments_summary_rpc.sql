-- Aggregated payment totals for GET /api/payments summary.
-- PostgREST does not support .select('amount_paid.sum()'); use this RPC instead.

CREATE OR REPLACE FUNCTION public.get_payments_collected_summary(
  p_tenant_id UUID,
  p_recorded_by UUID DEFAULT NULL,
  p_is_manager BOOLEAN DEFAULT FALSE,
  p_agent_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_policy_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_paid NUMERIC,
  total_late_fee NUMERIC,
  payment_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(p.amount_paid), 0)::NUMERIC AS total_paid,
    COALESCE(SUM(COALESCE(p.late_fee, 0)), 0)::NUMERIC AS total_late_fee,
    COUNT(*)::BIGINT AS payment_count
  FROM public.payments p
  WHERE p.tenant_id = p_tenant_id
    AND p.status = CASE
      WHEN p_status IS NOT NULL AND p_status <> 'all' THEN p_status
      ELSE 'paid'
    END
    AND (
      CASE
        WHEN NOT p_is_manager THEN p.recorded_by = p_recorded_by
        WHEN p_agent_id IS NOT NULL THEN p.recorded_by = p_agent_id
        ELSE TRUE
      END
    )
    AND (p_from IS NULL OR p.payment_date >= p_from)
    AND (p_to IS NULL OR p.payment_date <= p_to)
    AND (p_customer_id IS NULL OR p.customer_id = p_customer_id)
    AND (p_policy_id IS NULL OR p.policy_id = p_policy_id)
    AND (
      p_search IS NULL
      OR btrim(p_search) = ''
      OR p.receipt_number ILIKE '%' || p_search || '%'
    );
$$;

REVOKE ALL ON FUNCTION public.get_payments_collected_summary(
  UUID, UUID, BOOLEAN, UUID, TEXT, DATE, DATE, UUID, UUID, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_payments_collected_summary(
  UUID, UUID, BOOLEAN, UUID, TEXT, DATE, DATE, UUID, UUID, TEXT
) TO service_role;

-- Refresh PostgREST schema cache so the RPC is immediately callable
NOTIFY pgrst, 'reload schema';
