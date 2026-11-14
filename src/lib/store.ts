import { getDb } from "./db";
import { newId } from "./ids";
import type {
  Agent,
  Approval,
  Business,
  Capital,
  Lead,
  PendingState,
  Profile,
  Routine,
  Space,
  StoredMessage,
  Trades,
  User,
} from "./types";

function db() {
  return getDb();
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

export function createUser(input: { email: string; name: string }): User {
  const user: User = { id: newId("user"), email: input.email, name: input.name, createdAt: Date.now() };
  db().prepare("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)").run(
    user.id,
    user.email,
    user.name,
    user.createdAt,
  );
  return user;
}

export function getUser(id: string): User | null {
  const row = asRecord(db().prepare("SELECT * FROM users WHERE id = ?").get(id));
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name), createdAt: Number(row.created_at) };
}

export function getUserByEmail(email: string): User | null {
  const row = asRecord(db().prepare("SELECT * FROM users WHERE email = ?").get(email));
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name), createdAt: Number(row.created_at) };
}

export function createSession(userId: string) {
  const id = newId("ses");
  db().prepare("INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)").run(id, userId, Date.now());
  return id;
}

export function userForSession(sessionId: string): User | null {
  const row = asRecord(
    db()
      .prepare(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?",
      )
      .get(sessionId),
  );
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name), createdAt: Number(row.created_at) };
}

export function saveProfile(profile: Profile) {
  db()
    .prepare(
      `INSERT INTO profiles (user_id, interests, skills, has_idea, idea_text, space, capital, trades, location, constraints, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         interests = excluded.interests,
         skills = excluded.skills,
         has_idea = excluded.has_idea,
         idea_text = excluded.idea_text,
         space = excluded.space,
         capital = excluded.capital,
         trades = excluded.trades,
         location = excluded.location,
         constraints = excluded.constraints,
         updated_at = excluded.updated_at`,
    )
    .run(
      profile.userId,
      profile.interests,
      profile.skills,
      profile.hasIdea ? 1 : 0,
      profile.ideaText,
      profile.space,
      profile.capital,
      profile.trades,
      profile.location,
      profile.constraints,
      Date.now(),
    );
}

export function getProfile(userId: string): Profile | null {
  const row = asRecord(db().prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId));
  if (!row) return null;
  return {
    userId: String(row.user_id),
    interests: String(row.interests),
    skills: String(row.skills),
    hasIdea: Number(row.has_idea) === 1,
    ideaText: String(row.idea_text),
    space: String(row.space) as Space,
    capital: String(row.capital) as Capital,
    trades: String(row.trades) as Trades,
    location: String(row.location),
    constraints: String(row.constraints),
  };
}

export function insertBusiness(input: Omit<Business, "id" | "createdAt">): Business {
  const business: Business = { ...input, id: newId("biz"), createdAt: Date.now() };
  db()
    .prepare(
      "INSERT INTO businesses (id, user_id, template_id, name, slug, city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(business.id, business.userId, business.templateId, business.name, business.slug, business.city, business.createdAt);
  return business;
}

function mapBusiness(row: Record<string, unknown>): Business {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    templateId: String(row.template_id),
    name: String(row.name),
    slug: String(row.slug),
    city: String(row.city),
    createdAt: Number(row.created_at),
  };
}

export function getBusinessBySlug(slug: string): Business | null {
  const row = asRecord(db().prepare("SELECT * FROM businesses WHERE slug = ?").get(slug));
  return row ? mapBusiness(row) : null;
}

export function getBusinessForUser(userId: string): Business | null {
  const row = asRecord(
    db().prepare("SELECT * FROM businesses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId),
  );
  return row ? mapBusiness(row) : null;
}

export function getBusiness(id: string): Business | null {
  const row = asRecord(db().prepare("SELECT * FROM businesses WHERE id = ?").get(id));
  return row ? mapBusiness(row) : null;
}

export function listBusinessSlugs(): string[] {
  return db()
    .prepare("SELECT slug FROM businesses ORDER BY created_at ASC")
    .all()
    .map((row) => String(asRecord(row)?.slug ?? ""));
}

export function slugTaken(slug: string) {
  return Boolean(db().prepare("SELECT 1 FROM businesses WHERE slug = ?").get(slug));
}

export function insertAgent(input: Omit<Agent, "id" | "createdAt" | "tokensUsed" | "computerSeconds">): Agent {
  const agent: Agent = {
    ...input,
    id: newId("agt"),
    tokensUsed: 0,
    computerSeconds: 0,
    createdAt: Date.now(),
  };
  db()
    .prepare(
      `INSERT INTO agents (id, business_id, user_id, role, name, title, instructions, status, tokens_used, computer_seconds, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    )
    .run(
      agent.id,
      agent.businessId,
      agent.userId,
      agent.role,
      agent.name,
      agent.title,
      agent.instructions,
      agent.status,
      agent.createdAt,
    );
  return agent;
}

function mapAgent(row: Record<string, unknown>): Agent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    userId: String(row.user_id),
    role: String(row.role) as Agent["role"],
    name: String(row.name),
    title: String(row.title),
    instructions: String(row.instructions),
    status: String(row.status) as Agent["status"],
    tokensUsed: Number(row.tokens_used),
    computerSeconds: Number(row.computer_seconds),
    createdAt: Number(row.created_at),
  };
}

export function getAgent(id: string): Agent | null {
  const row = asRecord(db().prepare("SELECT * FROM agents WHERE id = ?").get(id));
  return row ? mapAgent(row) : null;
}

export function listAgents(businessId: string): Agent[] {
  return db()
    .prepare("SELECT * FROM agents WHERE business_id = ? ORDER BY created_at ASC")
    .all(businessId)
    .map((row) => mapAgent(asRecord(row)!));
}

export function addUsage(agentId: string, tokens: number, computerSeconds: number) {
  db()
    .prepare(
      "UPDATE agents SET tokens_used = tokens_used + ?, computer_seconds = computer_seconds + ? WHERE id = ?",
    )
    .run(tokens, computerSeconds, agentId);
}

export function insertRoutine(input: Omit<Routine, "id" | "lastRunAt">): Routine {
  const routine: Routine = { ...input, id: newId("rtn"), lastRunAt: null };
  db()
    .prepare(
      `INSERT INTO routines (id, agent_id, name, prompt, schedule_label, interval_ms, enabled, next_run_at, last_run_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    )
    .run(
      routine.id,
      routine.agentId,
      routine.name,
      routine.prompt,
      routine.scheduleLabel,
      routine.intervalMs,
      routine.enabled ? 1 : 0,
      routine.nextRunAt,
    );
  return routine;
}

function mapRoutine(row: Record<string, unknown>): Routine {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    name: String(row.name),
    prompt: String(row.prompt),
    scheduleLabel: String(row.schedule_label),
    intervalMs: Number(row.interval_ms),
    enabled: Number(row.enabled) === 1,
    nextRunAt: row.next_run_at == null ? null : Number(row.next_run_at),
    lastRunAt: row.last_run_at == null ? null : Number(row.last_run_at),
  };
}

export function getRoutine(id: string): Routine | null {
  const row = asRecord(db().prepare("SELECT * FROM routines WHERE id = ?").get(id));
  return row ? mapRoutine(row) : null;
}

export function listRoutines(agentId: string): Routine[] {
  return db()
    .prepare("SELECT * FROM routines WHERE agent_id = ? ORDER BY name ASC")
    .all(agentId)
    .map((row) => mapRoutine(asRecord(row)!));
}

export function markRoutineRan(id: string, nextRunAt: number) {
  db().prepare("UPDATE routines SET last_run_at = ?, next_run_at = ? WHERE id = ?").run(Date.now(), nextRunAt, id);
}

export function dueRoutines(now = Date.now()): Routine[] {
  return db()
    .prepare("SELECT * FROM routines WHERE enabled = 1 AND next_run_at IS NOT NULL AND next_run_at <= ?")
    .all(now)
    .map((row) => mapRoutine(asRecord(row)!));
}

export function appendRow(agentId: string, kind: StoredMessage["kind"], body: Record<string, unknown>): StoredMessage {
  const seqRow = asRecord(db().prepare("SELECT COALESCE(MAX(seq), 0) AS n FROM messages WHERE agent_id = ?").get(agentId));
  const message: StoredMessage = {
    id: newId("msg"),
    agentId,
    seq: Number(seqRow?.n ?? 0) + 1,
    kind,
    body,
    createdAt: Date.now(),
  };
  db()
    .prepare("INSERT INTO messages (id, agent_id, seq, kind, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(message.id, message.agentId, message.seq, message.kind, JSON.stringify(message.body), message.createdAt);
  return message;
}

export function updateRow(id: string, body: Record<string, unknown>) {
  db().prepare("UPDATE messages SET body = ? WHERE id = ?").run(JSON.stringify(body), id);
}

function mapMessage(row: Record<string, unknown>): StoredMessage {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    seq: Number(row.seq),
    kind: String(row.kind) as StoredMessage["kind"],
    body: JSON.parse(String(row.body)) as Record<string, unknown>,
    createdAt: Number(row.created_at),
  };
}

export function listRows(agentId: string): StoredMessage[] {
  return db()
    .prepare("SELECT * FROM messages WHERE agent_id = ? ORDER BY seq ASC")
    .all(agentId)
    .map((row) => mapMessage(asRecord(row)!));
}

export function rowsSince(agentId: string, seq: number): StoredMessage[] {
  return db()
    .prepare("SELECT * FROM messages WHERE agent_id = ? AND seq >= ? ORDER BY seq ASC")
    .all(agentId, seq)
    .map((row) => mapMessage(asRecord(row)!));
}

export function maxSeq(agentId: string) {
  const row = asRecord(db().prepare("SELECT COALESCE(MAX(seq), 0) AS n FROM messages WHERE agent_id = ?").get(agentId));
  return Number(row?.n ?? 0);
}

export function insertApproval(
  input: Omit<Approval, "id" | "createdAt" | "resolvedAt" | "status"> & { id?: string; status?: Approval["status"] },
): Approval {
  const approval: Approval = {
    ...input,
    id: input.id ?? newId("apr"),
    status: input.status ?? "pending",
    createdAt: Date.now(),
    resolvedAt: null,
  };
  db()
    .prepare(
      "INSERT INTO approvals (id, agent_id, user_id, row_id, call_id, tool, status, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)",
    )
    .run(approval.id, approval.agentId, approval.userId, approval.rowId, approval.callId, approval.tool, approval.status, approval.createdAt);
  return approval;
}

export function getApproval(id: string): Approval | null {
  const row = asRecord(db().prepare("SELECT * FROM approvals WHERE id = ?").get(id));
  if (!row) return null;
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    userId: String(row.user_id),
    rowId: String(row.row_id),
    callId: String(row.call_id),
    tool: String(row.tool),
    status: String(row.status) as Approval["status"],
    createdAt: Number(row.created_at),
    resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
  };
}

export function setApprovalStatus(id: string, status: Approval["status"]) {
  db().prepare("UPDATE approvals SET status = ?, resolved_at = ? WHERE id = ?").run(status, Date.now(), id);
}

export function getPolicy(userId: string, tool: string): string | null {
  const row = asRecord(db().prepare("SELECT mode FROM policies WHERE user_id = ? AND tool = ?").get(userId, tool));
  return row ? String(row.mode) : null;
}

export function setPolicy(userId: string, tool: string, mode: string) {
  db()
    .prepare(
      `INSERT INTO policies (user_id, tool, mode) VALUES (?, ?, ?)
       ON CONFLICT(user_id, tool) DO UPDATE SET mode = excluded.mode`,
    )
    .run(userId, tool, mode);
}

export function setPending(agentId: string, state: PendingState) {
  db()
    .prepare(
      `INSERT INTO pending_turns (agent_id, state) VALUES (?, ?)
       ON CONFLICT(agent_id) DO UPDATE SET state = excluded.state`,
    )
    .run(agentId, JSON.stringify(state));
}

export function getPending(agentId: string): PendingState | null {
  const row = asRecord(db().prepare("SELECT state FROM pending_turns WHERE agent_id = ?").get(agentId));
  if (!row) return null;
  return JSON.parse(String(row.state)) as PendingState;
}

export function clearPending(agentId: string) {
  db().prepare("DELETE FROM pending_turns WHERE agent_id = ?").run(agentId);
}

export function insertLead(input: Omit<Lead, "id" | "createdAt">): Lead {
  const lead: Lead = { ...input, id: newId("lead"), createdAt: Date.now() };
  db()
    .prepare(
      "INSERT INTO leads (id, business_id, name, phone, address, service, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(lead.id, lead.businessId, lead.name, lead.phone, lead.address, lead.service, lead.source, lead.createdAt);
  return lead;
}

export function listLeads(businessId: string): Lead[] {
  return db()
    .prepare("SELECT * FROM leads WHERE business_id = ? ORDER BY created_at DESC")
    .all(businessId)
    .map((row) => {
      const record = asRecord(row)!;
      return {
        id: String(record.id),
        businessId: String(record.business_id),
        name: String(record.name),
        phone: String(record.phone),
        address: String(record.address),
        service: String(record.service),
        source: String(record.source),
        createdAt: Number(record.created_at),
      };
    });
}

export function countRecentLeads(businessId: string, since: number) {
  const row = asRecord(
    db().prepare("SELECT COUNT(*) AS n FROM leads WHERE business_id = ? AND created_at >= ?").get(businessId, since),
  );
  return Number(row?.n ?? 0);
}

export function upsertComputer(agentId: string, provider: string, status: string, note: string) {
  db()
    .prepare(
      `INSERT INTO computers (agent_id, provider, status, note, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(agent_id) DO UPDATE SET provider = excluded.provider, status = excluded.status, note = excluded.note, updated_at = excluded.updated_at`,
    )
    .run(agentId, provider, status, note, Date.now());
}

export function getComputer(agentId: string) {
  const row = asRecord(db().prepare("SELECT * FROM computers WHERE agent_id = ?").get(agentId));
  if (!row) return null;
  return {
    agentId: String(row.agent_id),
    provider: String(row.provider),
    status: String(row.status),
    note: String(row.note),
    updatedAt: Number(row.updated_at),
  };
}

export function deleteDesk(userId: string) {
  const business = getBusinessForUser(userId);
  if (!business) {
    db().prepare("DELETE FROM profiles WHERE user_id = ?").run(userId);
    return [];
  }
  const agents = listAgents(business.id);
  for (const agent of agents) {
    db().prepare("DELETE FROM messages WHERE agent_id = ?").run(agent.id);
    db().prepare("DELETE FROM approvals WHERE agent_id = ?").run(agent.id);
    db().prepare("DELETE FROM pending_turns WHERE agent_id = ?").run(agent.id);
    db().prepare("DELETE FROM routines WHERE agent_id = ?").run(agent.id);
    db().prepare("DELETE FROM computers WHERE agent_id = ?").run(agent.id);
  }
  db().prepare("DELETE FROM leads WHERE business_id = ?").run(business.id);
  db().prepare("DELETE FROM agents WHERE business_id = ?").run(business.id);
  db().prepare("DELETE FROM businesses WHERE id = ?").run(business.id);
  db().prepare("DELETE FROM profiles WHERE user_id = ?").run(userId);
  return agents.map((agent) => agent.id);
}
