import Image from "next/image";
import { SiteNav } from "@/components/marketing/site-nav";
import { ButtonLink } from "@/components/ui/button";

/**
 * Full-bleed cinematic hero: grayscale mountain photo, warm amber gradient
 * wash, and a heavy display headline. Fits within the initial viewport.
 */
export function MountainHero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-ink-950">
      {/* background photo — TODO: replace with real camp photography */}
      <Image
        src="https://picsum.photos/seed/blankenheim-mountains/2000/1200"
        alt="Berglandschaft im Nebel"
        fill
        priority
        sizes="100vw"
        className="object-cover grayscale"
      />

      {/* warm amber wash + darkening for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-tr from-ink-950/85 via-ink-950/45 to-amber-500/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />

      {/* vertical side label (decoration, apreatif-style) */}
      <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] font-medium uppercase tracking-[0.35em] text-on-inverse/60 lg:block">
        Sommer 2027 · Blankenheim
      </span>

      <SiteNav variant="overlay" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-20 pt-8 md:px-10">
        <p
          className="animate-rise mb-5 text-xs font-medium uppercase tracking-[0.28em] text-amber-400"
          style={{ animationDelay: "0.05s" }}
        >
          FCG Blankenheim Summercamp
        </p>
        <h1
          className="animate-rise max-w-[16ch] font-display text-5xl font-black leading-[0.92] tracking-tight text-on-inverse sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ animationDelay: "0.15s" }}
        >
          Ein Sommer in den{" "}
          <span className="text-amber-400">Bergen</span>
        </h1>
        <p
          className="animate-rise mt-6 max-w-[46ch] text-base text-on-inverse/75 md:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          Eine Woche Gemeinschaft, Abenteuer und Glaube. Sichere dir jetzt
          deinen Platz beim Summercamp.
        </p>
        <div
          className="animate-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "0.45s" }}
        >
          <ButtonLink size="lg" href="#anmelden">
            Jetzt anmelden
          </ButtonLink>
          <ButtonLink
            size="lg"
            variant="outline"
            href="#camp"
            className="border-on-inverse/30 text-on-inverse hover:bg-on-inverse/10 hover:border-on-inverse/50"
          >
            Mehr erfahren
          </ButtonLink>
        </div>
      </div>

      {/* dot pagination (decoration) */}
      <div className="relative z-10 flex justify-center gap-2 pb-10">
        <span className="h-1.5 w-6 rounded-pill bg-amber-400" />
        <span className="h-1.5 w-1.5 rounded-pill bg-on-inverse/40" />
        <span className="h-1.5 w-1.5 rounded-pill bg-on-inverse/40" />
      </div>
    </section>
  );
}
