import Image from "next/image";
import type { ReactNode } from "react";
import { ChatsCircle, Confetti } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";
import { CAMP_PHOTOS, type CampPhotoKey } from "@/lib/marketing/camp-photos";
import { marketingMessages } from "@/lib/marketing/messages";

/**
 * One program tile: a camp photo under a dark bottom scrim with the copy on
 * top (specs/027-camp-photos). The warm tint gives each tile its accent.
 */
function PhotoTile({
  photoKey,
  tintClass,
  className,
  children,
}: {
  photoKey: CampPhotoKey;
  tintClass: string;
  className?: string;
  children: ReactNode;
}) {
  const photo = CAMP_PHOTOS[photoKey];
  return (
    <Reveal
      as="article"
      className={cn(
        "relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-card bg-sand-900 p-8",
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={marketingMessages.photos[photoKey]}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={cn("object-cover", photo.focusClass)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/40 to-ink-950/10" />
      <div className={cn("absolute inset-0 bg-gradient-to-br from-transparent via-transparent", tintClass)} />
      <div className="relative">{children}</div>
    </Reveal>
  );
}

function TileIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-pill bg-on-inverse/15 text-amber-300 backdrop-blur-sm">
      {children}
    </span>
  );
}

/**
 * Program section (Persuade): asymmetric bento of the three real camp
 * highlights. One tall feature tile (Worship) beside two stacked tiles,
 * deliberately not three equal cards. Every tile shows a camp photo.
 */
export function ProgramHighlights() {
  return (
    <section className="border-t border-border bg-sand-50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <Reveal>
          <h2 className="max-w-[18ch] text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            Glaube, Spaß und Gemeinschaft
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:grid-rows-2">
          {/* Feature tile, spans both rows on desktop */}
          <PhotoTile
            photoKey="worship"
            tintClass="to-amber-400/20"
            className="min-h-[22rem] md:row-span-2 md:min-h-[30rem]"
          >
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
          </PhotoTile>

          <PhotoTile photoKey="inputs" tintClass="to-amber-400/15">
            <TileIcon>
              <ChatsCircle size={24} weight="duotone" />
            </TileIcon>
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-on-inverse">
              Inspirierende Inputs
            </h3>
            <p className="mt-3 max-w-[38ch] text-on-inverse/80">
              Ehrliche Predigten und interaktive Workshops, die zum Nachdenken
              anregen und dich weiterbringen.
            </p>
          </PhotoTile>

          <PhotoTile photoKey="sport" tintClass="to-amber-500/30">
            <TileIcon>
              <Confetti size={24} weight="duotone" />
            </TileIcon>
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-on-inverse">
              Sport, Lagerfeuer & Nacht-Geländespiel
            </h3>
            <p className="mt-3 max-w-[38ch] text-on-inverse/80">
              Turniere am Tag, Lagerfeuer am Abend und ein Geländespiel, das
              dich die Komfortzone verlassen lässt.
            </p>
          </PhotoTile>
        </div>
      </div>
    </section>
  );
}
