import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

process.env.CNSTRCT_DATA_DIR = mkdtempSync(path.join(tmpdir(), "cnstrct-"));
delete process.env.ORGO_API_KEY;
delete process.env.ORGO_WORKSPACE_ID;
delete process.env.XAI_API_KEY;
delete process.env.OPENAI_API_KEY;

const profile = {
  userId: "",
  interests: "woodworking",
  skills: "talking to neighbors",
  hasIdea: true,
  ideaText: "a cookie stand",
  space: "corner" as const,
  capital: "none" as const,
  trades: "maybe" as const,
  location: "Austin, TX",
  constraints: "weeknights",
};

test("desk sweep asks before send and can be refused", async () => {
  const { createUser, getAgent, getProfile, listRows, saveProfile } = await import("../store");
  const { openDesk } = await import("./provision");
  const { resolveApproval } = await import("./loop");
  const { execInSandbox, readSandboxFile, sandboxRoot } = await import("./sandbox");
  const { liveCardCopy } = await import("../copy");
  const fs = await import("node:fs");
  const user = createUser({ email: "owner@cnstrct.local", name: "Owner" });
  profile.userId = user.id;
  saveProfile(profile);
  const card = liveCardCopy(getProfile(user.id)!);
  assert.match(card.summary, /Austin/);
  assert.match(card.summary, /basically no cash/);
  assert.match(card.summary, /cookie stand/);

  const desk = await openDesk(user.id, profile);
  assert.equal(desk.business.name, "Austin Tradie Desk");
  assert.equal(desk.business.city, "Austin");
  assert.equal(desk.agents.length, 2);

  const scout = desk.agents.find((agent) => agent.role === "scout")!;
  const matcher = desk.agents.find((agent) => agent.role === "matcher")!;
  const scoutRows = listRows(scout.id);
  const approval = scoutRows.find((row) => row.kind === "card" && row.body.status === "pending");
  assert.ok(approval, "scout should be waiting on an approval");
  assert.equal(approval.body.tool, "send_outreach");
  const args = approval.body.args as { to?: string; body?: string };
  assert.match(args.to ?? "", /\.example$/);
  assert.match(readSandboxFile(scout.id, "notes/tradies.md"), /Austin/);
  assert.equal(fs.existsSync(path.join(sandboxRoot(scout.id), "outbox", "outreach.json")), false);

  await resolveApproval(user.id, String(approval.body.approvalId), "deny");
  assert.equal(fs.existsSync(path.join(sandboxRoot(scout.id), "outbox", "outreach.json")), false);
  const after = listRows(scout.id);
  assert.equal(after.find((row) => row.id === approval.id)?.body.status, "denied");
  assert.ok(after.some((row) => row.kind === "message" && String(row.body.text).includes("will not send")));

  const matchCard = listRows(matcher.id).find((row) => row.kind === "card" && row.body.status === "pending");
  assert.ok(matchCard);
  await resolveApproval(user.id, String(matchCard.body.approvalId), "allow");
  const sent = JSON.parse(fs.readFileSync(path.join(sandboxRoot(matcher.id), "outbox", "matches.json"), "utf8")) as {
    network: boolean;
    mocked: boolean;
  }[];
  assert.equal(sent[0]?.network, false);
  assert.equal(sent[0]?.mocked, true);

  const latest = getAgent(scout.id)!;
  assert.ok(latest.tokensUsed > 0 && latest.tokensUsed < 50_000);
  assert.ok(latest.computerSeconds > 0 && latest.computerSeconds < 7_200);

  const blocked = await execInSandbox(scout.id, "curl https://example.com");
  assert.equal(blocked.exitCode, 126);
  assert.match(blocked.output, /blocked/i);
});
