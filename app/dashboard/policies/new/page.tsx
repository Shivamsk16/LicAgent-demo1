import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PolicyForm } from "@/components/policies/policy-form";

export default function NewPolicyPage() {
  return (
    <>
      <PageHeader
        title="Add policy"
        description="Attach a new policy to an existing customer"
        backHref="/dashboard/policies"
        backLabel="Back to policies"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Policies", href: "/dashboard/policies" },
          { label: "Add policy" },
        ]}
      />
      <Suspense fallback={<p className="text-sm text-lic-neutral-500">Loading…</p>}>
        <PolicyForm />
      </Suspense>
    </>
  );
}
