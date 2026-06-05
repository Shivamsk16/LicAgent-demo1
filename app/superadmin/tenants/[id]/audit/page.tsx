import { AuditLogTable } from "@/components/superadmin/audit-log-table";

export default function TenantAuditPage({
  params,
}: {
  params: { id: string };
}) {
  return <AuditLogTable tenantId={params.id} />;
}
