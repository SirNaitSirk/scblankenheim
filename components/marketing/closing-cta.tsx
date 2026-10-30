import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { ParallaxImage } from "@/components/marketing/parallax-image";
import type { RegistrationCta } from "@/lib/register/registration-cta";

// TODO: swap for real campfire / golden-hour camp photo.
const CAMPFIRE_PHOTO =
  "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=2400&q=80";

/**
 * Emotional lead-in (Persuade) directly above the registration section. The one
 * deliberate cinematic dark moment on the page: a warm campfire photo band with
 * parallax, nudging the visitor into the `#anmelden` section below. Its button
 * label follows the registration state (specs/024-landing-structure R5).
 */
export function ClosingCta({ cta }: { cta: RegistrationCta }) {
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
        <Reveal className="text-center">
          <h2 className="mx-auto max-w-[16ch] text-balance font-display text-5xl font-black leading-[0.98] tracking-tight text-on-inverse md:text-6xl">
            Sei dabei und erlebe den Sommer deines Lebens
          </h2>
        </Reveal>

        <Reveal
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <ButtonLink href={cta.href} size="lg">
            {cta.label}
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
