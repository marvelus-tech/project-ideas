import { NextResponse } from "next/server";
import { enqueue } from "@/lib/agent/loop";
import { currentUser } from "@/lib/session";
import { getAgent, listRows } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await context.params;
  const agent = getAgent(id);
  if (!user || !agent || agent.userId !== user.id) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (!text) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  await enqueue(agent.id, { type: "user", text });
  return NextResponse.json({ rows: listRows(agent.id) });
}
