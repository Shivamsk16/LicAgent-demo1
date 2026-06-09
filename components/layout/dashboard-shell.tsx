"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AppTopbar } from "./app-topbar";
import { TenantSwitcher } from "./tenant-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/store/tenant";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AppChrome } from "@/components/layout/app-chrome";
import { CommandTrigger } from "@/components/command/command-trigger";
import type { DashboardRole } from "@/lib/auth/dashboard-context";
import { cn } from "@/lib/utils/cn";

export function DashboardShell({
  children,
  tenantId,
  tenantName,
  role,
  userName,
  membershipCount = 1,
}: {
  children: React.ReactNode;
  tenantId: string;
  tenantName: string;
  role: DashboardRole;
  userName?: string;
  membershipCount?: number;
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
    <AppChrome>
    <div className="flex h-screen overflow-hidden bg-lic-neutral-50">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-overlay lg:static lg:z-auto",
          mobileOpen ? "block" : "hidden lg:block"
        )}
      >
        <DashboardSidebar />
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-sticky bg-lic-neutral-900/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          title={userName ? `Welcome, ${userName}` : "Dashboard"}
          subtitle={tenantName}
          mobileOpen={mobileOpen}
          onMenuToggle={() => setMobileOpen((o) => !o)}
          actions={
            <>
              <CommandTrigger className="md:min-w-[200px] md:max-w-xs md:flex-1" />
              <Link href="/dashboard/payments/record" className="hidden sm:block">
                <Button size="sm" variant="secondary">
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Record payment
                </Button>
              </Link>
              <NotificationBell />
              <TenantSwitcher
                currentTenantId={tenantId}
                membershipCount={membershipCount}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </>
          }
        />
        <main id="main-content" className="app-main flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:px-10 scrollbar-thin" tabIndex={-1}>
          <div className="page-container page-stack">{children}</div>
        </main>
      </div>
    </div>
    </AppChrome>
  );
}
