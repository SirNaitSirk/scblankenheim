import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { CountdownPanel } from "@/components/marketing/countdown-panel";
import { RegistrationForm } from "@/components/marketing/registration-form";
import { getCampAvailability } from "@/lib/marketing/availability";
import {
  getCountdownTarget,
  getLandingCamp,
  getRegistrationState,
} from "@/lib/marketing/current-camp";

const copy = {
  open: {
    eyebrow: "Anmeldung",
    heading: "Sichere dir deinen Platz",
    intro:
      "Fülle das Formular aus und sei beim Summercamp dabei. Wir freuen uns auf dich.",
  },
  countdown: {
    eyebrow: "Bald geht's los",
    heading: "Die Anmeldung öffnet in Kürze",
    intro:
      "Merk dir den Termin vor — sobald der Countdown abgelaufen ist, kannst du dich hier anmelden.",
  },
  closed: {
    eyebrow: "Anmeldung",
    heading: "Die Anmeldung ist derzeit geschlossen",
    intro:
      "Aktuell nehmen wir keine Anmeldungen entgegen. Bei Fragen zum nächsten Camp melde dich gern bei uns.",
    contact: "Schreib uns",
    contactHref: "mailto:info@fcg-blankenheim.de",
  },
} as const;

/**
 * The `#anmelden` moment. Server Component: reads the current camp via the anon
 * client, decides the state (open / countdown / closed), and renders the
 * matching UI. Only the countdown and the form are client components.
 */
export async function RegistrationSection() {
  const camp = await getLandingCamp();
  const state = getRegistrationState(camp);
  const heading =
    state === "open" ? copy.open : state === "countdown" ? copy.countdown : copy.closed;

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
              <ButtonLink href={copy.closed.contactHref} size="lg" variant="outline">
                {copy.closed.contact}
              </ButtonLink>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
