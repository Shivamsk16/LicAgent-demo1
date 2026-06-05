export const REPORT_IDS = [
  "monthly-premium-collection",
  "agent-performance",
  "policy-status-breakdown",
  "commission-summary",
  "policy-lapse",
  "collection-efficiency",
  "new-policies-monthly",
  "kyc-status",
  "upcoming-maturities",
  "financial-year-summary",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export interface ReportMeta {
  id: ReportId;
  name: string;
  description: string;
  chartType: "bar" | "horizontalBar" | "donut" | "line" | "table" | "timeline" | "summary";
  managerOnly: boolean;
}

export const REPORT_CATALOG: ReportMeta[] = [
  {
    id: "monthly-premium-collection",
    name: "Monthly premium collection",
    description: "Premiums collected vs expected per month",
    chartType: "bar",
    managerOnly: false,
  },
  {
    id: "agent-performance",
    name: "Agent performance scorecard",
    description: "Side-by-side comparison of all agents",
    chartType: "horizontalBar",
    managerOnly: true,
  },
  {
    id: "policy-status-breakdown",
    name: "Policy status breakdown",
    description: "In-force, lapsed, matured, and other statuses",
    chartType: "donut",
    managerOnly: false,
  },
  {
    id: "commission-summary",
    name: "Commission summary by agent",
    description: "Gross and net commission per agent per month",
    chartType: "bar",
    managerOnly: true,
  },
  {
    id: "policy-lapse",
    name: "Policy lapse report",
    description: "Lapsed policies in the selected date range",
    chartType: "table",
    managerOnly: false,
  },
  {
    id: "collection-efficiency",
    name: "Premium collection efficiency",
    description: "On-time vs late vs missed premium payments",
    chartType: "line",
    managerOnly: false,
  },
  {
    id: "new-policies-monthly",
    name: "New policies per month",
    description: "Policies added per month",
    chartType: "line",
    managerOnly: false,
  },
  {
    id: "kyc-status",
    name: "Customer KYC status",
    description: "Pending, verified, and rejected KYC breakdown",
    chartType: "donut",
    managerOnly: false,
  },
  {
    id: "upcoming-maturities",
    name: "Upcoming maturities (12 months)",
    description: "Policies maturing in the next year",
    chartType: "timeline",
    managerOnly: false,
  },
  {
    id: "financial-year-summary",
    name: "Financial year summary",
    description: "Branch FY overview: premiums, commissions, policies",
    chartType: "summary",
    managerOnly: true,
  },
];

export interface ReportResult {
  meta: ReportMeta;
  from: string;
  to: string;
  rows: Record<string, unknown>[];
  chartData: Record<string, unknown>[];
  summary?: Record<string, number | string>;
}
