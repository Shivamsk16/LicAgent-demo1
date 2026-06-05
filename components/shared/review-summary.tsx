import { cn } from "@/lib/utils/cn";

export function ReviewSummary({
  sections,
  className,
}: {
  sections: {
    title: string;
    rows: { label: string; value: string | null | undefined }[];
  }[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-lic-neutral-500">
            {section.title}
          </h4>
          <dl className="divide-y divide-lic-neutral-150 rounded-md border border-lic-neutral-200 bg-lic-neutral-50">
            {section.rows.map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between gap-4 px-3 py-2.5 text-sm"
              >
                <dt className="text-lic-neutral-500">{label}</dt>
                <dd className="text-right font-medium text-lic-neutral-900">
                  {value?.trim() ? value : "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
