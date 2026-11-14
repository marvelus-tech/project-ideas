import type { Metadata } from "next";
import { DashboardApp } from "@/components/dashboard-app";
import { DASHBOARD_DESCRIPTION, DASHBOARD_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: DASHBOARD_TITLE },
  description: DASHBOARD_DESCRIPTION,
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardApp />;
}
