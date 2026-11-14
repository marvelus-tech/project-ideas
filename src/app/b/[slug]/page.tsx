import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskSite } from "@/components/desk-site";
import { siteCopy } from "@/lib/copy";
import { businessDescription, businessTitle } from "@/lib/seo";
import { getBusinessBySlug, getProfile } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) {
    return { title: { absolute: "CNSTRCT missing page | This desk was not found here" }, robots: { index: false, follow: false } };
  }
  const title = businessTitle(business.name, business.city);
  const description = businessDescription(business.name, business.city);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/b/${business.slug}` },
    openGraph: { title, description, url: `/b/${business.slug}`, type: "website" },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = getBusinessBySlug(slug);
  if (!business) notFound();
  const profile = getProfile(business.userId);
  if (!profile) notFound();
  return <DeskSite name={business.name} slug={business.slug} copy={siteCopy(profile, business.name, business.city)} />;
}
