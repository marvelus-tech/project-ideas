import { NextResponse } from "next/server";
import { parseProfile } from "@/lib/profile";
import { ensureDemoUser } from "@/lib/session";
import { saveProfile } from "@/lib/store";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const user = await ensureDemoUser();
  const parsed = parseProfile(user.id, await request.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  saveProfile(parsed);
  return NextResponse.json({ ok: true });
}
