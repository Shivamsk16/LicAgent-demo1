import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/auth/dashboard-context";
import { BulkImportWizard } from "@/components/import/bulk-import-wizard";

export default async function ImportPage() {
  const { error, ctx } = await getDashboardContext();
  if (error === "UNAUTHORIZED") redirect("/login");
  if (!ctx) redirect("/login");
  if (!ctx.isManager) redirect("/dashboard");

  return <BulkImportWizard />;
}
