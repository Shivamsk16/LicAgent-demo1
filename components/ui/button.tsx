import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-fast ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lic-blue-400/30 focus-visible:ring-offset-2 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-lic-neutral-900 text-white hover:bg-lic-neutral-800",
        secondary:
          "bg-lic-neutral-0 text-lic-neutral-700 ring-1 ring-inset ring-black/[0.1] hover:bg-lic-neutral-50 hover:ring-black/[0.14]",
        brand:
          "bg-lic-yellow-400 text-lic-neutral-900 hover:bg-lic-yellow-500",
        danger:
          "bg-lic-red-50 text-lic-red-600 ring-1 ring-inset ring-lic-red-600/15 hover:bg-lic-red-100",
        ghost:
          "text-lic-neutral-600 hover:bg-black/[0.04] hover:text-lic-neutral-900",
        link: "h-auto p-0 text-lic-blue-500 underline-offset-4 hover:text-lic-blue-600 hover:underline active:scale-100",
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9 p-0",
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
