export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function sendMagicLink(email: string, origin: string) {
  const supabase = config();
  if (!supabase) return { ok: false as const, reason: "unconfigured" as const };
  const response = await fetch(`${supabase.url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: { email_redirect_to: `${origin}/auth/callback` },
    }),
  });
  if (!response.ok) {
    return { ok: false as const, reason: "provider" as const, detail: (await response.text()).slice(0, 300) };
  }
  return { ok: true as const };
}

export async function verifyMagicLink(tokenHash: string, type: string) {
  const supabase = config();
  if (!supabase) return { ok: false as const, reason: "unconfigured" as const };
  const response = await fetch(`${supabase.url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, token_hash: tokenHash }),
  });
  if (!response.ok) return { ok: false as const, reason: "provider" as const };
  const json = (await response.json()) as { user?: { email?: string } };
  const email = json.user?.email;
  if (!email) return { ok: false as const, reason: "provider" as const };
  return { ok: true as const, email };
}
