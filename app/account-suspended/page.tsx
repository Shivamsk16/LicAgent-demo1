import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveMemberships } from "@/lib/auth/memberships";
import { getTenantAccessDenial } from "@/lib/auth/tenant-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Tenant } from "@/types/database";

export default async function AccountSuspendedPage() {
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

  if (tenantId) {
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, status, plan, trial_ends_at")
      .eq("id", tenantId)
      .single();

    if (tenant) {
      branchName = tenant.name;
      const denial = getTenantAccessDenial(tenant as Tenant);
      if (!denial) {
        redirect("/dashboard");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-red-500 text-xs font-bold text-white">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Branch access suspended
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            Access to <strong>{branchName}</strong> is currently suspended.
          </p>
        </div>

        <div className="space-y-3 text-sm text-lic-neutral-600">
          <p>Contact your branch manager or platform administrator to restore access.</p>
          <p>If you belong to multiple branches, try switching to another branch after signing in again.</p>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Link href="/select-tenant">
            <Button variant="secondary" className="w-full">
              Select another branch
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              Sign in with another account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
