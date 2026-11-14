"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeadForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: form.get("name"),
        phone: form.get("phone"),
        address: form.get("address"),
        service: form.get("service"),
      }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(json.error || "Could not save that request.");
      return;
    }
    setStatus("saved");
    setMessage("Saved on this desk. Nobody was texted or emailed.");
    formEl.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3" id="lead">
      <label className="grid gap-1 text-sm">
        Name
        <Input name="name" required autoComplete="name" />
      </label>
      <label className="grid gap-1 text-sm">
        Phone
        <Input name="phone" required autoComplete="tel" inputMode="tel" />
      </label>
      <label className="grid gap-1 text-sm">
        Address
        <Input name="address" required autoComplete="street-address" />
      </label>
      <label className="grid gap-1 text-sm">
        Service needed
        <Input name="service" required placeholder="Leaking kitchen faucet" />
      </label>
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving" : "Request a tradie"}
      </Button>
      <p className="min-h-5 text-sm" role="status">
        {message}
      </p>
    </form>
  );
}
