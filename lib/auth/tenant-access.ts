import type { Tenant } from "@/types/database";

export type TenantAccessDenial = "trial_expired" | "account_suspended" | "inactive";

type TenantAccessInput = Pick<Tenant, "status" | "plan" | "trial_ends_at">;

export function getTenantAccessDenial(
  tenant: TenantAccessInput | null | undefined
): TenantAccessDenial | null {
  if (!tenant) return "inactive";

  if (tenant.status === "suspended") return "account_suspended";
  if (tenant.status !== "active") return "inactive";

  if (
    tenant.plan === "trial" &&
    tenant.trial_ends_at &&
    new Date(tenant.trial_ends_at) < new Date()
  ) {
    return "trial_expired";
  }

  return null;
}

export function denialToPath(denial: TenantAccessDenial): string {
  switch (denial) {
    case "trial_expired":
      return "/trial-expired";
    case "account_suspended":
      return "/account-suspended";
    default:
      return "/account-suspended";
  }
}

export function denialToContextError(
  denial: TenantAccessDenial
): "TRIAL_EXPIRED" | "ACCOUNT_SUSPENDED" | "FORBIDDEN" {
  switch (denial) {
    case "trial_expired":
      return "TRIAL_EXPIRED";
    case "account_suspended":
      return "ACCOUNT_SUSPENDED";
    default:
      return "FORBIDDEN";
  }
}
