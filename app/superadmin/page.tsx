import { PageHeader } from "@/components/shared/page-header";
import { OverviewDashboard } from "@/components/superadmin/overview-dashboard";

export default function SuperAdminOverviewPage() {
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Monitor all LIC branches and platform health"
      />
      <OverviewDashboard />
    </>
  );
}
