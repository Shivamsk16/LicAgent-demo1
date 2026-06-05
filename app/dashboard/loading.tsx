import { StatGridSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-2">
      <div className="h-8 w-48 animate-pulse rounded-md bg-lic-neutral-200" />
      <StatGridSkeleton count={4} />
    </div>
  );
}
