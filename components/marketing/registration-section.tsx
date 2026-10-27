import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { CountdownPanel } from "@/components/marketing/countdown-panel";
import { RegistrationForm } from "@/components/marketing/registration-form";
import {
  getActiveRegistrationCount,
  getCampAvailability,
} from "@/lib/marketing/availability";
import { getCountdownTarget, getLandingCamp } from "@/lib/marketing/current-camp";
import { registerMessages } from "@/lib/register/messages";
import {
  getRegistrationState,
  type RegistrationState,
} from "@/lib/register/registration-state";

const copy = registerMessages.section;

/** Active count only matters when a capacity is set; failures count as zero. */
async function loadActiveCount(campId: string, capacity: number | null): Promise<number> {
  if (capacity === null) return 0;
  try {
    return await getActiveRegistrationCount(campId);
  } catch {
    return 0;
  }
}

/**
 * The `#anmelden` moment. Server Component: reads the current camp, decides the
 * state with the shared rule (open, countdown, closed, full) and renders the
 * matching UI. Only the countdown and the form are client components.
 */
export async function RegistrationSection() {
  const camp = await getLandingCamp();
  const activeCount = camp ? await loadActiveCount(camp.id, camp.capacity) : 0;
  const state: RegistrationState = getRegistrationState(camp, new Date(), activeCount);
  const heading = copy[state];

  const target = camp && state === "countdown" ? getCountdownTarget(camp) : null;

  const availability =
    camp && state === "open"
      ? await getCampAvailability(camp.id, camp.fields)
      : {};

  return (
    <section id="anmelden" className="border-t border-border bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-amber-600">{heading.eyebrow}</span>
          <h2 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            {heading.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            {heading.intro}
          </p>
        </Reveal>

        <Reveal delay={120} className="mx-auto mt-12 max-w-2xl">
          {state === "open" && camp ? (
            <RegistrationForm fields={camp.fields} availability={availability} />
          ) : state === "countdown" && target ? (
            <CountdownPanel target={target.toISOString()} />
          ) : (
            <div className="flex justify-center">
              <ButtonLink href={copy.contactHref} size="lg" variant="outline">
                {copy.contact}
              </ButtonLink>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
