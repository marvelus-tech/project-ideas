import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { FAQS } from "@/lib/faq";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "CNSTRCT",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: HOME_DESCRIPTION,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Wordmark />
        <Link href="/triage" className="text-sm font-medium">
          Start
        </Link>
      </header>
      <main>
        <section className="px-5 pb-16 pt-10 md:px-10 md:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-medium text-accent">For people starting with almost nothing</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">Spin up a real business from almost nothing.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              CNSTRCT turns what you already have into a small business you can run this week. The first desk connects homeowners with local tradies. You keep a margin. You do not buy a van.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/triage" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-white">
                See what fits you
              </Link>
              <Link href="/b/harbor-tradie-desk" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-6">
                View a sample desk
              </Link>
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-card px-5 py-14 md:px-10">
          <ol className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[
              ["Tell us what you have", "Eight short questions. Skills, space, cash, and city. One at a time."],
              ["Pick the live desk", "Three cards. Two are coming soon. One opens a home-services business."],
              ["Approve the work", "Agents draft outreach on their own computer. Nothing is sent until you say yes."],
            ].map(([title, body], index) => (
              <li key={title}>
                <p className="text-sm text-accent">0{index + 1}</p>
                <h2 className="mt-2 font-serif text-2xl">{title}</h2>
                <p className="mt-2 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="px-5 py-16 md:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-4xl">Questions people ask first</h2>
            <div className="mt-8 divide-y divide-border">
              {FAQS.map((item) => (
                <article key={item.question} className="py-5">
                  <h3 className="text-lg font-medium">{item.question}</h3>
                  <p className="mt-2 text-muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
