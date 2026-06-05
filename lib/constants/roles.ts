export const SYSTEM_ROLES = [
  "branch_manager",
  "senior_agent",
  "agent",
  "viewer",
] as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[number];

export const ROLE_DISPLAY_NAMES: Record<SystemRoleName, string> = {
  branch_manager: "Branch Manager",
  senior_agent: "Senior Agent",
  agent: "Agent",
  viewer: "Viewer",
};

export const ROLE_PERMISSIONS: Record<
  SystemRoleName,
  Record<string, unknown>
> = {
  branch_manager: {
    customers: { view_all: true, create: true, edit: true, delete: true },
    policies: { create: true, edit: true },
    payments: { record: true, edit: true },
    revival: { initiate: true, approve: true },
    kyc: { verify: true },
    commission: { view_all: true },
    team: { invite: true, manage: true },
    import: { run: true },
    reports: { export: true },
    audit: { view: true },
  },
  senior_agent: {
    customers: { view_all: true, create: true, edit: true, delete: false },
    policies: { create: true, edit: true },
    payments: { record: true, edit: true },
    revival: { initiate: true, approve: false },
    kyc: { verify: true },
    commission: { view_all: false },
    team: { invite: false, manage: false },
    import: { run: true },
    reports: { export: true },
    audit: { view: false },
  },
  agent: {
    customers: { view_all: false, create: true, edit: true, delete: false },
    policies: { create: true, edit: true },
    payments: { record: true, edit: false },
    revival: { initiate: true, approve: false },
    kyc: { verify: false },
    commission: { view_all: false },
    team: { invite: false, manage: false },
    import: { run: false },
    reports: { export: false },
    audit: { view: false },
  },
  viewer: {
    customers: { view_all: false, create: false, edit: false, delete: false },
    policies: { create: false, edit: false },
    payments: { record: false, edit: false },
    revival: { initiate: false, approve: false },
    kyc: { verify: false },
    commission: { view_all: false },
    team: { invite: false, manage: false },
    import: { run: false },
    reports: { export: false },
    audit: { view: false },
  },
};
