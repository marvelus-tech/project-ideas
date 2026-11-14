"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import Link from "next/link";

interface Card {
  id: string;
  live: boolean;
  title: string;
  pitch: string;
  name?: string;
  summary?: string;
}

export function OpportunityBoard() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/opportunities");
      if (response.status === 401) {
        setError("Answer the triage first.");
        setCards([]);
        return;
      }
      const json = (await response.json()) as { cards?: Card[]; error?: string };
      if (!response.ok) {
        setError(json.error || "Could not load paths.");
        setCards([]);
        return;
      }
      setCards(json.cards ?? []);
    })();
  }, []);

  async function openLive() {
    setOpening(true);
    setError("");
    const response = await fetch("/api/business", { method: "POST" });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setOpening(false);
      setError(json.error || "Could not open the desk.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-full bg-background">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Wordmark />
        <Link href="/triage" className="text-sm text-muted">
          Edit answers
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        <h1 className="max-w-2xl font-serif text-4xl leading-tight md:text-5xl">Three ways to start. One is open today.</h1>
        <p className="mt-3 max-w-xl text-muted">The live desk is personalized from your answers. The other two stay closed until a later template.</p>
        {error ? (
          <p className="mt-6 text-sm text-danger">
            {error}{" "}
            {error.includes("triage") ? (
              <Link href="/triage" className="underline">
                Start the questions
              </Link>
            ) : null}
          </p>
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(cards ?? []).map((card) => (
            <article key={card.id} className={`rise flex flex-col rounded-[28px] border p-5 ${card.live ? "border-accent bg-card" : "border-border bg-white/60"}`}>
              <Badge tone={card.live ? "live" : "soon"}>{card.live ? "Live" : "Coming soon"}</Badge>
              <h2 className="mt-4 font-serif text-2xl">{card.name || card.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted">{card.summary || card.pitch}</p>
              {card.live ? (
                <Button className="mt-6" onClick={() => void openLive()} disabled={opening}>
                  {opening ? "Opening the desk" : "Open this desk"}
                </Button>
              ) : (
                <p className="mt-6 text-sm text-muted">Not selectable yet.</p>
              )}
            </article>
          ))}
        </div>
        {cards === null ? <p className="mt-8 text-muted">Loading your three paths.</p> : null}
      </main>
    </div>
  );
}
