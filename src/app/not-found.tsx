import type { Metadata } from "next";
import Link from "next/link";
import { NOT_FOUND_DESCRIPTION, NOT_FOUND_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: NOT_FOUND_TITLE },
  description: NOT_FOUND_DESCRIPTION,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-4xl">This page is not on the desk.</h1>
      <p className="mt-4 text-muted">The link may be old. Home, the sample desk, and a new triage are all open.</p>
      <nav className="mt-6 flex flex-col gap-3 text-sm">
        <Link href="/" className="underline">
          Home
        </Link>
        <Link href="/b/harbor-tradie-desk" className="underline">
          Sample desk
        </Link>
        <Link href="/triage" className="underline">
          Start
        </Link>
      </nav>
    </main>
  );
}
