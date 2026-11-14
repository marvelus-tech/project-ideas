import { newId } from "../ids";
import {
  addUsage,
  appendRow,
  clearPending,
  getAgent,
  getApproval,
  getBusiness,
  getPending,
  getProfile,
  insertApproval,
  listLeads,
  listRows,
  maxSeq,
  rowsSince,
  setApprovalStatus,
  setPending,
  setPolicy,
  updateRow,
} from "../store";
import type { PendingState, Trigger } from "../types";
import { TOKEN_LIMIT } from "./limits";
import { callModel, mockModel } from "./model";
import { describeArgs, policyFor } from "./policy";
import { runTool, toolSchemas } from "./tools";

/**
 * Turn loop adapted from grokbot-clone server/src/agent/loop.ts (MIT).
 * One queue per agent. Tool calls run in order. A gated tool writes an
 * approval card and stores the rest of the batch in pending_turns. Allow
 * or deny resumes that batch. A newer user message expires an open card,
 * which is how grokbot keeps a single pending turn.
 */

const queues = new Map<string, Promise<void>>();
const MAX_STEPS = 8;

export function enqueue(agentId: string, trigger: Trigger) {
  const prev = queues.get(agentId) ?? Promise.resolve();
  const next = prev.then(() => runTurn(agentId, trigger)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Turn failed";
    appendRow(agentId, "notice", { tone: "error", text: message });
  });
  queues.set(agentId, next);
  next.finally(() => {
    if (queues.get(agentId) === next) queues.delete(agentId);
  });
  return next;
}

async function runTurn(agentId: string, trigger: Trigger) {
  const agent = getAgent(agentId);
  if (!agent) return;
  const business = getBusiness(agent.businessId);
  const profile = getProfile(agent.userId);
  if (!business || !profile) return;

  if (trigger.type !== "resume") {
    const pending = getPending(agentId);
    if (pending) expirePending(agentId, pending);
  }

  let startSeq = maxSeq(agentId) + 1;
  if (trigger.type === "resume") {
    const state = getPending(agentId);
    if (!state) return;
    startSeq = state.startSeq;
    const paused = await processCalls(agentId, state);
    if (paused) return;
  } else if (trigger.type === "user") {
    appendRow(agentId, "message", { role: "user", text: trigger.text });
  } else {
    appendRow(agentId, "event", {
      event: "routine-run",
      text: `Running routine: ${trigger.name}`,
      routineId: trigger.routineId,
    });
  }

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const fresh = getAgent(agentId);
    if (!fresh) return;
    if (fresh.tokensUsed >= TOKEN_LIMIT) {
      appendRow(agentId, "notice", {
        tone: "error",
        text: "Demo token budget is used up (50,000). This desk stops model calls at the cap.",
      });
      return;
    }
    const visible = rowsSince(agentId, startSeq);
    const modelInput = {
      agent: fresh,
      business,
      profile,
      trigger,
      turnRows: visible,
      leads: listLeads(business.id),
    };
    let result;
    try {
      result = await callModel(modelInput, toolSchemas());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model failed";
      appendRow(agentId, "notice", { tone: "info", text: `${message} Falling back to the scripted demo model.` });
      result = mockModel(modelInput);
    }
    addUsage(agentId, result.tokens, 0);
    if (result.text) appendRow(agentId, "message", { role: "assistant", text: result.text });
    if (!result.calls.length) return;

    const state: PendingState = {
      calls: result.calls.map((call) => {
        const callId = newId("call");
        const row = appendRow(agentId, "tool-call", {
          callId,
          name: call.name,
          args: call.arguments,
          status: "running",
        });
        return { callId, name: call.name, arguments: JSON.stringify(call.arguments), rowId: row.id };
      }),
      outputs: [],
      approvalId: "",
      startSeq,
    };
    const paused = await processCalls(agentId, state);
    if (paused) return;
  }
}

async function processCalls(agentId: string, state: PendingState) {
  const agent = getAgent(agentId);
  const business = agent ? getBusiness(agent.businessId) : null;
  if (!agent || !business) return false;

  while (state.calls.length) {
    const call = state.calls[0]!;
    const args = parseArgs(call.arguments);
    const approval = state.approvalId ? getApproval(state.approvalId) : null;
    let decision = policyFor(agent.userId, call.name).decision;
    if (approval && approval.callId === call.callId) {
      if (approval.status === "pending") return true;
      decision = approval.status === "denied" || approval.status === "expired" ? "block" : "allow";
      state.approvalId = "";
    } else if (decision === "ask") {
      const policy = policyFor(agent.userId, call.name);
      const approvalId = newId("apr");
      const card = appendRow(agentId, "card", {
        card: "approval",
        approvalId,
        title: `Allow ${agent.name} to ${policy.title}?`,
        detail: describeArgs(args),
        tool: call.name,
        args,
        status: "pending",
      });
      insertApproval({
        id: approvalId,
        agentId,
        userId: agent.userId,
        rowId: card.id,
        callId: call.callId,
        tool: call.name,
      });
      markTool(agentId, call.rowId, "awaiting-approval");
      state.approvalId = approvalId;
      setPending(agentId, state);
      return true;
    }

    if (decision === "block") {
      appendRow(agentId, "tool-result", {
        tool: call.name,
        callId: call.callId,
        output: "The user declined this action. Do not retry it.",
        status: "denied",
        summary: "Not allowed",
        args,
      });
      markTool(agentId, call.rowId, "denied");
      state.calls.shift();
      continue;
    }

    const outcome = await runTool(call.name, args, { agent, business, city: business.city });
    appendRow(agentId, "tool-result", {
      tool: call.name,
      callId: call.callId,
      output: outcome.output,
      status: outcome.status,
      summary: outcome.summary,
      args,
    });
    markTool(agentId, call.rowId, outcome.status === "done" ? "done" : "error");
    state.calls.shift();
  }

  clearPending(agentId);
  return false;
}

function expirePending(agentId: string, state: PendingState) {
  if (state.approvalId) {
    const approval = getApproval(state.approvalId);
    if (approval?.status === "pending") {
      setApprovalStatus(approval.id, "expired");
      const card = listRows(agentId).find((row) => row.id === approval.rowId);
      if (card) updateRow(card.id, { ...card.body, status: "expired" });
    }
  }
  for (const call of state.calls) {
    appendRow(agentId, "tool-result", {
      tool: call.name,
      callId: call.callId,
      output: "Skipped: a new message arrived before approval.",
      status: "denied",
      summary: "Skipped",
    });
    markTool(agentId, call.rowId, "denied");
  }
  clearPending(agentId);
}

function markTool(agentId: string, rowId: string, status: string) {
  const row = listRows(agentId).find((item) => item.id === rowId);
  if (!row) return;
  updateRow(rowId, { ...row.body, status });
}

function parseArgs(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function resolveApproval(userId: string, approvalId: string, decision: "allow" | "always" | "deny") {
  const approval = getApproval(approvalId);
  if (!approval || approval.userId !== userId) throw new Error("Approval not found.");
  if (approval.status !== "pending") return Promise.resolve();
  const status = decision === "deny" ? "denied" : decision === "always" ? "always" : "allowed";
  setApprovalStatus(approval.id, status);
  if (decision === "always") setPolicy(userId, approval.tool, "always_allow");
  const card = listRows(approval.agentId).find((row) => row.id === approval.rowId);
  if (card) updateRow(card.id, { ...card.body, status });
  return enqueue(approval.agentId, { type: "resume" });
}
