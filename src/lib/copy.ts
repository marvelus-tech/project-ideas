import type { Capital, Profile, Space } from "./types";

export function cityOf(location: string) {
  const city = location.split(",")[0]?.trim() ?? "";
  return city || "your area";
}

export function businessName(profile: Profile) {
  return `${cityOf(profile.location)} Tradie Desk`;
}

export function capitalPhrase(capital: Capital) {
  switch (capital) {
    case "none":
      return "basically no cash";
    case "under-100":
      return "under $100";
    case "100-500":
      return "$100 to $500";
    case "more":
      return "more than $500";
  }
}

export function spacePhrase(space: Space) {
  switch (space) {
    case "none":
      return "no extra room at home";
    case "corner":
      return "a corner at home";
    case "spare-room":
      return "a spare room";
    case "garage":
      return "a garage or shed";
  }
}

export function liveCardCopy(profile: Profile) {
  const city = cityOf(profile.location);
  const name = businessName(profile);
  const cash = capitalPhrase(profile.capital);
  let summary = `${name} connects homeowners in ${city} with local tradies and keeps a margin when a job is booked. You can start with ${cash}. There is no van and no inventory to buy.`;
  if (profile.trades === "no") {
    summary += ` You said trades are not your first choice. This is still the one desk open today, and it can sit beside ${profile.interests || "what you already like"}.`;
  } else if (profile.trades === "maybe") {
    summary += ` You were unsure about trades. The day to day is matching and follow-up, which lines up with ${profile.skills || "talking to people"}.`;
  } else {
    summary += ` You are open to home services. Customers will feel your skill with ${profile.skills || "practical work"}.`;
  }
  if (profile.hasIdea && profile.ideaText.trim()) {
    summary += ` You also mentioned "${profile.ideaText.trim()}". This desk does not replace that idea. It is a way to earn while it stays on the shelf.`;
  }
  return {
    id: "home-services" as const,
    live: true,
    title: "Home services lead desk",
    name,
    city,
    summary,
  };
}

export function siteCopy(profile: Profile, businessNameText: string, city: string) {
  const interests = profile.interests.trim() || "local work";
  const skills = profile.skills.trim() || "getting a clear answer out of a messy job";
  const constraint = profile.constraints.trim();
  return {
    eyebrow: `Home services in ${city}`,
    hero: `${businessNameText} helps homeowners in ${city} book a plumber, electrician, or painter without the runaround.`,
    sub: `The homeowner describes the job. A local tradie who wants the work gets the introduction. The desk keeps a small margin. Started with ${capitalPhrase(profile.capital)} and ${spacePhrase(profile.space)}.`,
    steps: [
      { title: "Tell us the job", body: "Name, phone, address, and what needs doing. The form stays on this desk." },
      { title: "Match a tradie", body: "We introduce the job to a local pro who covers this area." },
      { title: "Keep the margin", body: "You earn when the job is booked. You do not buy parts or own a van." },
    ],
    about: `${businessNameText} is run by someone into ${interests}, and good at ${skills}. The working setup is ${spacePhrase(profile.space)}.${constraint ? ` Constraint they asked us to respect: ${constraint}.` : ""}`,
    contact: "Messages stay on this desk in the demo. They are not emailed or texted to anyone.",
  };
}
