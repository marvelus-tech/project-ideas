import type { Metadata } from "next";
import { TriageFlow } from "@/components/triage-flow";
import { TRIAGE_DESCRIPTION, TRIAGE_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: TRIAGE_TITLE },
  description: TRIAGE_DESCRIPTION,
  alternates: { canonical: "/triage" },
  robots: { index: false, follow: false },
};

export default function TriagePage() {
  return <TriageFlow />;
}
