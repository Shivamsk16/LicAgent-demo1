import { PageHeader } from "@/components/shared/page-header";
import { ProvisionBranchForm } from "@/components/superadmin/provision-branch-form";
import { Card } from "@/components/ui/card";

export default function NewTenantPage() {
  return (
    <>
      <PageHeader
        title="Provision new branch"
        description="Create a branch tenant and invite the branch manager"
      />
      <Card className="max-w-2xl">
        <ProvisionBranchForm />
      </Card>
    </>
  );
}
