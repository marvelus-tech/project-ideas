import { businessName, cityOf } from "../copy";
import { newId } from "../ids";
import { getAgent, getBusinessForUser, insertAgent, insertBusiness, insertLead, insertRoutine, listAgents, slugTaken, upsertComputer } from "../store";
import type { Agent, Business, Profile } from "../types";
import { configuredProvider, ensureWorkspace, providerNote } from "./sandbox";
import { runRoutine } from "./scheduler";

const DAY = 24 * 60 * 60 * 1000;

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "desk";
}

function uniqueSlug(name: string) {
  const base = slugify(name);
  if (!slugTaken(base)) return base;
  return `${base}-${newId("s").slice(-4)}`;
}

function scoutInstructions(city: string) {
  return `Find tradies who work in ${city}. Save notes on your computer. Draft one partnership email and wait for approval before any send. Never spend money.`;
}

function matcherInstructions(city: string) {
  return `Read homeowner leads for ${city}. Save a short match note. Draft one introduction to a tradie and wait for approval. Example leads are not real customers.`;
}

export async function openDesk(userId: string, profile: Profile): Promise<{ business: Business; agents: Agent[] }> {
  const existing = getBusinessForUser(userId);
  if (existing) return { business: existing, agents: listAgents(existing.id) };

  const city = cityOf(profile.location);
  const name = businessName(profile);
  const business = insertBusiness({
    userId,
    templateId: "home-services",
    name,
    slug: uniqueSlug(name),
    city,
  });

  const scout = insertAgent({
    businessId: business.id,
    userId,
    role: "scout",
    name: "Mara",
    title: "Tradie scout",
    instructions: scoutInstructions(city),
    status: "active",
  });
  const matcher = insertAgent({
    businessId: business.id,
    userId,
    role: "matcher",
    name: "Jules",
    title: "Lead matcher",
    instructions: matcherInstructions(city),
    status: "active",
  });

  for (const agent of [scout, matcher]) {
    ensureWorkspace(agent.id);
    const provider = configuredProvider();
    upsertComputer(agent.id, provider, "running", providerNote(provider));
  }

  const scoutRoutine = insertRoutine({
    agentId: scout.id,
    name: "Weekday tradie sweep",
    prompt: `Search tradies in ${city}, save notes/tradies.md, and draft one partnership email. Do not send it.`,
    scheduleLabel: "Weekdays at 8:00",
    intervalMs: DAY,
    enabled: true,
    nextRunAt: null,
  });
  const matchRoutine = insertRoutine({
    agentId: matcher.id,
    name: "New lead check",
    prompt: "Read the newest homeowner lead, save a match note, and draft an introduction. Do not send it.",
    scheduleLabel: "Every morning",
    intervalMs: DAY,
    enabled: true,
    nextRunAt: null,
  });

  insertLead({
    businessId: business.id,
    name: "Alex Rivera",
    phone: "555-0100",
    address: `12 Pine Street, ${city}`,
    service: "Kitchen faucet leak",
    source: "example",
  });

  await runRoutine(scoutRoutine.id);
  await runRoutine(matchRoutine.id);

  return {
    business,
    agents: [getAgent(scout.id), getAgent(matcher.id)].filter((agent): agent is Agent => Boolean(agent)),
  };
}
