"use client";

import { useState } from "react";
import { SuperAdminSidebar } from "./superadmin-sidebar";
import { AppTopbar } from "./app-topbar";
import { SuperAdminTopbarActions } from "./superadmin-topbar";
import { AppChrome } from "@/components/layout/app-chrome";
import { CommandTrigger } from "@/components/command/command-trigger";
import { cn } from "@/lib/utils/cn";

export function SuperAdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppChrome>
    <div className="flex h-screen overflow-hidden bg-lic-neutral-50">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-overlay lg:static lg:z-auto",
          mobileOpen ? "block" : "hidden lg:block"
        )}
      >
        <SuperAdminSidebar />
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
          title="Platform admin"
          subtitle={userName}
          mobileOpen={mobileOpen}
          onMenuToggle={() => setMobileOpen((o) => !o)}
          actions={
            <>
              <CommandTrigger className="md:min-w-[180px]" />
              <SuperAdminTopbarActions />
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
