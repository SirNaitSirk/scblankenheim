import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PackingChecklist } from "@/components/marketing/packing-checklist";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getLandingCamp } from "@/lib/marketing/current-camp";
import {
  formatCampDates,
  packingListMessages as copy,
  packingSections,
} from "@/lib/marketing/packing-list";

// Read the current camp on every request, like the landing page, so a camp
// switch in the admin shows up immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

/** "Sommercamp 2027 · 12.07.2027 bis 18.07.2027", or less when data is missing. */
function campLine(name: string, dates: string | null): string {
  return dates ? `${name} · ${dates}` : name;
}

/** Public packing list (specs/010-packing-list). Never shows prices. */
export default async function PackingListPage() {
  const camp = await getLandingCamp();
  const subtitle = camp
    ? campLine(camp.name, formatCampDates(camp.startDate, camp.endDate))
    : null;

  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <header className="mx-auto w-full max-w-[46rem] px-6 pt-10 md:pt-16">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {copy.home}
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[46rem] flex-1 px-6 pb-20 pt-12 md:pb-28 md:pt-20">
        <div className="print-sheet">
          <h1 className="font-display text-5xl font-black leading-[1.02] tracking-tight text-foreground text-balance md:text-6xl print:text-4xl print:text-black">
            {copy.title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base font-medium text-foreground print:mt-2 print:text-black">
              {subtitle}
            </p>
          )}
          <p className="mt-3 max-w-[48ch] text-lg leading-relaxed text-muted-foreground print:hidden">
            {copy.intro}
          </p>

          <div className="mt-12 print:mt-6">
            <PackingChecklist sections={packingSections} />
          </div>
        </div>

        <section className="mt-20 flex flex-col gap-5 rounded-card bg-surface p-8 shadow-card sm:flex-row sm:items-center sm:justify-between md:mt-28">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {copy.closingTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/#anmelden">{copy.register}</ButtonLink>
            <ButtonLink href="/" variant="ghost">
              {copy.backHome}
            </ButtonLink>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
