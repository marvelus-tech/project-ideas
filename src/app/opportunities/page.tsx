import type { Metadata } from "next";
import { OpportunityBoard } from "@/components/opportunity-board";
import { OPPORTUNITIES_DESCRIPTION, OPPORTUNITIES_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: OPPORTUNITIES_TITLE },
  description: OPPORTUNITIES_DESCRIPTION,
  alternates: { canonical: "/opportunities" },
  robots: { index: false, follow: false },
};

export default function OpportunitiesPage() {
  return <OpportunityBoard />;
}
