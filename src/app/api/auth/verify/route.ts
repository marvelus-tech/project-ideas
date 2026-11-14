import { NextResponse } from "next/server";
import { startSession } from "@/lib/session";
import { createUser, getUserByEmail } from "@/lib/store";
import { verifyMagicLink } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { tokenHash?: string; type?: string };
  if (!body.tokenHash) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  const result = await verifyMagicLink(body.tokenHash, body.type || "magiclink");
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "unconfigured" ? "Supabase keys are not set." : "That link could not be verified." },
      { status: 400 },
    );
  }
  const user = getUserByEmail(result.email) ?? createUser({ email: result.email, name: result.email.split("@")[0] || "Owner" });
  await startSession(user);
  return NextResponse.json({ ok: true });
}
