import { NextResponse } from "next/server";
import { countRecentLeads, getBusinessBySlug, insertLead } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { slug?: string; name?: string; phone?: string; address?: string; service?: string };
  const business = body.slug ? getBusinessBySlug(body.slug) : null;
  if (!business) return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const address = body.address?.trim() ?? "";
  const service = body.service?.trim() ?? "";
  if (name.length < 2 || address.length < 4 || service.length < 2) {
    return NextResponse.json({ error: "Name, address, and the service are required." }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "Enter a phone number we can read." }, { status: 400 });
  if (countRecentLeads(business.id, Date.now() - 60 * 60 * 1000) > 30) {
    return NextResponse.json({ error: "This desk has enough new requests for the hour." }, { status: 429 });
  }
  const lead = insertLead({ businessId: business.id, name, phone, address, service, source: "site" });
  return NextResponse.json({ ok: true, id: lead.id });
}
