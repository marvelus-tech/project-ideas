"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wordmark } from "@/components/wordmark";
import type { DeskPayload } from "@/lib/desk";

export function DashboardApp() {
  const router = useRouter();
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [error, setError] = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "computer" | "leads">("chat");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  async function reload() {
    const response = await fetch("/api/desk");
    if (!response.ok) {
      setError("Could not load the desk.");
      return;
    }
    const json = (await response.json()) as DeskPayload;
    setDesk(json);
    setAgentId((current) => current ?? json.agents[0]?.id ?? null);
  }

  useEffect(() => {
    void fetch("/api/session", { method: "POST" }).then(() => reload());
    const timer = setInterval(() => void reload(), 4000);
    return () => clearInterval(timer);
  }, []);

  const agent = desk?.agents.find((item) => item.id === agentId) ?? desk?.agents[0];

  async function send() {
    if (!agent || !text.trim()) return;
    setBusy(true);
    await fetch(`/api/agents/${agent.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    setBusy(false);
    await reload();
  }

  async function decide(approvalId: string, decision: "allow" | "deny") {
    setBusy(true);
    await fetch(`/api/agents/${agent?.id}/approvals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, decision }),
    });
    setBusy(false);
    await reload();
  }

  async function runRoutine(routineId: string) {
    if (!agent) return;
    setBusy(true);
    await fetch(`/api/agents/${agent.id}/routines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routineId }),
    });
    setBusy(false);
    await reload();
  }

  async function reset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await fetch("/api/desk/reset", { method: "POST" });
    router.push("/triage");
  }

  if (!desk) {
    return (
      <div className="grid min-h-full place-items-center text-muted">
        {error || "Loading your desk."}
      </div>
    );
  }

  if (!desk.profile) {
    return (
      <Empty title="No answers yet" body="The triage is how CNSTRCT picks a desk." href="/triage" label="Start the questions" />
    );
  }

  if (!desk.business || !agent) {
    return (
      <Empty title="No desk open" body="Pick the live home-services path to generate a site and wake the agents." href="/opportunities" label="See the three paths" />
    );
  }

  const usage = agent;
  const tokenPct = Math.min(100, Math.round((usage.tokensUsed / desk.limits.tokens) * 100));
  const hourPct = Math.min(100, Math.round((usage.computerSeconds / desk.limits.computerSeconds) * 100));

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Wordmark />
          <div className="text-right">
            <p className="font-medium">{desk.business.name}</p>
            <Link href={`/b/${desk.business.slug}`} className="text-sm text-accent">
              Open the public site
            </Link>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <Badge>{desk.modelMode === "mock" ? "Mock model" : desk.modelMode === "xai" ? "Grok" : "OpenAI"}</Badge>
          <span>{desk.composioConfigured ? "Composio key is set, but sends stay local in this MVP." : "No Composio key. Sends stay on this machine."}</span>
          <Link href="/opportunities" className="underline">
            All paths
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Meter label={`${usage.tokensUsed.toLocaleString()} of ${desk.limits.tokens.toLocaleString()} tokens`} value={tokenPct} />
          <Meter label={`${(usage.computerSeconds / 3600).toFixed(2)} of 2.00 computer hours`} value={hourPct} />
        </div>
      </header>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 md:px-8">
        {desk.agents.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAgentId(item.id)}
            className={`rounded-full border px-4 py-2 text-sm ${item.id === agent.id ? "border-accent bg-accent-soft" : "border-border bg-card"}`}
          >
            {item.name}
            <span className="ml-2 text-muted">{item.title}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 px-4 md:hidden">
        {(["chat", "computer", "leads"] as const).map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-sm ${tab === item ? "bg-foreground text-white" : "bg-card"}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      <main className="grid gap-4 px-4 py-4 md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <section className={`flex min-h-[60vh] flex-col rounded-[28px] border border-border bg-card ${tab === "chat" ? "" : "hidden md:flex"}`}>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {agent.rows.map((row) => (
              <RowView key={row.id} row={row} busy={busy} onDecide={(id, decision) => void decide(id, decision)} />
            ))}
          </div>
          <form
            className="border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <p className="mb-2 text-xs text-muted">A new message closes an approval that is still open.</p>
            <div className="flex gap-2">
              <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={`Message ${agent.name}`} className="min-h-12" />
              <Button type="submit" disabled={busy}>
                Send
              </Button>
            </div>
          </form>
        </section>
        <aside className={`space-y-4 ${tab === "chat" ? "hidden md:block" : ""}`}>
          <section className={`rounded-[28px] bg-[#1c1915] p-3 text-white ${tab === "leads" ? "hidden md:block" : ""}`}>
            <div className="flex items-center justify-between px-2 py-1 text-xs text-white/70">
              <span>{agent.name}&apos;s computer</span>
              <span>{agent.computer.provider}</span>
            </div>
            <p className="px-2 pb-2 text-xs text-white/60">{agent.computer.note}</p>
            <div className="grid gap-2">
              <pre className="max-h-64 overflow-auto rounded-2xl bg-[#11100e] p-3 text-xs leading-5 text-emerald-100">{agent.computer.terminal || "Waiting for the first command."}</pre>
              <div className="rounded-2xl bg-white p-3 text-[#1c1915]">
                <p className="text-xs uppercase tracking-wide text-muted">{agent.computer.preview?.path || "No file open"}</p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{agent.computer.preview?.body || "Notes land here after the sweep."}</pre>
              </div>
            </div>
            <ul className="mt-2 space-y-1 px-2 text-xs text-white/70">
              {agent.computer.files.map((file) => (
                <li key={file.path}>
                  {file.path} <span className="text-white/40">{file.bytes}b</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[28px] border border-border bg-card p-4">
            <h2 className="font-medium">Routines</h2>
            <ul className="mt-3 space-y-3">
              {agent.routines.map((routine) => (
                <li key={routine.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p>{routine.name}</p>
                    <p className="text-xs text-muted">{routine.scheduleLabel}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void runRoutine(routine.id)}>
                    Run now
                  </Button>
                </li>
              ))}
            </ul>
          </section>
          <section className={`rounded-[28px] border border-border bg-card p-4 ${tab !== "leads" ? "md:block" : ""}`}>
            <h2 className="font-medium">Leads</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {desk.leads.map((lead) => (
                <li key={lead.id}>
                  <p className="font-medium">
                    {lead.name} <span className="font-normal text-muted">({lead.source})</span>
                  </p>
                  <p className="text-muted">
                    {lead.service} at {lead.address}
                  </p>
                </li>
              ))}
              {desk.leads.length === 0 ? <li className="text-muted">No requests yet. The public form adds them here.</li> : null}
            </ul>
          </section>
        </aside>
      </main>
      {error ? <p className="px-8 pb-4 text-sm text-danger">{error}</p> : null}
      <div className="px-4 pb-8 md:px-8">
        <Button type="button" variant="ghost" onClick={() => void reset()}>
          {confirmReset ? "Click again to clear this desk" : "Start over"}
        </Button>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
        <div className="h-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Empty({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <div className="grid min-h-full place-items-center px-6">
      <div className="max-w-md text-center">
        <Wordmark />
        <h1 className="mt-6 font-serif text-4xl">{title}</h1>
        <p className="mt-3 text-muted">{body}</p>
        <Link href={href} className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-white">
          {label}
        </Link>
      </div>
    </div>
  );
}

function RowView({
  row,
  busy,
  onDecide,
}: {
  row: DeskPayload["agents"][number]["rows"][number];
  busy: boolean;
  onDecide: (id: string, decision: "allow" | "deny") => void;
}) {
  if (row.kind === "message") {
    const mine = row.body.role === "user";
    return (
      <p className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 ${mine ? "ml-auto bg-foreground text-white" : "bg-white"}`}>
        {String(row.body.text ?? "")}
      </p>
    );
  }
  if (row.kind === "tool-call" && (row.body.status === "done" || row.body.status === "error")) return null;
  if (row.kind === "tool-call" || row.kind === "tool-result" || row.kind === "event" || row.kind === "notice") {
    const label =
      row.kind === "event"
        ? String(row.body.text ?? "Routine")
        : row.kind === "notice"
          ? String(row.body.text ?? "")
          : `${String(row.body.name || row.body.tool || "tool")} · ${String(row.body.status || row.body.summary || "")}`;
    return <p className="text-xs text-muted">{label}</p>;
  }
  if (row.kind === "card") {
    const args = (row.body.args ?? {}) as Record<string, unknown>;
    const pending = row.body.status === "pending";
    return (
      <article className="rounded-3xl border border-accent/40 bg-accent-soft p-4">
        <p className="font-medium">{String(row.body.title ?? "Approval")}</p>
        <dl className="mt-3 space-y-2 text-sm">
          {Object.entries(args).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs uppercase tracking-wide text-muted">{key}</dt>
              <dd className="whitespace-pre-wrap">{String(value)}</dd>
            </div>
          ))}
        </dl>
        {pending ? (
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={busy} onClick={() => onDecide(String(row.body.approvalId), "allow")}>
              Approve
            </Button>
            <Button type="button" variant="danger" disabled={busy} onClick={() => onDecide(String(row.body.approvalId), "deny")}>
              Don&apos;t send
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Status: {String(row.body.status)}</p>
        )}
      </article>
    );
  }
  return null;
}
