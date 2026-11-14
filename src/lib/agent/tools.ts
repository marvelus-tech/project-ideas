import fs from "node:fs";
import path from "node:path";
import { COMPUTER_LIMIT_SECONDS, SECONDS_PER_COMPUTER_CALL } from "./limits";
import { addUsage, getAgent, listLeads } from "../store";
import type { ToolContext } from "./contracts";
import {
  ensureWorkspace,
  execInSandbox,
  listSandboxFiles,
  readSandboxFile,
  readTerminal,
  writeSandboxFile,
} from "./sandbox";

export interface ToolOutcome {
  output: string;
  summary: string;
  status: "done" | "error";
  computer: boolean;
}

const SCHEMAS = [
  { type: "function", function: { name: "shell", description: "Run a sandboxed command. cnstrct-search lists local tradies. Network commands are blocked.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } } },
  { type: "function", function: { name: "write_file", description: "Write a text file inside your computer.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } },
  { type: "function", function: { name: "read_file", description: "Read a file on your computer.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function", function: { name: "list_files", description: "List files on your computer.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "screenshot", description: "Describe your current screen from the files and terminal.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_leads", description: "Read homeowner leads captured on the business site.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "send_outreach", description: "Send a partnership email. Requires owner approval. In the demo this only records a local outbox file.", parameters: { type: "object", properties: { to: { type: "string" }, channel: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to", "subject", "body"] } } },
  { type: "function", function: { name: "send_match", description: "Introduce a homeowner lead to a tradie. Requires owner approval. Demo sends stay local.", parameters: { type: "object", properties: { to: { type: "string" }, leadName: { type: "string" }, tradieName: { type: "string" }, body: { type: "string" } }, required: ["to", "leadName", "body"] } } },
  { type: "function", function: { name: "spend", description: "Spend money. Requires owner approval. The demo never charges a card.", parameters: { type: "object", properties: { amountUsd: { type: "number" }, purpose: { type: "string" } }, required: ["amountUsd", "purpose"] } } },
];

export function toolSchemas() {
  return SCHEMAS;
}

function charge(agentId: string) {
  const agent = getAgent(agentId);
  if (agent && agent.computerSeconds + SECONDS_PER_COMPUTER_CALL > COMPUTER_LIMIT_SECONDS) {
    throw new Error("Computer hour limit reached for this demo (2 hours).");
  }
  addUsage(agentId, 0, SECONDS_PER_COMPUTER_CALL);
}

function recordOutbox(agentId: string, file: string, payload: Record<string, unknown>) {
  const rel = `outbox/${file}`;
  const root = ensureWorkspace(agentId);
  const abs = path.join(root, "outbox", file);
  const prior = fs.existsSync(abs) ? (JSON.parse(fs.readFileSync(abs, "utf8")) as unknown[]) : [];
  prior.push({ ...payload, mocked: true, network: false, at: new Date().toISOString() });
  writeSandboxFile(agentId, rel, JSON.stringify(prior, null, 2));
}

export async function runTool(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  try {
    switch (name) {
      case "shell": {
        charge(ctx.agent.id);
        const result = await execInSandbox(ctx.agent.id, String(args.command ?? ""), ctx.city);
        return {
          output: result.output,
          summary: result.exitCode === 0 ? "Command finished" : `Exit ${result.exitCode}`,
          status: result.exitCode === 0 ? "done" : "error",
          computer: true,
        };
      }
      case "write_file": {
        charge(ctx.agent.id);
        writeSandboxFile(ctx.agent.id, String(args.path ?? "notes/note.md"), String(args.content ?? ""));
        return { output: `Saved ${String(args.path)}`, summary: `Saved ${String(args.path)}`, status: "done", computer: true };
      }
      case "read_file": {
        charge(ctx.agent.id);
        const text = readSandboxFile(ctx.agent.id, String(args.path ?? ""));
        return { output: text.slice(0, 8000), summary: `Read ${String(args.path)}`, status: "done", computer: true };
      }
      case "list_files": {
        charge(ctx.agent.id);
        const files = listSandboxFiles(ctx.agent.id).map((file) => file.path).join("\n") || "(empty)";
        return { output: files, summary: "Listed files", status: "done", computer: true };
      }
      case "screenshot": {
        charge(ctx.agent.id);
        const files = listSandboxFiles(ctx.agent.id).map((file) => file.path).join(", ") || "none yet";
        const terminal = readTerminal(ctx.agent.id) || "(terminal is clear)";
        const output = `Desktop 1280x800. Files: ${files}.\nTerminal:\n${terminal}`;
        writeSandboxFile(ctx.agent.id, "notes/screen.txt", output);
        return { output, summary: "Looked at the screen", status: "done", computer: true };
      }
      case "list_leads": {
        const leads = listLeads(ctx.business.id);
        const output = leads.length
          ? leads.map((lead) => `${lead.name} | ${lead.service} | ${lead.address} | ${lead.phone} | ${lead.source}`).join("\n")
          : "No leads yet.";
        return { output, summary: `${leads.length} leads`, status: "done", computer: false };
      }
      case "send_outreach":
      case "send_match":
      case "spend": {
        charge(ctx.agent.id);
        const file = name === "send_outreach" ? "outreach.json" : name === "send_match" ? "matches.json" : "spend.json";
        recordOutbox(ctx.agent.id, file, args);
        const output =
          name === "spend"
            ? "Recorded a mock charge. No card was billed."
            : "Recorded locally. No message was sent on any network.";
        return { output, summary: "Recorded locally", status: "done", computer: true };
      }
      default:
        return { output: `Unknown tool ${name}`, summary: "Unknown tool", status: "error", computer: false };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed";
    return { output: message, summary: message, status: "error", computer: false };
  }
}
