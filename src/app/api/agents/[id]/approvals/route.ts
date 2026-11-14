import { NextResponse } from "next/server";
import { resolveApproval } from "@/lib/agent/loop";
import { currentUser } from "@/lib/session";
import { getAgent, listRows } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await context.params;
  const agent = getAgent(id);
  if (!user || !agent || agent.userId !== user.id) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  const body = (await request.json()) as { approvalId?: string; decision?: "allow" | "deny" | "always" };
  if (!body.approvalId || !body.decision) return NextResponse.json({ error: "Missing decision." }, { status: 400 });
  try {
    await resolveApproval(user.id, body.approvalId, body.decision);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not resolve that card.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ rows: listRows(agent.id) });
}
