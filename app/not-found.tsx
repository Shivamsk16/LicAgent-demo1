import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-lic-neutral-50 p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-lic-neutral-100 ring-1 ring-inset ring-lic-neutral-200">
          <FileQuestion className="h-6 w-6 text-lic-neutral-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-lic-neutral-500">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
