import { cn } from "@/lib/utils/cn";
import { Label } from "./label";

export function Form({
  children,
  className,
  onSubmit,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  as?: "form" | "div";
}) {
  const props = Tag === "form" ? { onSubmit } : {};
  return (
    <Tag className={cn("form-stack", className)} {...props}>
      {children}
    </Tag>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("form-section", className)}>
      <div className="form-section-header">
        <h3 className="form-section-title">{title}</h3>
        {description && <p className="form-section-desc">{description}</p>}
      </div>
      <div className="form-stack">{children}</div>
    </section>
  );
}

export function FormRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("form-row", className)}>{children}</div>;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-lic-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-lic-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormActions({
  children,
  className,
  sticky,
}: {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-6",
        sticky &&
          "sticky bottom-0 -mx-6 border-t border-black/[0.06] bg-lic-neutral-0/95 px-6 py-4 backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}
