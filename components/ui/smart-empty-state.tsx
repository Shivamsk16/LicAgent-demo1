import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils/cn";
import {
  ClipboardList,
  FileText,
  Filter,
  Search,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

type Entity = "customers" | "policies" | "payments" | "team" | "audit";

const ENTITY_CONFIG: Record<
  Entity,
  {
    icon: LucideIcon;
    empty: { title: string; description: string; actionLabel: string; actionHref: string };
    filtered: { title: string; description: string };
  }
> = {
  customers: {
    icon: Users,
    empty: {
      title: "No customers yet",
      description: "Add your first customer to start managing policies and premiums.",
      actionLabel: "Add customer",
      actionHref: "/dashboard/customers/new",
    },
    filtered: {
      title: "No customers match",
      description: "Try adjusting your search or KYC filter, or clear filters to see all customers.",
    },
  },
  policies: {
    icon: FileText,
    empty: {
      title: "No policies found",
      description: "Create a policy for an existing customer to track premiums and lifecycle.",
      actionLabel: "Add policy",
      actionHref: "/dashboard/policies/new",
    },
    filtered: {
      title: "No policies match",
      description: "Try a different search term or status filter.",
    },
  },
  payments: {
    icon: Wallet,
    empty: {
      title: "No payments recorded",
      description: "Record a premium payment to build your ledger and track collections.",
      actionLabel: "Record payment",
      actionHref: "/dashboard/payments/record",
    },
    filtered: {
      title: "No payments match",
      description: "Adjust your date range, status filter, or search term.",
    },
  },
  team: {
    icon: Users,
    empty: {
      title: "No team members",
      description: "Invite agents to collaborate on customers and policies.",
      actionLabel: "Invite agent",
      actionHref: "/dashboard/team",
    },
    filtered: {
      title: "No members match",
      description: "Try a different status filter.",
    },
  },
  audit: {
    icon: ClipboardList,
    empty: {
      title: "No audit entries",
      description: "Actions performed in this branch will appear here automatically.",
      actionLabel: "",
      actionHref: "",
    },
    filtered: {
      title: "No entries match",
      description: "Try adjusting your action, resource, or date filters.",
    },
  },
};

export function SmartEmptyState({
  entity,
  hasFilters,
  onClearFilters,
  className,
  compact,
  override,
  onAction,
}: {
  entity: Entity;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
  override?: Partial<{
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }>;
}) {
  const config = ENTITY_CONFIG[entity];
  const state = hasFilters ? config.filtered : config.empty;
  const emptyCfg = hasFilters ? null : config.empty;

  return (
    <div className={cn("rounded-xl bg-lic-neutral-0 ring-1 ring-black/[0.06]", className)}>
      <EmptyState
        compact={compact}
        icon={hasFilters ? Filter : config.icon}
        title={override?.title ?? state.title}
        description={override?.description ?? state.description}
        actionLabel={
          emptyCfg
            ? override?.actionLabel ?? (emptyCfg.actionLabel || undefined)
            : undefined
        }
        actionHref={
          emptyCfg && !onAction
            ? override?.actionHref ?? (emptyCfg.actionHref || undefined)
            : undefined
        }
        onAction={emptyCfg && onAction ? onAction : undefined}
      />
      {hasFilters && onClearFilters && (
        <div className="-mt-2 flex justify-center pb-8">
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            Clear all filters
          </Button>
        </div>
      )}
      {!hasFilters && entity === "customers" && (
        <p className="-mt-6 pb-8 text-center text-2xs text-lic-neutral-400">
          Tip: press <kbd className="rounded bg-lic-neutral-100 px-1">N</kbd> to add a customer quickly
        </p>
      )}
    </div>
  );
}
