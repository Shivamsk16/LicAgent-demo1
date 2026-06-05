import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default function EditPolicyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <PageHeader title="Edit policy" />
      <Card className="text-sm text-lic-neutral-500">
        Policy edit form — use policy detail quick actions for now. Policy ID: {params.id}
      </Card>
    </>
  );
}
