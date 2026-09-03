import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { ParallaxImage } from "@/components/marketing/parallax-image";

// TODO: swap for real campfire / golden-hour camp photo.
const CAMPFIRE_PHOTO =
  "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=2400&q=80";

/**
 * Emotional lead-in (Persuade) directly above the registration section. The one
 * deliberate cinematic dark moment on the page: a warm campfire photo band with
 * parallax, nudging the visitor into the `#anmelden` form below. The action
 * itself lives in `RegistrationSection`, so this band carries no duplicate CTA.
 */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-sand-900">
      <ParallaxImage
        src={CAMPFIRE_PHOTO}
        alt="Lagerfeuer im Camp bei Abendlicht"
        sizes="100vw"
        strength={70}
        kenBurns
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/60 to-ink-950/55" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-500/20" />

      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 lg:py-36">
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
            className="border-on-inverse/40 bg-on-inverse/5 text-on-inverse backdrop-blur-sm hover:border-on-inverse/60 hover:bg-on-inverse/15"
          >
            Bei Fragen schreib uns
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
