import Image from "next/image";
import { Fragment } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";
import { CAMP_PHOTOS, type CampPhotoKey } from "@/lib/marketing/camp-photos";
import { marketingMessages } from "@/lib/marketing/messages";

const copy = marketingMessages.community;

/** Portrait day photo; the offset variant sits lower for an editorial rhythm. */
function DayPhoto({ photoKey, offset = false }: { photoKey: CampPhotoKey; offset?: boolean }) {
  const photo = CAMP_PHOTOS[photoKey];
  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden rounded-card bg-sand-200 shadow-warm",
        offset && "mt-8 md:mt-16",
      )}
    >
      <Image
        src={photo.src}
        alt={marketingMessages.photos[photoKey]}
        fill
        sizes="(min-width: 768px) 22vw, 50vw"
        className={cn("object-cover", photo.focusClass)}
      />
    </div>
  );
}

/**
 * Youth groups (Persuade): the page's social proof as a light section, so the
 * campfire band below stays the one dark moment (specs/028-community-section).
 * The group names carry the section in display type; two day photos sit beside.
 */
export function CommunityGroups() {
  return (
    <section className="border-t border-border bg-sand-100">
      <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-6 py-24 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:px-10 lg:py-32">
        <Reveal>
          <span className="eyebrow text-amber-700">{copy.eyebrow}</span>
          <h2 className="mt-4 max-w-[16ch] text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-foreground md:text-5xl">
            {copy.heading}
          </h2>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            {copy.text}
          </p>
          <ul className="mt-10 font-display text-3xl font-black leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {/* The space between items is the only line break opportunity; each
                name keeps its trailing separator so no line starts with one. */}
            {copy.groups.map((group, index) => (
              <Fragment key={group}>
                {index > 0 && " "}
                <li className="inline whitespace-nowrap">
                  {group}
                  {index < copy.groups.length - 1 && (
                    <span aria-hidden="true" className="pl-[0.25em] text-amber-500">
                      ·
                    </span>
                  )}
                </li>
              </Fragment>
            ))}
          </ul>
        </Reveal>

        <Reveal className="grid grid-cols-2 gap-4 md:gap-5">
          <DayPhoto photoKey="teamwork" />
          <DayPhoto photoKey="beach" offset />
        </Reveal>
      </div>
    </section>
  );
}
