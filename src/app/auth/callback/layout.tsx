import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CALLBACK_DESCRIPTION, CALLBACK_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: CALLBACK_TITLE },
  description: CALLBACK_DESCRIPTION,
  alternates: { canonical: "/auth/callback" },
  robots: { index: false, follow: false },
};

export default function CallbackLayout({ children }: { children: ReactNode }) {
  return children;
}
