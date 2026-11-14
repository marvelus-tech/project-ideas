import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none placeholder:text-muted/70 focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
