import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-[#9a3412]",
        outline: "border border-border bg-card text-foreground hover:bg-accent-soft",
        ghost: "text-foreground hover:bg-black/5",
        danger: "border border-danger/30 bg-white text-danger hover:bg-danger/5",
      },
      size: {
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        sm: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
