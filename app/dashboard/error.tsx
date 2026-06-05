"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="max-w-md rounded-card border bg-white p-8 shadow-card">
        <h2 className="text-lg font-semibold">Could not load this page</h2>
        <p className="mt-2 text-sm text-lic-neutral-500">
          {error.message || "Please check your connection and try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Retry</Button>
          <Link href="/dashboard">
            <Button variant="secondary">Dashboard home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
