"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PolicyWizardModal } from "@/components/policies/policy-wizard-modal";
import { PageHeader } from "@/components/shared/page-header";
import { formatDateIST } from "@/lib/utils/dates";
import { formatINR } from "@/lib/utils/currency";
import type { Customer, Policy, Payment } from "@/types/business";
import { KycDocuments } from "@/components/customers/kyc-documents";
import { Alert } from "@/components/ui/alert";
import { DetailSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tabs = ["Personal", "KYC", "Policies", "Payments"] as const;

export function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Personal");
  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);

  const { data: customer, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to load customer");
      return json.data as Customer;
    },
  });

  const { data: policiesData } = useQuery({
    queryKey: ["policies", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/policies?customer_id=${customerId}&pageSize=50`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data as { items: Policy[]; total: number };
    },
    enabled: tab === "Policies" || tab === "Payments",
  });

  const policies = policiesData?.items ?? [];

  const { data: paymentsData } = useQuery({
    queryKey: ["payments-customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/payments?customer_id=${customerId}&pageSize=50`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      return json.data.items as Payment[];
    },
    enabled: tab === "Payments",
  });

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <Alert variant="error" title="Could not load customer">
        {error instanceof Error ? error.message : "Something went wrong."}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
          <Link href="/dashboard/customers">
            <Button size="sm" variant="ghost">Back to customers</Button>
          </Link>
        </div>
      </Alert>
    );
  }

  if (!customer) {
    return (
      <Alert variant="error" title="Customer not found">
        This customer may have been removed or you may not have access.
        <Link href="/dashboard/customers" className="mt-2 block text-xs font-medium underline">
          Back to customers
        </Link>
      </Alert>
    );
  }

  const initials = customer.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="section-gap">
      <PageHeader
        title={customer.full_name}
        description={`${customer.customer_code ?? "—"} · ${customer.phone}`}
        backHref="/dashboard/customers"
        backLabel="Back to customers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/dashboard/customers" },
          { label: customer.full_name },
        ]}
        actions={
          <>
            <Link
              href={`/dashboard/customers/${customerId}/edit`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              Edit
            </Link>
            <Button onClick={() => setPolicyDrawerOpen(true)}>Add policy</Button>
          </>
        }
      />

      <PolicyWizardModal
        open={policyDrawerOpen}
        onOpenChange={setPolicyDrawerOpen}
        prefillCustomerId={customerId}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lic-neutral-100 text-sm font-semibold text-lic-neutral-700">
          {initials}
        </div>
        <Badge dot>{customer.kyc_status}</Badge>
      </div>

      <nav className="detail-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "detail-tab detail-tab-active" : "detail-tab"}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Personal" && (
        <dl className="divide-y divide-black/[0.04]">
          {[
            ["Email", customer.email],
            ["Alternate phone", customer.alternate_phone],
            ["Address", [customer.address_line1, customer.address_line2].filter(Boolean).join(", ")],
            ["City / State", `${customer.city}, ${customer.state}`],
            ["Pincode", customer.pincode],
            ["PAN", customer.pan_number],
            ["Aadhaar last 4", customer.aadhaar_last4],
            ["Occupation", customer.occupation],
            ["Annual income", customer.annual_income ? formatINR(Number(customer.annual_income)) : null],
            ["Marital status", customer.marital_status],
            ["Nominee", customer.nominee_name],
            ["Nominee relation", customer.nominee_relation],
            ["Nominee DOB", customer.nominee_dob ? formatDateIST(customer.nominee_dob) : null],
            ["DOB", customer.date_of_birth ? formatDateIST(customer.date_of_birth) : "—"],
            ["Notes", customer.notes],
          ].map(([k, v]) => (
            <div key={k} className="detail-field">
              <dt className="detail-field-label">{k}</dt>
              <dd className="detail-field-value">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "Policies" && (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                {["Policy #", "Plan", "Premium", "Next due", "Status", ""].map((h) => (
                  <TableHead key={h || "actions"} align={h === "" ? "right" : "left"}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => (
                <TableRow
                  key={p.id}
                  interactive
                  onNavigate={() => router.push(`/dashboard/policies/${p.id}`)}
                  navigateLabel={`View policy ${p.policy_number}`}
                >
                  <TableCell mono>{p.policy_number}</TableCell>
                  <TableCell className="font-medium text-lic-neutral-900">{p.plan_name}</TableCell>
                  <TableCell>{formatINR(Number(p.premium_amount))}</TableCell>
                  <TableCell>{p.next_premium_due ? formatDateIST(p.next_premium_due) : "—"}</TableCell>
                  <TableCell><Badge>{p.status}</Badge></TableCell>
                  <TableCell align="right" data-row-action>
                    <Link
                      href={`/dashboard/policies/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === "Payments" && (
        <ul className="space-y-2 text-sm">
          {(paymentsData ?? []).map((pay) => (
            <li key={pay.id} className="flex items-center justify-between rounded-lg bg-lic-neutral-0 px-4 py-3 ring-1 ring-inset ring-black/[0.06]">
              <span>
                #{pay.installment_number} · {formatDateIST(pay.payment_date)} · {formatINR(Number(pay.amount_paid))}
                <Badge className="ml-2">{pay.status}</Badge>
              </span>
              <Link href={`/dashboard/payments/${pay.id}`}>
                <Button variant="ghost" size="sm">Receipt</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tab === "KYC" && <KycDocuments customerId={customerId} />}
    </div>
  );
}
