import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";

/**
 * Program section (Persuade): asymmetric bento of the three real camp
 * highlights. One tall feature tile (Worship) beside two stacked tiles —
 * deliberately not three equal cards.
 */
export function ProgramHighlights() {
  return (
    <section className="border-t border-border bg-canvas">
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
            className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-card bg-surface-inverse p-8 md:row-span-2 md:min-h-[30rem]"
          >
            {/* TODO: replace with real camp worship photography */}
            <Image
              src="https://picsum.photos/seed/summercamp-worship/1200/1400"
              alt="Worship-Abend im Camp"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover opacity-45 grayscale transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] group-hover:opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
            <div className="relative">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-400">
                Worship Sessions
              </span>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-on-inverse">
                Gemeinsam Gott begegnen
              </h3>
              <p className="mt-3 max-w-[32ch] text-on-inverse/75">
                Abende voller Musik, Anbetung und Momente, die bleiben. Zeit,
                um durchzuatmen und Gott ganz neu zu erleben.
              </p>
            </div>
          </Reveal>

          <Reveal
            as="article"
            delay={90}
            className="flex flex-col justify-between rounded-card border border-border bg-surface p-8 shadow-card"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-strong">
              Input & Workshops
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
            className="flex flex-col justify-between rounded-card border border-border bg-amber-100 p-8"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-strong">
              Action
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
