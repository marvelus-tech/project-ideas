import type { Agent, Business, Lead, Profile, StoredMessage, Trigger } from "../types";

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelResult {
  text: string;
  calls: ToolCallRequest[];
  tokens: number;
}

export interface ModelInput {
  agent: Agent;
  business: Business;
  profile: Profile;
  trigger: Trigger;
  turnRows: StoredMessage[];
  leads: Lead[];
}

export interface ToolContext {
  agent: Agent;
  business: Business;
  city: string;
}
