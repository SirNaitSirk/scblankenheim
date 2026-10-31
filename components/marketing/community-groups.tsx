import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";
import { CAMP_PHOTOS } from "@/lib/marketing/camp-photos";
import { marketingMessages } from "@/lib/marketing/messages";

const copy = marketingMessages.community;
const photo = CAMP_PHOTOS.community;

/**
 * Youth groups (Persuade): one full width photo band naming the participating
 * youth groups, the page's social proof right before the campfire band.
 */
export function CommunityGroups() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-sand-900">
      <Image
        src={photo.src}
        alt={marketingMessages.photos.community}
        fill
        sizes="100vw"
        className={cn("object-cover", photo.focusClass)}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-400/20" />

      <Reveal className="relative mx-auto max-w-[1400px] px-6 py-24 md:px-10 lg:py-32">
        <h2 className="max-w-[16ch] text-balance font-display text-4xl font-black leading-[1.02] tracking-tight text-on-inverse md:text-5xl">
          {copy.heading}
        </h2>
        <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-on-inverse/85">
          {copy.text}
        </p>
        <ul className="mt-10 flex max-w-xl flex-wrap gap-2">
          {copy.groups.map((group) => (
            <li
              key={group}
              className="rounded-pill border border-on-inverse/25 bg-on-inverse/10 px-4 py-2 text-sm font-medium text-on-inverse backdrop-blur-sm"
            >
              {group}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
