import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "live" | "soon" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        tone === "live" && "bg-accent text-white",
        tone === "soon" && "bg-black/5 text-muted",
        tone === "neutral" && "bg-accent-soft text-accent",
        className,
      )}
      {...props}
    />
  );
}
