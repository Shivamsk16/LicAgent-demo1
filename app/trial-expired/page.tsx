import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveMemberships } from "@/lib/auth/memberships";
import { getTenantAccessDenial } from "@/lib/auth/tenant-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateIST } from "@/lib/utils/dates";
import type { Tenant } from "@/types/database";

export default async function TrialExpiredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const memberships = await getActiveMemberships(user.id);
  const tenantId =
    cookieStore.get("active_tenant")?.value ?? memberships[0]?.tenant_id;

  let branchName = "Your branch";
  let trialEndedAt: string | null = null;

  if (tenantId) {
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, status, plan, trial_ends_at")
      .eq("id", tenantId)
      .single();

    if (tenant) {
      branchName = tenant.name;
      trialEndedAt = tenant.trial_ends_at;
      const denial = getTenantAccessDenial(tenant as Tenant);
      if (denial !== "trial_expired") {
        redirect("/dashboard");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-amber-500 text-xs font-bold text-white">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Trial ended
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            The trial period for <strong>{branchName}</strong> has ended.
            {trialEndedAt && (
              <> It expired on {formatDateIST(trialEndedAt)}.</>
            )}
          </p>
        </div>

        <div className="space-y-3 text-sm text-lic-neutral-600">
          <p>To continue using the workspace, contact your platform administrator to upgrade your branch plan.</p>
          <p>Your data is preserved and will be available once the branch is reactivated.</p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Sign in with another account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
