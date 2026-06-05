import { PageHeader } from "@/components/shared/page-header";
import { CommissionRatesEditor } from "@/components/superadmin/commission-rates-editor";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CommissionRate } from "@/types/database";

export default async function CommissionRatesPage() {
  let rates: CommissionRate[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("commission_rates")
      .select("*")
      .order("policy_type");
    rates = data ?? [];
  } catch {
    /* env */
  }

  return (
    <>
      <PageHeader
        title="Commission rates"
        description="Configure LIC commission rates by policy type. Changes apply to future payments only."
      />
      <CommissionRatesEditor initialRates={rates} />
    </>
  );
}
