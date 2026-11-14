"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [note, setNote] = useState("");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") || "magiclink";

  async function finish() {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenHash, type }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNote(json.error || "That link could not be verified.");
      return;
    }
    router.push("/triage");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <Wordmark />
      <h1 className="mt-8 font-serif text-4xl">Magic link</h1>
      <p className="mt-4 text-muted">
        Supabase can email a sign-in link when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set. The email template should send people here with token_hash and type. Without those keys, use the demo session from Start.
      </p>
      {tokenHash ? (
        <Button className="mt-6" type="button" onClick={() => void finish()}>
          Finish sign-in
        </Button>
      ) : (
        <p className="mt-6 text-sm text-muted">No token on this visit. That is normal if you opened the help page directly.</p>
      )}
      {note ? <p className="mt-4 text-sm text-danger">{note}</p> : null}
      <p className="mt-8 text-sm">
        <Link href="/triage" className="underline">
          Continue with the demo session
        </Link>
      </p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading sign-in.</p>}>
      <CallbackInner />
    </Suspense>
  );
}
