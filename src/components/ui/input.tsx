import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-white px-4 text-base outline-none placeholder:text-muted/70 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
