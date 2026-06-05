import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-btn text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-lic-yellow-400 text-lic-neutral-800 hover:bg-lic-yellow-700",
        secondary:
          "border border-lic-blue-400 bg-white text-lic-blue-400 hover:bg-lic-blue-50",
        danger:
          "border border-lic-red-600 bg-lic-red-100 text-lic-red-600 hover:bg-red-50",
        ghost: "text-lic-neutral-500 hover:bg-lic-neutral-50",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
