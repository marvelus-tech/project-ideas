import type { ModelInput, ModelResult } from "./contracts";
import { TRADIES } from "./directory";
import { TOKENS_PER_MOCK_TURN } from "./limits";
import { systemPrompt } from "./prompts";

/**
 * Model provider. grokbot-clone called only the xAI Responses API.
 * CNSTRCT calls that same vendor when XAI_API_KEY is set (OpenAI-compatible
 * chat completions), or OPENAI_API_KEY otherwise. With neither key, a scripted
 * model drives the same tool loop so the demo still finishes.
 */

function toolResult(input: ModelInput, tool: string) {
  return input.turnRows.filter((row) => row.kind === "tool-result" && row.body.tool === tool);
}

function scoutPlan(input: ModelInput): ModelResult {
  const city = input.business.city;
  const search = toolResult(input, "shell").find((row) => row.body.status === "done");
  const wrote = toolResult(input, "write_file").find((row) => row.body.status === "done");
  const looked = toolResult(input, "screenshot").find((row) => row.body.status === "done");
  const sent = toolResult(input, "send_outreach");
  const last = sent.at(-1);
  if (!search) {
    return {
      text: "",
      calls: [{ name: "shell", arguments: { command: `cnstrct-search tradies --city "${city}"` } }],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!wrote) {
    const notes = [
      `# Tradies near ${city}`,
      "",
      input.profile.interests ? `Owner is into ${input.profile.interests}.` : "",
      "",
      ...TRADIES.map((tradie) => `- ${tradie.name} (${tradie.trade}) ${tradie.contact}`),
      "",
      "Next step is a partnership note. It does not send until the owner approves.",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      text: "",
      calls: [{ name: "write_file", arguments: { path: "notes/tradies.md", content: notes } }],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!looked) {
    return { text: "", calls: [{ name: "screenshot", arguments: {} }], tokens: TOKENS_PER_MOCK_TURN };
  }
  if (last?.body.status === "denied") {
    return {
      text: "Understood. I will not send that note. The draft is still in the chat if you want a different angle.",
      calls: [],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!last) {
    const tradie = TRADIES[0]!;
    const body = [
      `Hi ${tradie.name.split(" ")[0]},`,
      "",
      `I run ${input.business.name} in ${city}. Homeowners ask me for ${tradie.trade} work, and I would like to send you those jobs.`,
      "You keep your rate. I keep a small margin when the job is booked. No fee until then.",
      "",
      "Want me to send a first job your way?",
      "",
      input.agent.name,
    ].join("\n");
    return {
      text: "I drafted a partnership note. Nothing goes out until you approve it.",
      calls: [
        {
          name: "send_outreach",
          arguments: {
            to: tradie.contact,
            channel: "email",
            subject: `${input.business.name}: local ${tradie.trade} jobs in ${city}`,
            body,
          },
        },
      ],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  return {
    text: "Logged as sent on this computer only. No email left the machine.",
    calls: [],
    tokens: TOKENS_PER_MOCK_TURN,
  };
}

function matcherPlan(input: ModelInput): ModelResult {
  const listed = toolResult(input, "list_leads").find((row) => row.body.status === "done");
  const wrote = toolResult(input, "write_file").find((row) => row.body.status === "done");
  const looked = toolResult(input, "screenshot").find((row) => row.body.status === "done");
  const sent = toolResult(input, "send_match");
  const last = sent.at(-1);
  const lead = input.leads[0];
  if (!listed) return { text: "", calls: [{ name: "list_leads", arguments: {} }], tokens: TOKENS_PER_MOCK_TURN };
  if (!lead) {
    return {
      text: "No homeowner leads yet. The public form on your site will drop them here.",
      calls: [],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!wrote) {
    const content = `# Lead\n\n${lead.name} needs ${lead.service} at ${lead.address}. Source: ${lead.source}. This is queued for a match, not sent.`;
    return {
      text: "",
      calls: [{ name: "write_file", arguments: { path: "notes/lead.md", content } }],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!looked) return { text: "", calls: [{ name: "screenshot", arguments: {} }], tokens: TOKENS_PER_MOCK_TURN };
  if (last?.body.status === "denied") {
    return {
      text: "I will not introduce them. The lead stays on the desk until you say otherwise.",
      calls: [],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  if (!last) {
    const tradie = TRADIES[0]!;
    return {
      text: `I drafted an introduction for ${lead.name}. It is an example lead, and it will not send until you approve.`,
      calls: [
        {
          name: "send_match",
          arguments: {
            to: tradie.contact,
            leadName: lead.name,
            tradieName: tradie.name,
            body: `${lead.name} in ${input.business.city} needs ${lead.service} at ${lead.address}. Phone ${lead.phone}. This is a CNSTRCT demo lead. Do not contact them outside this desk.`,
          },
        },
      ],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  return {
    text: "The introduction is logged on this computer only. Nobody was contacted.",
    calls: [],
    tokens: TOKENS_PER_MOCK_TURN,
  };
}

export function mockModel(input: ModelInput): ModelResult {
  const text = input.trigger.type === "user" ? input.trigger.text : "";
  const routine = input.trigger.type === "routine" || input.trigger.type === "resume";
  const wantsScout = input.agent.role === "scout" && (routine || /tradie|outreach|sweep|partner|find/i.test(text));
  const wantsMatch = input.agent.role === "matcher" && (routine || /lead|match|homeowner/i.test(text));
  if (wantsScout) return scoutPlan(input);
  if (wantsMatch) return matcherPlan(input);
  if (/spend|buy ads|boost/i.test(text)) {
    const already = toolResult(input, "spend").at(-1);
    if (already?.body.status === "denied") {
      return { text: "I will not spend that. No card was charged.", calls: [], tokens: TOKENS_PER_MOCK_TURN };
    }
    if (already?.body.status === "done") {
      return { text: "The charge is recorded as a mock. Nothing was billed.", calls: [], tokens: TOKENS_PER_MOCK_TURN };
    }
    return {
      text: "That would spend money. I will not do it unless you approve.",
      calls: [{ name: "spend", arguments: { amountUsd: 25, purpose: "Local listing test" } }],
      tokens: TOKENS_PER_MOCK_TURN,
    };
  }
  return {
    text: `I am ${input.agent.name} on ${input.business.name}. I can look for tradies or draft a note, and I will ask before anything is sent or paid.`,
    calls: [],
    tokens: TOKENS_PER_MOCK_TURN,
  };
}

function liveConfigured() {
  if (process.env.XAI_API_KEY) return { key: process.env.XAI_API_KEY, base: "https://api.x.ai/v1", model: process.env.XAI_MODEL || "grok-4.7", vendor: "xai" as const };
  if (process.env.OPENAI_API_KEY) {
    return {
      key: process.env.OPENAI_API_KEY,
      base: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      vendor: "openai" as const,
    };
  }
  return null;
}

export function modelMode(): "mock" | "xai" | "openai" {
  return liveConfigured()?.vendor ?? "mock";
}

export async function callModel(input: ModelInput, schemas: unknown[]): Promise<ModelResult> {
  const live = liveConfigured();
  if (!live) return mockModel(input);
  const messages: Record<string, unknown>[] = [
    { role: "system", content: systemPrompt(input.agent, input.business, input.profile) },
  ];
  for (const row of input.turnRows) {
    if (row.kind === "message" && row.body.role === "user") messages.push({ role: "user", content: String(row.body.text ?? "") });
    if (row.kind === "message" && row.body.role === "assistant" && row.body.text) {
      messages.push({ role: "assistant", content: String(row.body.text) });
    }
    if (row.kind === "tool-result") {
      messages.push({ role: "user", content: `Tool ${String(row.body.tool)} ${String(row.body.status)}: ${String(row.body.output ?? "")}` });
    }
  }
  if (input.trigger.type === "routine") {
    messages.push({ role: "user", content: `[Routine "${input.trigger.name}" is running now. Do this:]\n${input.trigger.prompt}` });
  }
  const response = await fetch(`${live.base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${live.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: live.model, messages, tools: schemas, temperature: 0.3 }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Model request failed (${response.status}).`);
  const json = (await response.json()) as {
    usage?: { total_tokens?: number };
    choices?: { message?: { content?: string; tool_calls?: { id: string; function?: { name?: string; arguments?: string } }[] } }[];
  };
  const message = json.choices?.[0]?.message;
  const calls = (message?.tool_calls ?? []).map((call) => ({
    name: call.function?.name || "unknown",
    arguments: JSON.parse(call.function?.arguments || "{}") as Record<string, unknown>,
  }));
  return {
    text: message?.content?.trim() || "",
    calls,
    tokens: json.usage?.total_tokens || TOKENS_PER_MOCK_TURN,
  };
}
