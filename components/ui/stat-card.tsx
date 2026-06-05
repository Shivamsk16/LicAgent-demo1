import { Card } from "./card";
import { cn } from "@/lib/utils/cn";

const accentMap = {
  blue: "border-l-lic-blue-400",
  green: "border-l-lic-green-600",
  amber: "border-l-lic-amber-600",
  yellow: "border-l-lic-yellow-400",
};

export function StatCard({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof accentMap;
}) {
  return (
    <Card className={cn("border-l-4", accentMap[accent])}>
      <p className="text-xs font-medium uppercase tracking-wide text-lic-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-lic-neutral-800">{value}</p>
    </Card>
  );
}
