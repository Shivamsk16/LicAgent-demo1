import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { getTenantDetail } from "@/lib/superadmin/queries";
import { formatDateIST } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/currency";
import { notFound } from "next/navigation";

export default async function TenantOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  let detail = null;
  try {
    detail = await getTenantDetail(params.id);
  } catch {
    /* env */
  }

  if (!detail) notFound();

  const { tenant, stats } = detail;

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Branch information</CardTitle>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-lic-neutral-500">Created</dt>
            <dd>{formatDateIST(tenant.created_at)}</dd>
          </div>
          <div>
            <dt className="text-lic-neutral-500">Trial ends</dt>
            <dd>
              {tenant.trial_ends_at
                ? formatDateIST(tenant.trial_ends_at)
                : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-lic-neutral-500">Address</dt>
            <dd>{tenant.address ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Customers" value={stats.customer_count} accent="blue" />
        <StatCard label="Active policies" value={stats.active_policies} accent="green" />
        <StatCard label="Lapsed policies" value={stats.lapsed_policies} accent="amber" />
        <StatCard label="Payments this month" value={stats.payments_this_month} accent="blue" />
        <StatCard
          label="Commission paid"
          value={formatINR(stats.total_commission_paid)}
          accent="yellow"
        />
      </div>

      <Card>
        <CardTitle>Activity</CardTitle>
        <p className="mt-2 text-sm text-lic-neutral-500">
          Payment trend chart — available after payment data is recorded (Phase 3+).
        </p>
      </Card>
    </div>
  );
}
