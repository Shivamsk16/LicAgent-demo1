import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        title="Add customer"
        description="4-step onboarding with personal, address, nominee, and review"
        backHref="/dashboard/customers"
        backLabel="Back to customers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/dashboard/customers" },
          { label: "Add customer" },
        ]}
      />
      <CustomerForm />
    </>
  );
}
