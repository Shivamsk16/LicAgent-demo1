import { createAdminClient } from "@/lib/supabase/admin";

export async function generateCustomerCode(
  tenantId: string,
  branchCode: string | null
): Promise<string> {
  const admin = createAdminClient();
  const prefix = (branchCode || "BR").replace(/\s/g, "").toUpperCase();

  const { count } = await admin
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = String((count ?? 0) + 1).padStart(5, "0");
  return `${prefix}-${seq}`;
}
