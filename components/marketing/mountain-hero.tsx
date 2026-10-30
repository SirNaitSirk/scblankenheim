import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/marketing/site-nav";
import { ParallaxImage } from "@/components/marketing/parallax-image";
import { ButtonLink } from "@/components/ui/button";
import type { RegistrationCta } from "@/lib/register/registration-cta";

// TODO: swap for real camp photography (warm golden-hour mountain/valley).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

/**
 * Full bleed hero: warm mountain photo with scroll parallax and slow ken burns,
 * a warm legibility scrim and the headline stack. The headline renders visible
 * with no entrance (it is the largest paint); the lines around it rise in with
 * CSS only, so nothing waits for JavaScript (specs/024-landing-structure R2).
 */
export function MountainHero({
  cta,
  showSchoolRelease,
}: {
  cta: RegistrationCta;
  showSchoolRelease: boolean;
}) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-sand-900">
      <ParallaxImage
        src={HERO_PHOTO}
        alt="Sonnendurchflutete Berglandschaft im Sommer"
        priority
        sizes="100vw"
        strength={90}
        kenBurns
      />

      {/* Warm legibility scrim, dark toward bottom left where the copy sits,
          transparent toward the top right so the photo stays bright and warm. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/45 via-transparent to-amber-400/15" />

      <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] font-medium uppercase tracking-[0.35em] text-on-inverse/60 lg:block">
        Sommer 2027 · Blankenheim
      </span>

      <SiteNav
        variant="overlay"
        cta={{ label: cta.shortLabel, href: cta.href }}
        showSchoolRelease={showSchoolRelease}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-24 pt-8 md:px-10">
        <p className="animate-rise mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          FCG Blankenheim Summercamp
        </p>
        <h1 className="max-w-[16ch] font-display text-5xl font-black leading-[0.92] tracking-tight text-on-inverse [text-shadow:0_2px_30px_rgba(10,10,11,0.35)] sm:text-6xl md:text-7xl lg:text-8xl">
          Ein Sommer in den{" "}
          <span className="text-amber-300">Bergen</span>
        </h1>
        <p
          className="animate-rise mt-6 max-w-[46ch] text-base text-on-inverse/85 md:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          Eine Woche Gemeinschaft, Abenteuer und Glaube. Sichere dir jetzt
          deinen Platz beim Summercamp.
        </p>
        <div
          className="animate-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <ButtonLink size="lg" href={cta.href}>
            {cta.label}
          </ButtonLink>
          <ButtonLink
            size="lg"
            variant="outline"
            href="#camp"
            className="border-on-inverse/40 bg-on-inverse/5 text-on-inverse backdrop-blur-sm hover:border-on-inverse/60 hover:bg-on-inverse/15"
          >
            Mehr erfahren
          </ButtonLink>
        </div>
      </div>

      {/* Scroll cue with a gentle bob; the global reduced motion rule stops it. */}
      <a
        href="#camp"
        aria-label="Weiter zum Camp"
        className="animate-rise relative z-10 mx-auto mb-8 flex h-10 w-10 items-center justify-center rounded-pill text-on-inverse/70 transition-colors hover:text-on-inverse"
        style={{ animationDelay: "900ms" }}
      >
        <span className="animate-scroll-cue">
          <CaretDown size={22} weight="bold" />
        </span>
      </a>
    </section>
  );
}
