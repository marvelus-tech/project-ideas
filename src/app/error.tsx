"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <h1 className="font-serif text-4xl">Something broke on this page.</h1>
      <p className="mt-4 text-muted">The desk data is still on disk. Try the page again, or go back home.</p>
      <button type="button" className="mt-6 h-11 rounded-full bg-accent px-5 text-white" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
