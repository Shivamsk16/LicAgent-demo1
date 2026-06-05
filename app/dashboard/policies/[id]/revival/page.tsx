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
      <PageHeader title="Policy revival" />
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <PolicyRevivalForm policyId={params.id} />
      </Suspense>
    </>
  );
}
