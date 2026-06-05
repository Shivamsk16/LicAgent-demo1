"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Building2, ChevronRight, LogOut } from "lucide-react";

type TenantOption = { id: string; name: string };

export default function SelectTenantPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tenant/memberships");
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Could not load your branches");
        setTenants([]);
        return;
      }
      setTenants(json.data ?? []);
    } catch {
      setError("Could not load your branches. Check your connection and try again.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  async function select(tenantId: string) {
    setSelecting(tenantId);
    setError("");
    try {
      const res = await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Could not switch branch");
        setSelecting(null);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not switch branch. Try again.");
      setSelecting(null);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lic-neutral-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lic-yellow-400 text-xs font-bold text-lic-neutral-900">
            LIC
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
            Select branch
          </h1>
          <p className="mt-2 text-sm text-lic-neutral-500">
            You belong to multiple branches. Choose one to continue.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
            {!loading && (
              <button
                type="button"
                onClick={loadTenants}
                className="mt-2 block text-xs font-medium underline"
              >
                Try again
              </button>
            )}
          </Alert>
        )}

        <Card padding="sm">
          {loading ? (
            <ul className="divide-y divide-lic-neutral-150">
              {[1, 2, 3].map((i) => (
                <li key={i} className="px-4 py-3.5">
                  <Skeleton className="h-9 w-full" />
                </li>
              ))}
            </ul>
          ) : tenants.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-lic-neutral-900">No branches found</p>
              <p className="mt-1 text-sm text-lic-neutral-500">
                Your account is not assigned to any branch. Contact your administrator.
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-lic-neutral-150">
              {tenants.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={selecting !== null}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-lic-neutral-50 active:scale-[0.99] disabled:opacity-60"
                    onClick={() => select(t.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-lic-neutral-50 ring-1 ring-inset ring-lic-neutral-200">
                        <Building2 className="h-4 w-4 text-lic-neutral-500" strokeWidth={1.75} />
                      </div>
                      <span className="text-sm font-medium text-lic-neutral-900">
                        {selecting === t.id ? "Switching…" : t.name}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-lic-neutral-400" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!loading && tenants.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
