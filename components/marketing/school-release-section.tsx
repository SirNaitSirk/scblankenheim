import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { getLandingCamp } from "@/lib/marketing/current-camp";
import { getReleaseSettings } from "@/lib/school-release/data";
import { releaseMessages } from "@/lib/school-release/messages";
import { formatReleaseDates, isReleaseActive } from "@/lib/school-release/settings";
import { berlinDate } from "@/lib/time/berlin";
import { SchoolReleaseLinkForm } from "./school-release-link-form";

const copy = releaseMessages.landing;

/**
 * "Schule am Brückentag?" (specs/020-school-release, US2): shown only while the
 * release letter is on for the current camp and the camp is not over. People
 * request the link to their participant page by mail and create the letter
 * there. Anchored as `#schulbefreiung`.
 */
export async function SchoolReleaseSection() {
  const camp = await getLandingCamp();
  if (!camp) return null;
  if (camp.endDate && camp.endDate < berlinDate(new Date())) return null;

  let settings;
  try {
    settings = await getReleaseSettings(camp.id);
  } catch {
    return null; // the landing page never breaks because of this section
  }
  if (!isReleaseActive(settings)) return null;

  return (
    <section id="schulbefreiung" className="scroll-mt-20 border-t border-border bg-sand-50">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-24 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-16 md:px-10 lg:py-32">
        <Reveal>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <GraduationCap size={18} weight="duotone" aria-hidden />
            {copy.eyebrow}
          </p>
          <h2 className="mt-5 max-w-[16ch] font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            {copy.heading}
          </h2>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
            {copy.intro(formatReleaseDates(settings.dates))}
          </p>
        </Reveal>

        <Reveal delay={120} className="rounded-card border border-amber-100 bg-surface p-6 shadow-warm sm:p-8">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.how}</p>
          <SchoolReleaseLinkForm />
        </Reveal>
      </div>
    </section>
  );
}
