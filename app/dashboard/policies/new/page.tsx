import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PolicyForm } from "@/components/policies/policy-form";

export default function NewPolicyPage() {
  return (
    <>
      <PageHeader title="Add policy" description="4-step policy attachment" />
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <PolicyForm />
      </Suspense>
    </>
  );
}
