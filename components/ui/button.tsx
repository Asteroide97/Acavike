import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary px-4 py-2.5 text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-slate-300 bg-white px-4 py-2.5 text-slate-800 hover:border-primary hover:text-primary",
        ghost: "px-3 py-2 text-slate-700 hover:bg-slate-100",
        destructive: "bg-destructive px-4 py-2.5 text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-5 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: ButtonProps) {
  if (asChild) {
    return <span className={cn(buttonVariants({ variant, size, fullWidth }), className)}>{props.children}</span>;
  }

  return <button className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />;
}

export { buttonVariants };
