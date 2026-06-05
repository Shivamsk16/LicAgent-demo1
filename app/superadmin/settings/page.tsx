import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminSettingsPage() {
  const authUser = await getSessionUser();
  let profile = null;
  if (authUser) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      profile = data;
    } catch {
      /* */
    }
  }

  return (
    <>
      <PageHeader
        title="Platform settings"
        description="SuperAdmin profile and platform configuration"
      />
      <Card className="max-w-md">
        <h3 className="text-sm font-semibold">Profile</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-lic-neutral-500">Name</dt>
            <dd>{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-lic-neutral-500">Email</dt>
            <dd>{profile?.email ?? authUser?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-lic-neutral-500">Role</dt>
            <dd>SuperAdmin</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-lic-neutral-500">
          Password changes via Supabase Auth dashboard or forgot-password flow.
        </p>
      </Card>
    </>
  );
}
