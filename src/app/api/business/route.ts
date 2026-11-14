import { NextResponse } from "next/server";
import { openDesk } from "@/lib/agent/provision";
import { currentUser } from "@/lib/session";
import { getProfile } from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Start the triage first." }, { status: 401 });
  const profile = getProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Answer the triage first." }, { status: 401 });
  const desk = await openDesk(user.id, profile);
  return NextResponse.json({ business: desk.business, agents: desk.agents, sitePath: `/b/${desk.business.slug}` });
}
