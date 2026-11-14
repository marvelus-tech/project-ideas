import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import type { siteCopy } from "@/lib/copy";

type Copy = ReturnType<typeof siteCopy>;

export function DeskSite({
  name,
  slug,
  copy,
}: {
  name: string;
  slug: string;
  copy: Copy;
}) {
  return (
    <div className="min-h-full bg-background">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Wordmark />
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
          Owner dashboard
        </Link>
      </header>
      <main>
        <section className="px-5 pb-12 pt-8 md:px-10 md:pt-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-accent">{copy.eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-6xl">{copy.hero}</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted">{copy.sub}</p>
            <a href="#lead" className="mt-8 inline-flex h-12 items-center rounded-full bg-accent px-6 text-white">
              Describe the job
            </a>
          </div>
        </section>
        <section id="how" className="border-y border-border bg-card px-5 py-14 md:px-10">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <article key={step.title}>
                <p className="text-sm text-accent">0{index + 1}</p>
                <h2 className="mt-2 font-serif text-2xl">{step.title}</h2>
                <p className="mt-2 text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="about" className="px-5 py-14 md:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-3xl">About {name}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{copy.about}</p>
          </div>
        </section>
        <section id="contact" className="px-5 pb-16 md:px-10">
          <div className="mx-auto grid max-w-5xl gap-8 rounded-[28px] border border-border bg-card p-6 md:grid-cols-2 md:p-10">
            <div>
              <h2 className="font-serif text-3xl">Request the work</h2>
              <p className="mt-3 text-muted">{copy.contact}</p>
            </div>
            <LeadForm slug={slug} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
