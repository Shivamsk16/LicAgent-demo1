import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api/response";

import type { SearchResult } from "@/lib/api/search-types";

export async function GET(request: Request) {
  const { error, ctx } = await getDashboardContext();
  if (!ctx) return apiError(error ?? "UNAUTHORIZED", "Not signed in", 401);

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess({ results: [] as SearchResult[] });
  }

  const admin = createAdminClient();
  const [customersRes, policiesRes, paymentsRes] = await Promise.all([
    (() => {
      let query = admin
        .from("customers")
        .select("id, full_name, phone, customer_code")
        .eq("tenant_id", ctx.tenantId)
        .or(
          `full_name.ilike.%${q}%,phone.ilike.%${q}%,customer_code.ilike.%${q}%,email.ilike.%${q}%`
        )
        .limit(6);
      if (!ctx.isManager) query = query.eq("assigned_agent_id", ctx.userId);
      return query;
    })(),
    (() => {
      let query = admin
        .from("policies")
        .select("id, policy_number, plan_name, customer:customers(full_name)")
        .eq("tenant_id", ctx.tenantId)
        .or(`policy_number.ilike.%${q}%,plan_name.ilike.%${q}%`)
        .limit(6);
      if (!ctx.isManager) query = query.eq("agent_id", ctx.userId);
      return query;
    })(),
    (() => {
      let query = admin
        .from("payments")
        .select(
          `id, receipt_number, amount_paid, payment_date,
           customer:customers(full_name),
           policy:policies(policy_number)`
        )
        .eq("tenant_id", ctx.tenantId)
        .ilike("receipt_number", `%${q}%`)
        .limit(6);
      if (!ctx.isManager) query = query.eq("recorded_by", ctx.userId);
      return query;
    })(),
  ]);

  const results: SearchResult[] = [];

  for (const c of customersRes.data ?? []) {
    results.push({
      id: c.id,
      type: "customer",
      label: c.full_name as string,
      sublabel: [c.customer_code, c.phone].filter(Boolean).join(" · ") || undefined,
      href: `/dashboard/customers/${c.id}`,
    });
  }

  for (const p of policiesRes.data ?? []) {
    const customer = p.customer as { full_name: string } | { full_name: string }[] | null;
    const customerName = Array.isArray(customer) ? customer[0]?.full_name : customer?.full_name;
    results.push({
      id: p.id as string,
      type: "policy",
      label: p.policy_number as string,
      sublabel: [p.plan_name, customerName].filter(Boolean).join(" · ") || undefined,
      href: `/dashboard/policies/${p.id}`,
    });
  }

  for (const pay of paymentsRes.data ?? []) {
    const customer = pay.customer as { full_name: string } | { full_name: string }[] | null;
    const policy = pay.policy as { policy_number: string } | { policy_number: string }[] | null;
    const customerName = Array.isArray(customer) ? customer[0]?.full_name : customer?.full_name;
    const policyNum = Array.isArray(policy) ? policy[0]?.policy_number : policy?.policy_number;
    results.push({
      id: pay.id as string,
      type: "payment",
      label: pay.receipt_number
        ? `Receipt ${pay.receipt_number}`
        : `Payment ${pay.payment_date}`,
      sublabel: [customerName, policyNum].filter(Boolean).join(" · ") || undefined,
      href: `/dashboard/payments/${pay.id}`,
    });
  }

  return apiSuccess({ results: results.slice(0, 12) });
}
