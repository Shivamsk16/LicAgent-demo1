import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BackLink({
  href,
  label = "Back",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 text-[13px] text-lic-neutral-500 transition-colors duration-fast ease-out hover:text-lic-neutral-800",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  );
}
