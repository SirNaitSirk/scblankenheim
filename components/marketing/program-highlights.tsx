import Image from "next/image";
import { ChatsCircle, Confetti } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";

// TODO: swap for real camp worship photography (warm evening light).
const WORSHIP_PHOTO =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80";

/**
 * Program section (Persuade): asymmetric bento of the three real camp
 * highlights. One tall feature tile (Worship) beside two stacked tiles —
 * deliberately not three equal cards.
 */
export function ProgramHighlights() {
  return (
    <section className="border-t border-border bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <Reveal className="max-w-[24ch]">
          <h2 className="font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            Glaube, Spaß und Gemeinschaft
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:grid-rows-2">
          {/* Feature tile — spans both rows on desktop */}
          <Reveal
            as="article"
            className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-card bg-sand-900 p-8 md:row-span-2 md:min-h-[30rem]"
          >
            <Image
              src={WORSHIP_PHOTO}
              alt="Worship-Abend im Camp mit erhobenen Händen"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-400/20" />
            <div className="relative">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300">
                Worship Sessions
              </span>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-on-inverse">
                Gemeinsam Gott begegnen
              </h3>
              <p className="mt-3 max-w-[32ch] text-on-inverse/80">
                Abende voller Musik, Anbetung und Momente, die bleiben. Zeit,
                um durchzuatmen und Gott ganz neu zu erleben.
              </p>
            </div>
          </Reveal>

          <Reveal
            as="article"
            delay={90}
            className="group flex flex-col justify-between rounded-card border border-amber-100 bg-surface p-8 shadow-warm transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-amber-100 text-amber-700 transition-transform duration-300 group-hover:scale-105">
              <ChatsCircle size={24} weight="duotone" />
            </span>
            <div className="mt-8">
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Inspirierende Inputs
              </h3>
              <p className="mt-3 max-w-[38ch] text-muted-foreground">
                Ehrliche Predigten und interaktive Workshops, die zum Nachdenken
                anregen und dich weiterbringen.
              </p>
            </div>
          </Reveal>

          <Reveal
            as="article"
            delay={180}
            className="group flex flex-col justify-between overflow-hidden rounded-card border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-300/60 p-8 transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-amber-500/20 text-amber-700 transition-transform duration-300 group-hover:scale-105">
              <Confetti size={24} weight="duotone" />
            </span>
            <div className="mt-8">
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Sport, Lagerfeuer & Nacht-Geländespiel
              </h3>
              <p className="mt-3 max-w-[38ch] text-ink-700">
                Turniere am Tag, Lagerfeuer am Abend und ein Geländespiel, das
                dich die Komfortzone verlassen lässt.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
