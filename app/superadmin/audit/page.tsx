import { PageHeader } from "@/components/shared/page-header";
import { AuditLogTable } from "@/components/superadmin/audit-log-table";

export default function GlobalAuditPage() {
  return (
    <>
      <PageHeader
        title="Global audit log"
        description="Platform-wide activity across all branches"
      />
      <AuditLogTable />
    </>
  );
}
