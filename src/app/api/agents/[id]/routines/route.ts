import { NextResponse } from "next/server";
import { runRoutine } from "@/lib/agent/scheduler";
import { currentUser } from "@/lib/session";
import { getAgent, getRoutine } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await context.params;
  const agent = getAgent(id);
  if (!user || !agent || agent.userId !== user.id) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  const body = (await request.json()) as { routineId?: string };
  const routine = body.routineId ? getRoutine(body.routineId) : null;
  if (!routine || routine.agentId !== agent.id) return NextResponse.json({ error: "Routine not found." }, { status: 404 });
  await runRoutine(routine.id);
  return NextResponse.json({ ok: true });
}
