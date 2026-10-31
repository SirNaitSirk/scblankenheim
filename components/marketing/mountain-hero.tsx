import Image from "next/image";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/marketing/site-nav";
import { HeroVideo } from "@/components/marketing/hero-video";
import { ButtonLink } from "@/components/ui/button";
import { HERO_POSTER_SRC } from "@/lib/marketing/hero-video";
import { marketingMessages } from "@/lib/marketing/messages";
import type { RegistrationCta } from "@/lib/register/registration-cta";

const copy = marketingMessages.hero;

/**
 * Full bleed hero: the recap video of the last camp over its first frame as
 * poster, a legibility scrim and the headline stack (specs/026-hero-video).
 * The poster is the largest paint and renders without JavaScript; the video
 * only loads where motion is welcome. The headline renders visible with no
 * entrance; the lines around it rise in with CSS only (specs/024-landing-structure R2).
 */
export function MountainHero({
  cta,
  showSchoolRelease,
  campYear = null,
}: {
  cta: RegistrationCta;
  showSchoolRelease: boolean;
  /** Start year of the current camp, null without camp or start date. */
  campYear?: number | null;
}) {
  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-sand-900">
      <div className="absolute inset-0 -z-20">
        <Image
          src={HERO_POSTER_SRC}
          alt={copy.posterAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Legibility scrims, dark toward the left and bottom where the copy
          sits. The video has bright sky, beach and stage scenes; measured
          per scene, these keep the headline at 3:1 and the lead at 4.5:1. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/45 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-ink-950/25 via-60% to-transparent" />
      {/* On phones the copy spans the full width up into the bright sky. */}
      <div className="absolute inset-0 bg-ink-950/35 md:hidden" />

      <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] font-medium uppercase tracking-[0.35em] text-on-inverse/60 lg:block">
        {marketingMessages.brand.heroTag(campYear)}
      </span>

      <SiteNav
        variant="overlay"
        cta={{ label: cta.shortLabel, href: cta.href }}
        showSchoolRelease={showSchoolRelease}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-24 pt-8 md:px-10">
        <p className="animate-rise mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          {copy.eyebrow}
        </p>
        <h1 className="max-w-[16ch] text-balance font-display text-[clamp(2.25rem,11vw,3rem)] font-black leading-[0.92] tracking-tight text-on-inverse [text-shadow:0_2px_30px_rgba(10,10,11,0.35)] sm:text-6xl md:text-7xl lg:text-8xl">
          {copy.headlineLead}{" "}
          <span className="text-amber-300">{copy.headlineAccent}</span>
        </h1>
        <p
          className="animate-rise mt-6 max-w-[46ch] text-base text-on-inverse/85 md:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          {copy.lead}
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
            {copy.more}
          </ButtonLink>
        </div>
      </div>

      {/* After the hero buttons, so the pause control follows them in tab order. */}
      <HeroVideo />

      {/* Scroll cue with a gentle bob; the global reduced motion rule stops it. */}
      <a
        href="#camp"
        aria-label={copy.scrollCue}
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
