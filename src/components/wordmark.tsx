import { Flame } from "lucide-react";
import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white">
        <Flame className="h-4 w-4" aria-hidden />
      </span>
      CNSTRCT
    </Link>
  );
}
