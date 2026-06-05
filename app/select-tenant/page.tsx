"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SelectTenantPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/tenant/memberships")
      .then((r) => r.json())
      .then((j) => setTenants(j.data ?? []));
  }, []);

  async function select(tenantId: string) {
    await fetch("/api/tenant/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-lg font-semibold">Select branch</h1>
        <p className="mt-1 text-sm text-lic-neutral-500">
          You belong to multiple branches. Choose one to continue.
        </p>
        <ul className="mt-6 space-y-2">
          {tenants.map((t) => (
            <li key={t.id}>
              <Button className="w-full justify-start" variant="secondary" onClick={() => select(t.id)}>
                {t.name}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
