"use client";

import { useTenantStore } from "@/store/tenant";

const permissionMap: Record<string, string[]> = {
  "customers.view_all": ["branch_manager", "senior_agent"],
  "customers.delete": ["branch_manager"],
  "payments.edit": ["branch_manager", "senior_agent"],
  "team.invite": ["branch_manager"],
  "reports.export": ["branch_manager", "senior_agent"],
  "import.run": ["branch_manager", "senior_agent"],
};

export function usePermission(action: string): boolean {
  const role = useTenantStore((s) => s.role);
  if (!role) return false;
  const allowed = permissionMap[action];
  if (!allowed) return true;
  return allowed.includes(role);
}
