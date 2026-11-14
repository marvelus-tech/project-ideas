export type Space = "none" | "corner" | "spare-room" | "garage";
export type Capital = "none" | "under-100" | "100-500" | "more";
export type Trades = "yes" | "no" | "maybe";
export type AgentRole = "scout" | "matcher";
export type MessageKind = "message" | "tool-call" | "tool-result" | "card" | "event" | "notice";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface Profile {
  userId: string;
  interests: string;
  skills: string;
  hasIdea: boolean;
  ideaText: string;
  space: Space;
  capital: Capital;
  trades: Trades;
  location: string;
  constraints: string;
}

export interface Business {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  slug: string;
  city: string;
  createdAt: number;
}

export interface Agent {
  id: string;
  businessId: string;
  userId: string;
  role: AgentRole;
  name: string;
  title: string;
  instructions: string;
  status: "active" | "coming_soon";
  tokensUsed: number;
  computerSeconds: number;
  createdAt: number;
}

export interface Routine {
  id: string;
  agentId: string;
  name: string;
  prompt: string;
  scheduleLabel: string;
  intervalMs: number;
  enabled: boolean;
  nextRunAt: number | null;
  lastRunAt: number | null;
}

export interface StoredMessage {
  id: string;
  agentId: string;
  seq: number;
  kind: MessageKind;
  body: Record<string, unknown>;
  createdAt: number;
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address: string;
  service: string;
  source: string;
  createdAt: number;
}

export interface Approval {
  id: string;
  agentId: string;
  userId: string;
  rowId: string;
  callId: string;
  tool: string;
  status: "pending" | "allowed" | "denied" | "always" | "expired";
  createdAt: number;
  resolvedAt: number | null;
}

export type Trigger =
  | { type: "user"; text: string }
  | { type: "routine"; routineId: string; name: string; prompt: string }
  | { type: "resume" };

export interface PendingState {
  calls: { callId: string; name: string; arguments: string; rowId: string }[];
  outputs: { callId: string; output: string }[];
  approvalId: string;
  startSeq: number;
}
