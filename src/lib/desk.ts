import { computerSnapshot } from "./agent/sandbox";
import { COMPUTER_LIMIT_SECONDS, TOKEN_LIMIT } from "./agent/limits";
import { modelMode } from "./agent/model";
import { getBusinessForUser, getProfile, getUser, listAgents, listLeads, listRoutines, listRows } from "./store";

export function loadDesk(userId: string) {
  const user = getUser(userId);
  if (!user) return null;
  const profile = getProfile(userId);
  const business = getBusinessForUser(userId);
  const agents = business
    ? listAgents(business.id).map((agent) => ({
        ...agent,
        rows: listRows(agent.id),
        routines: listRoutines(agent.id),
        computer: computerSnapshot(agent.id),
      }))
    : [];
  return {
    user,
    profile,
    business,
    agents,
    leads: business ? listLeads(business.id) : [],
    modelMode: modelMode(),
    composioConfigured: Boolean(process.env.COMPOSIO_API_KEY),
    limits: { tokens: TOKEN_LIMIT, computerSeconds: COMPUTER_LIMIT_SECONDS },
  };
}

export type DeskPayload = NonNullable<ReturnType<typeof loadDesk>>;
