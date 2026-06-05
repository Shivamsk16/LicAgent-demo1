"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { TenantSwitcher } from "./tenant-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/store/tenant";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { DashboardRole } from "@/lib/auth/dashboard-context";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({
  children,
  tenantId,
  tenantName,
  role,
  userName,
}: {
  children: React.ReactNode;
  tenantId: string;
  tenantName: string;
  role: DashboardRole;
  userName?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const setContext = useTenantStore((s) => s.setContext);
  const router = useRouter();

  useEffect(() => {
    setContext({
      tenantId,
      tenantName,
      role,
      isManager: role === "branch_manager" || role === "senior_agent",
    });
  }, [tenantId, tenantName, role, setContext]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 lg:static",
          mobileOpen ? "block" : "hidden lg:block"
        )}
      >
        <DashboardSidebar />
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-lic-neutral-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm text-lic-neutral-500">
              {userName ? `Hi, ${userName}` : "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <TenantSwitcher currentTenantId={tenantId} />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-lic-neutral-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
