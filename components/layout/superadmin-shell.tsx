"use client";

import { useState } from "react";
import { SuperAdminSidebar } from "./superadmin-sidebar";
import { SuperAdminTopbar } from "./superadmin-topbar";
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
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 lg:static lg:z-auto",
          mobileOpen ? "block" : "hidden lg:block"
        )}
      >
        <SuperAdminSidebar />
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminTopbar
          userName={userName}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-lic-neutral-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
