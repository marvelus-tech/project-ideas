"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wordmark } from "@/components/wordmark";
import { QUESTIONS } from "@/lib/questions";

type Draft = Record<string, string>;

export function TriageFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState("");
  const [magic, setMagic] = useState("");
  const [magicNote, setMagicNote] = useState("");
  const [saving, setSaving] = useState(false);
  const question = QUESTIONS[step]!;

  useEffect(() => {
    void fetch("/api/session", { method: "POST" });
  }, []);

  function buttonLabel() {
    if (saving) return "Saving";
    const optionalEmpty = "optional" in question && question.optional && !(draft[question.id] ?? "").trim();
    if (optionalEmpty) return "Skip";
    if (step === QUESTIONS.length - 1) return "See the desks";
    return "Continue";
  }

  function valueOk() {
    if (question.kind === "idea") return draft.hasIdea === "yes" || draft.hasIdea === "no";
    if (question.kind === "choice") return Boolean(draft[question.id]);
    if ("optional" in question && question.optional) return true;
    return (draft[question.id] ?? "").trim().length > 1;
  }

  async function finish(next: Draft) {
    setSaving(true);
    setError("");
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interests: next.interests,
        skills: next.skills,
        hasIdea: next.hasIdea === "yes",
        ideaText: next.ideaText ?? "",
        space: next.space,
        capital: next.capital,
        trades: next.trades,
        location: next.location,
        constraints: next.constraints ?? "",
      }),
    });
    const json = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(json.error || "Could not save those answers.");
      return;
    }
    router.push("/opportunities");
  }

  async function next() {
    if (!valueOk()) {
      setError("Add an answer to continue.");
      return;
    }
    setError("");
    if (step === QUESTIONS.length - 1) {
      await finish(draft);
      return;
    }
    setStep((current) => current + 1);
  }

  async function sendMagic(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/magic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: magic }),
    });
    const json = (await response.json()) as { error?: string; ok?: boolean };
    setMagicNote(json.ok ? "Check that inbox for the link." : json.error || "Magic link is not configured. The demo session is already on.");
  }

  return (
    <div className="min-h-full bg-background">
      <header className="flex items-center justify-between px-5 py-4">
        <Wordmark />
        <p className="text-sm text-muted">
          {step + 1} of {QUESTIONS.length}
        </p>
      </header>
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 pb-16">
        <div className="rise">
          <h1 className="font-serif text-4xl leading-tight">{question.prompt}</h1>
          <p className="mt-3 text-muted">{question.hint}</p>
          <div className="mt-8 grid gap-3">
            {question.kind === "text" ? (
              <Textarea
                value={draft[question.id] ?? ""}
                placeholder={question.placeholder}
                onChange={(event) => setDraft({ ...draft, [question.id]: event.target.value })}
              />
            ) : null}
            {question.kind === "choice"
              ? question.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, [question.id]: option.value })}
                    className={`min-h-12 rounded-2xl border px-4 text-left ${draft[question.id] === option.value ? "border-accent bg-accent-soft" : "border-border bg-card"}`}
                  >
                    {option.label}
                  </button>
                ))
              : null}
            {question.kind === "idea" ? (
              <>
                {["yes", "no"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft({ ...draft, hasIdea: value })}
                    className={`min-h-12 rounded-2xl border px-4 text-left ${draft.hasIdea === value ? "border-accent bg-accent-soft" : "border-border bg-card"}`}
                  >
                    {value === "yes" ? "Yes, I have one" : "Not yet"}
                  </button>
                ))}
                {draft.hasIdea === "yes" ? (
                  <Input
                    value={draft.ideaText ?? ""}
                    placeholder="A cookie stand"
                    onChange={(event) => setDraft({ ...draft, ideaText: event.target.value })}
                  />
                ) : null}
              </>
            ) : null}
          </div>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          <div className="mt-8 flex gap-3">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
            <Button type="button" onClick={() => void next()} disabled={saving}>
              {buttonLabel()}
            </Button>
          </div>
        </div>
        <form onSubmit={sendMagic} className="mt-16 grid gap-2 border-t border-border pt-6 text-sm text-muted">
          <p>
            Email magic links need Supabase keys. Otherwise this browser keeps a demo session.{" "}
            <a className="underline" href="/auth/callback">
              Magic link help
            </a>
          </p>
          <div className="flex gap-2">
            <Input type="email" value={magic} placeholder="you@example.com" onChange={(event) => setMagic(event.target.value)} required />
            <Button type="submit" variant="outline">
              Email me
            </Button>
          </div>
          {magicNote ? <p role="status">{magicNote}</p> : null}
        </form>
      </main>
    </div>
  );
}
