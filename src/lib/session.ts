import { cookies } from "next/headers";
import { newId } from "./ids";
import { createSession, createUser, userForSession } from "./store";
import type { User } from "./types";

const COOKIE = "cnstrct_sid";

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (!sid) return null;
  return userForSession(sid);
}

export async function ensureDemoUser(): Promise<User> {
  const existing = await currentUser();
  if (existing) return existing;
  const stamp = newId("demo");
  const user = createUser({ email: `${stamp}@cnstrct.local`, name: "Demo owner" });
  const sid = createSession(user.id);
  const jar = await cookies();
  jar.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return user;
}

export async function startSession(user: User) {
  const sid = createSession(user.id);
  const jar = await cookies();
  jar.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
