import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PolicyRevivalForm } from "@/components/policies/policy-revival-form";

export default function PolicyRevivalPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageHeader
        title="Policy revival"
        description="Calculate revival costs and submit for manager approval"
        backHref={`/dashboard/policies/${params.id}`}
        backLabel="Back to policy"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Policies", href: "/dashboard/policies" },
          { label: "Policy", href: `/dashboard/policies/${params.id}` },
          { label: "Revival" },
        ]}
      />
      <Suspense fallback={<p className="text-sm text-lic-neutral-500">Loading…</p>}>
        <PolicyRevivalForm policyId={params.id} />
      </Suspense>
    </>
  );
}
