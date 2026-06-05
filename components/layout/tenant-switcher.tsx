"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

export function TenantSwitcher({ currentTenantId }: { currentTenantId: string }) {
  const router = useRouter();
  const { data: tenants = [] } = useQuery({
    queryKey: ["my-tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/memberships");
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  if (tenants.length <= 1) return null;

  async function switchTenant(tenantId: string) {
    await fetch("/api/tenant/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    router.refresh();
  }

  return (
    <select
      value={currentTenantId}
      onChange={(e) => switchTenant(e.target.value)}
      className="h-8 rounded-btn border border-lic-neutral-200 bg-white px-2 text-xs"
    >
      {tenants.map((t: { id: string; name: string }) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
