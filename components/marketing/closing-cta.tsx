import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Final call to action (Persuade): the registration moment. Inverse band,
 * primary CTA into the (future) registration flow. Anchored as `#anmelden`.
 */
export function ClosingCta() {
  return (
    <section
      id="anmelden"
      className="border-t border-border bg-surface-inverse"
    >
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
          {/* TODO: point to the config-driven registration route once built */}
          <ButtonLink href="#anmelden" size="lg">
            Jetzt anmelden
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
