import type { Capital, Profile, Space, Trades } from "./types";

const SPACES: Space[] = ["none", "corner", "spare-room", "garage"];
const CAPITALS: Capital[] = ["none", "under-100", "100-500", "more"];
const TRADES: Trades[] = ["yes", "no", "maybe"];

function text(value: unknown, max = 280) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseProfile(userId: string, body: unknown): Profile | { error: string } {
  if (!body || typeof body !== "object") return { error: "Missing answers." };
  const input = body as Record<string, unknown>;
  const space = text(input.space) as Space;
  const capital = text(input.capital) as Capital;
  const trades = text(input.trades) as Trades;
  const location = text(input.location, 80);
  if (!SPACES.includes(space) || !CAPITALS.includes(capital) || !TRADES.includes(trades)) {
    return { error: "Choose one of the listed answers." };
  }
  if (location.length < 2) return { error: "Add a city or region." };
  const interests = text(input.interests);
  const skills = text(input.skills);
  if (interests.length < 2 || skills.length < 2) return { error: "Tell us a little about your interests and skills." };
  return {
    userId,
    interests,
    skills,
    hasIdea: input.hasIdea === true || input.hasIdea === "yes",
    ideaText: text(input.ideaText, 160),
    space,
    capital,
    trades,
    location,
    constraints: text(input.constraints, 240),
  };
}
