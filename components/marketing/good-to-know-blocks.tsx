import { GraduationCap, MapPin } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { SchoolReleaseLinkForm } from "@/components/marketing/school-release-link-form";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { marketingMessages, paymentMethods } from "@/lib/marketing/messages";
import { featuredPackingItems } from "@/lib/marketing/packing-list";
import { releaseMessages } from "@/lib/school-release/messages";
import { formatReleaseDates } from "@/lib/school-release/settings";

/**
 * Open blocks of „Gut zu wissen“ (specs/024-landing-structure R4). Each block
 * carries its own anchor, which links in mails rely on, one heading, a few lines
 * and at most one action. Quiet surfaces: one border, no shadow, no nested cards.
 */

const copy = marketingMessages.goodToKnow;

function Block({
  id,
  heading,
  className,
  children,
}: {
  id: string;
  heading: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal
      as="article"
      id={id}
      className={cn("flex flex-col rounded-card border border-border bg-surface p-6 md:p-8", className)}
    >
      <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {heading}
      </h3>
      {children}
    </Reveal>
  );
}

/** Quiet static tag; deliberately without hover, it is not a control. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-pill border border-border bg-sand-50 px-3.5 py-1.5 text-sm font-medium text-foreground">
      {children}
    </li>
  );
}

/** Plain link to Google Maps; nothing from Google loads on our page. */
function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ArrivalBlock() {
  const arrival = copy.arrival;
  const rows = [
    { label: arrival.busDepartureLabel, value: arrival.busDepartureValue },
    { label: arrival.campSiteLabel, value: arrival.campSiteValue },
    { label: arrival.carpoolLabel, value: arrival.carpoolValue },
  ];

  return (
    <Block id="anreise" heading={arrival.heading}>
      <dl className="mt-6 flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 border-t border-border py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="font-medium text-foreground sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <ButtonLink
          href={mapsUrl(arrival.mapsQuery)}
          variant="outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={18} aria-hidden />
          {arrival.mapsLink}
        </ButtonLink>
      </div>
    </Block>
  );
}

export function PaymentBlock() {
  return (
    <Block id="bezahlen" heading={copy.payment.heading}>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
        {copy.payment.text}
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {paymentMethods.map((method) => (
          <Tag key={method}>{method}</Tag>
        ))}
      </ul>
    </Block>
  );
}

export function PackingBlock({ className }: { className?: string }) {
  return (
    <Block id="packliste" heading={copy.packing.heading} className={className}>
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
        {copy.packing.text}
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {featuredPackingItems().map((item) => (
          <Tag key={item.id}>{item.label}</Tag>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href="/packzettel" variant="outline">
          {copy.packing.link}
        </ButtonLink>
      </div>
    </Block>
  );
}

export function SchoolReleaseBlock({ dates }: { dates: readonly string[] }) {
  const release = releaseMessages.landing;
  return (
    <Block
      id="schulbefreiung"
      heading={
        <span className="flex items-center gap-3">
          <GraduationCap size={26} weight="duotone" aria-hidden className="shrink-0 text-amber-700" />
          {release.heading}
        </span>
      }
    >
      <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
        {release.intro(formatReleaseDates(dates))}
      </p>
      <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
        {release.how}
      </p>
      <SchoolReleaseLinkForm />
    </Block>
  );
}
