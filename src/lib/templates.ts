export interface TemplateDefinition {
  id: string;
  live: boolean;
  title: string;
  pitch: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "home-services",
    live: true,
    title: "Home services lead desk",
    pitch: "Connect homeowners who need work with local tradies, and keep a margin. No van, no inventory.",
  },
  {
    id: "mobile-detailing",
    live: false,
    title: "Mobile detailing booking desk",
    pitch: "Take driveway bookings and hand them to detailers who already have the gear. You keep the booking margin.",
  },
  {
    id: "estate-clearance",
    live: false,
    title: "Estate-clearance resale desk",
    pitch: "Collect house-clearance leads, draft pickup notes, and list items only after the owner approves.",
  },
];

export const NEXT_TEMPLATE_NOTES = [
  {
    id: "mobile-detailing",
    shape: "Same as home services: a public booking page, one agent who drafts shop partnerships, one who matches driveway jobs. Capital is a hose and a borrowed driveway.",
  },
  {
    id: "estate-clearance",
    shape: "A page for families clearing a house. One agent drafts pickup-partner notes. One drafts marketplace listings. Approval before any listing goes up. Capital is a tape measure and a storage corner.",
  },
  {
    id: "tutoring-match",
    shape: "A page for parents. One agent drafts tutor outreach. One drafts the introduction. Approval before anyone is introduced. Capital is a phone and a calendar.",
  },
];
