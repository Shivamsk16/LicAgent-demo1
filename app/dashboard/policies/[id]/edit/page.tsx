import { redirect } from "next/navigation";

export default function EditPolicyPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/dashboard/policies/${params.id}`);
}
