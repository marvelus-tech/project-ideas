export interface Tradie {
  name: string;
  trade: string;
  contact: string;
}

export const TRADIES: Tradie[] = [
  { name: "North Loop Plumbing", trade: "plumber", contact: "sam@northloop.example" },
  { name: "Ridge Electric", trade: "electrician", contact: "casey@ridge.example" },
  { name: "Sunday Paint Co", trade: "painter", contact: "june@sundaypaint.example" },
];

export function searchTradies(city: string) {
  const header = `Local tradies near ${city}. Contacts are example addresses only.`;
  const lines = TRADIES.map((tradie) => `${tradie.name} | ${tradie.trade} | ${tradie.contact} | serves ${city}`);
  return [header, ...lines].join("\n");
}
