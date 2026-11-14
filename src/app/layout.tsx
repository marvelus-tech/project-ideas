import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Outfit } from "next/font/google";
import { HOME_DESCRIPTION, HOME_TITLE, siteUrl } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: HOME_TITLE, template: "%s" },
  description: HOME_DESCRIPTION,
  applicationName: "CNSTRCT",
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: "CNSTRCT",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
