import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Emotional lead-in (Persuade) directly above the registration section. Inverse
 * band; nudges the visitor into the `#anmelden` form below. The action itself
 * lives in `RegistrationSection`, so this band carries no duplicate primary CTA.
 */
export function ClosingCta() {
  return (
    <section className="border-t border-border bg-surface-inverse">
      <div className="mx-auto max-w-[1400px] px-6 py-28 md:px-10 lg:py-36">
        <Reveal className="mx-auto max-w-[24ch] text-center">
          <h2 className="font-display text-5xl font-black leading-[0.98] tracking-tight text-on-inverse md:text-6xl">
            Sei dabei und erlebe den Sommer deines Lebens
          </h2>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <ButtonLink href="#anmelden" size="lg">
            Zur Anmeldung
          </ButtonLink>
          <ButtonLink
            href="mailto:info@fcg-blankenheim.de"
            size="lg"
            variant="outline"
            className="border-on-inverse/30 text-on-inverse hover:border-on-inverse/50 hover:bg-on-inverse/10"
          >
            Bei Fragen schreib uns
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
