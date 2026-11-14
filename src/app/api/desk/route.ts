import { NextResponse } from "next/server";
import { loadDesk } from "@/lib/desk";
import { ensureDemoUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await ensureDemoUser();
  return NextResponse.json(loadDesk(user.id));
}
