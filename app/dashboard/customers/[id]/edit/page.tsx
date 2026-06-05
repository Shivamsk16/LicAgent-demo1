import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { notFound, redirect } from "next/navigation";

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const { ctx } = await getDashboardContext();
  if (!ctx) redirect("/login");

  const admin = createAdminClient();
  let query = admin
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenantId);
  if (!ctx.isManager) query = query.eq("assigned_agent_id", ctx.userId);
  const { data } = await query.single();
  if (!data) notFound();

  return (
    <>
      <PageHeader
        title="Edit customer"
        description={data.full_name}
        backHref={`/dashboard/customers/${params.id}`}
        backLabel="Back to customer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/dashboard/customers" },
          { label: data.full_name, href: `/dashboard/customers/${params.id}` },
          { label: "Edit" },
        ]}
      />
      <CustomerForm initial={data} customerId={params.id} />
    </>
  );
}
