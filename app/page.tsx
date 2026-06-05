import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-lic-yellow-50 p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-card bg-lic-yellow-400 text-lg font-bold">
        LIC
      </div>
      <h1 className="text-2xl font-semibold text-lic-neutral-800">
        LIC Agent Management
      </h1>
      <p className="mt-2 max-w-md text-sm text-lic-neutral-500">
        Multi-tenant SaaS for LIC branch offices — manage customers, policies,
        premiums, and commissions.
      </p>
      <Link href="/login" className="mt-8">
        <Button size="lg">Sign in</Button>
      </Link>
    </div>
  );
}
