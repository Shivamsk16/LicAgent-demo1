import { create } from "zustand";
import type { DashboardRole } from "@/lib/auth/dashboard-context";

interface TenantStore {
  tenantId: string | null;
  tenantName: string | null;
  role: DashboardRole | null;
  isManager: boolean;
  setContext: (ctx: {
    tenantId: string;
    tenantName: string;
    role: DashboardRole;
    isManager: boolean;
  }) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  tenantId: null,
  tenantName: null,
  role: null,
  isManager: false,
  setContext: (ctx) => set({ ...ctx, isManager: ctx.isManager }),
}));
