import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="Add customer" description="3-step onboarding" />
      <CustomerForm />
    </>
  );
}
