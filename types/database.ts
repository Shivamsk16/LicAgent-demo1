export type TenantPlan = "trial" | "starter" | "pro" | "enterprise";
export type TenantStatus = "pending" | "active" | "suspended" | "cancelled";
export type MemberStatus = "invited" | "active" | "suspended" | "removed";
export type PolicyType =
  | "endowment"
  | "whole_life"
  | "term"
  | "money_back"
  | "ulip"
  | "pension"
  | "child"
  | "group";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  super_admin: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  branch_code: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  plan: TenantPlan;
  status: TenantStatus;
  trial_ends_at: string | null;
  max_agents: number;
  billing_cycle: "monthly" | "yearly";
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string | null;
  permissions: Record<string, unknown>;
  is_system_role: boolean;
  created_at: string;
}

export interface TenantMember {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string | null;
  employee_id: string | null;
  status: MemberStatus;
  invited_at: string;
  joined_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  user?: User;
  role?: Role;
}

export interface CommissionRate {
  id: string;
  policy_type: string;
  commission_type: "first_year" | "renewal" | "bonus";
  rate_percentage: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  tenant_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: User;
}

export interface TenantWithStats extends Tenant {
  agent_count?: number;
  policy_count?: number;
  customer_count?: number;
}

export interface ProvisionBranchInput {
  name: string;
  branch_code: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  plan: TenantPlan;
  max_agents: number;
  billing_cycle: "monthly" | "yearly";
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  manager_employee_id?: string;
}
