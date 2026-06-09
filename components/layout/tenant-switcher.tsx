"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function TenantSwitcher({
  currentTenantId,
  membershipCount = 1,
}: {
  currentTenantId: string;
  membershipCount?: number;
}) {
  const router = useRouter();
  const { data: tenants = [] } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/memberships");
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: membershipCount > 1,
  });

  if (membershipCount <= 1) return null;

  async function switchTenant(tenantId: string) {
    await fetch("/api/tenant/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="hidden h-4 w-4 text-lic-neutral-400 sm:block" strokeWidth={1.75} />
      <Select
        value={currentTenantId}
        onChange={(e) => switchTenant(e.target.value)}
        className="h-8 min-w-[140px] max-w-[200px] text-xs"
        aria-label="Switch branch"
      >
        {tenants.map((t: { id: string; name: string }) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
