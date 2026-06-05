"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-lic-neutral-50 p-6 text-center">
      <div className="max-w-md rounded-xl bg-lic-neutral-0 p-8 ring-1 ring-black/[0.06]">
        <h1 className="text-2xl font-semibold tracking-tight text-lic-neutral-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-lic-neutral-500">
          An unexpected error occurred. Try again or return to the home page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
