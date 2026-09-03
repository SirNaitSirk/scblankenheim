"use client";

import { motion, useReducedMotion } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";
import { SiteNav } from "@/components/marketing/site-nav";
import { ParallaxImage } from "@/components/marketing/parallax-image";
import { ButtonLink } from "@/components/ui/button";

// TODO: swap for real camp photography (warm golden-hour mountain/valley).
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

/**
 * Full-bleed cinematic hero: warm golden-hour mountain photo with scroll
 * parallax + slow ken-burns, a light warm legibility scrim, and a staggered
 * entrance for the headline stack. Fits within the initial viewport.
 */
export function MountainHero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const item = reduce
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

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

      {/* Warm legibility scrim — dark toward bottom-left where the copy sits,
          transparent toward the top-right so the photo stays bright and warm. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/15 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/45 via-transparent to-amber-400/15" />

      <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] font-medium uppercase tracking-[0.35em] text-on-inverse/60 lg:block">
        Sommer 2027 · Blankenheim
      </span>

      <SiteNav variant="overlay" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 pb-24 pt-8 md:px-10"
      >
        <motion.p
          variants={item}
          className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300"
        >
          FCG Blankenheim Summercamp
        </motion.p>
        <motion.h1
          variants={item}
          className="max-w-[16ch] font-display text-5xl font-black leading-[0.92] tracking-tight text-on-inverse [text-shadow:0_2px_30px_rgba(10,10,11,0.35)] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Ein Sommer in den{" "}
          <span className="text-amber-300">Bergen</span>
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-6 max-w-[46ch] text-base text-on-inverse/85 md:text-lg"
        >
          Eine Woche Gemeinschaft, Abenteuer und Glaube. Sichere dir jetzt
          deinen Platz beim Summercamp.
        </motion.p>
        <motion.div
          variants={item}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <ButtonLink size="lg" href="#anmelden">
            Jetzt anmelden
          </ButtonLink>
          <ButtonLink
            size="lg"
            variant="outline"
            href="#camp"
            className="border-on-inverse/40 bg-on-inverse/5 text-on-inverse backdrop-blur-sm hover:border-on-inverse/60 hover:bg-on-inverse/15"
          >
            Mehr erfahren
          </ButtonLink>
        </motion.div>
      </motion.div>

      {/* Scroll cue — gentle bob, drops out for reduced-motion. */}
      <motion.a
        href="#camp"
        aria-label="Weiter zum Camp"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="relative z-10 mx-auto mb-8 flex h-10 w-10 items-center justify-center rounded-pill text-on-inverse/70 transition-colors hover:text-on-inverse"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <CaretDown size={22} weight="bold" />
        </motion.span>
      </motion.a>
    </section>
  );
}
