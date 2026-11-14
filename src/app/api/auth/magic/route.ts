import { NextResponse } from "next/server";
import { sendMagicLink } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim() ?? "";
  if (!email.includes("@")) return NextResponse.json({ error: "Enter an email address." }, { status: 400 });
  const origin = new URL(request.url).origin;
  const result = await sendMagicLink(email, origin);
  if (!result.ok && result.reason === "unconfigured") {
    return NextResponse.json(
      { error: "Magic links need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Continue with the demo session." },
      { status: 400 },
    );
  }
  if (!result.ok) return NextResponse.json({ error: "The email provider rejected that request." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
