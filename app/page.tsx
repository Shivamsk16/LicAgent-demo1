import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, IndianRupee, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-lic-neutral-0">
      <header className="border-b border-black/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lic-neutral-900 text-2xs font-bold text-white">
              LIC
            </div>
            <span className="text-sm font-semibold text-lic-neutral-900">
              Agent Management
            </span>
          </div>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-lic-neutral-900 text-balance sm:text-4xl">
            Run your branch with clarity
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-lic-neutral-500">
            Multi-tenant platform for LIC branch offices. Customers, policies,
            premiums, and commissions in one workspace.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg">
              Get started
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-20 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Customers",
              desc: "Profiles, KYC, and agent assignments",
            },
            {
              icon: FileText,
              title: "Policies",
              desc: "Lifecycle tracking and premium schedules",
            },
            {
              icon: IndianRupee,
              title: "Commission",
              desc: "Real-time earnings and payment records",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl bg-lic-neutral-0 p-5 text-left ring-1 ring-black/[0.06]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-lic-neutral-100">
                <Icon className="h-4 w-4 text-lic-neutral-600" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-lic-neutral-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-lic-neutral-500">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-black/[0.06] px-6 py-4 text-center text-2xs text-lic-neutral-500">
        LIC Agent Management System
      </footer>
    </div>
  );
}
