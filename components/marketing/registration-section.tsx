import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { CountdownPanel } from "@/components/marketing/countdown-panel";
import { RegistrationForm } from "@/components/marketing/registration-form";
import { getCampAvailability } from "@/lib/marketing/availability";
import { getCountdownTarget } from "@/lib/marketing/current-camp";
import { getLandingState } from "@/lib/marketing/landing-state";
import { priceLine } from "@/lib/marketing/messages";
import { resolveInvitation } from "@/lib/register/invitation";
import { registerMessages } from "@/lib/register/messages";
import { formatOpeningDay } from "@/lib/register/registration-cta";

const copy = registerMessages.section;

/**
 * The `#anmelden` moment. Server Component: reads the shared landing state
 * (open, countdown, closed, full) and renders the matching UI plus the public
 * price line. Only the countdown and the form are client components.
 */
export async function RegistrationSection({
  invitationToken,
}: {
  invitationToken?: string;
}) {
  const { camp, registrationState: state, opensAt } = await getLandingState();
  const heading =
    state === "countdown"
      ? { ...copy.countdown, heading: registerMessages.countdownHeading(formatOpeningDay(opensAt)) }
      : copy[state];

  const target = camp && state === "countdown" ? getCountdownTarget(camp) : null;

  const availability =
    camp && state === "open"
      ? await getCampAvailability(camp.id, camp.fields)
      : {};

  // Only a valid token reaches the client; an invalid one behaves like none.
  const validToken =
    camp && state === "open" && invitationToken
      ? (await resolveInvitation(camp.id, invitationToken)).valid
        ? invitationToken
        : undefined
      : undefined;

  return (
    <section id="anmelden" className="border-t border-border bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-amber-600">{heading.eyebrow}</span>
          <h2 className="mx-auto mt-4 max-w-[20ch] text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            {heading.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
            {heading.intro}
          </p>
          {/* Public base price only: an invitation tier never shows here. */}
          {camp ? (
            <p className="mx-auto mt-4 max-w-[60ch] text-sm font-medium text-foreground/80">
              {priceLine(camp.basePrice)}
            </p>
          ) : null}
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-2xl">
          {state === "open" && camp ? (
            <RegistrationForm
              fields={camp.fields}
              availability={availability}
              invitationToken={validToken}
            />
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
