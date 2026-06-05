export type ShortcutDef = {
  id: string;
  keys: string;
  label: string;
  group: "Navigation" | "Actions" | "General";
  href?: string;
  action?: "command-palette" | "shortcuts-help" | "record-payment";
};

export const SHORTCUTS: ShortcutDef[] = [
  { id: "palette", keys: "⌘K", label: "Open command palette", group: "General", action: "command-palette" },
  { id: "help", keys: "?", label: "Keyboard shortcuts", group: "General", action: "shortcuts-help" },
  { id: "dashboard", keys: "G then D", label: "Go to dashboard", group: "Navigation", href: "/dashboard" },
  { id: "customers", keys: "G then C", label: "Go to customers", group: "Navigation", href: "/dashboard/customers" },
  { id: "policies", keys: "G then P", label: "Go to policies", group: "Navigation", href: "/dashboard/policies" },
  { id: "payments", keys: "G then Y", label: "Go to payments", group: "Navigation", href: "/dashboard/payments" },
  { id: "reports", keys: "G then R", label: "Go to reports", group: "Navigation", href: "/dashboard/reports" },
  { id: "new-customer", keys: "N", label: "New customer", group: "Actions", href: "/dashboard/customers/new" },
  { id: "new-policy", keys: "Shift P", label: "New policy", group: "Actions", href: "/dashboard/policies/new" },
  { id: "record-payment", keys: "R", label: "Record payment", group: "Actions", action: "record-payment" },
];

export function formatShortcutKeys(keys: string, isMac: boolean) {
  if (isMac) return keys;
  return keys.replace(/⌘/g, "Ctrl+").replace(/Shift /g, "Shift+");
}
