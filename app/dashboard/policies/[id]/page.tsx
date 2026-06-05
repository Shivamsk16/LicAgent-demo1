import { PolicyDetail } from "@/components/policies/policy-detail";

export default function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PolicyDetail policyId={params.id} />;
}
