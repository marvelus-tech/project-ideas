import { NextResponse } from "next/server";
import { loadDesk } from "@/lib/desk";
import { ensureDemoUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const user = await ensureDemoUser();
  return NextResponse.json({ user, desk: loadDesk(user.id) });
}

export async function GET() {
  const user = await ensureDemoUser();
  return NextResponse.json({ user, desk: loadDesk(user.id) });
}
