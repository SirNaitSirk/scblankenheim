import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import type { ContactState, SchoolReleaseState } from "@/app/meine-anmeldung/[token]/actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { participantMessages as copy } from "@/lib/participant/messages";
import type { ParticipantView, PayState } from "@/lib/participant/view";
import { BusTicketCard } from "./bus-ticket-card";
import { ParticipantContact } from "./participant-contact";
import { ParticipantTabs, type ParticipantPanel } from "./participant-tabs";
import { SchoolReleaseForm } from "./school-release-form";
import { formatGermanDate } from "@/lib/time/berlin";

/**
 * Read only participant page body (specs/017-participant-page, plan "UI"),
 * split into the tabs Übersicht, Meine Angaben and Dokumente below a short
 * status strip (specs/022-participant-tabs).
 */
export function ParticipantSummary({
  view,
  contactAction,
  release,
}: {
  view: ParticipantView;
  /** Bound public action (specs/018-participant-messages); omitted in previews. */
  contactAction?: (previous: ContactState, formData: FormData) => Promise<ContactState>;
  /** Bound release action and PDF link (specs/020-school-release); omitted in previews. */
  release?: {
    action: (previous: SchoolReleaseState, formData: FormData) => Promise<SchoolReleaseState>;
    pdfHref: string;
  };
}) {
  const documents: ReactNode[] = [];
  if (view.busTicket) {
    documents.push(
      <BusTicketCard
        key="bus"
        ticket={view.busTicket}
        firstName={view.firstName}
        campName={view.campName}
      />,
    );
  }
  if (release && view.schoolRelease) {
    documents.push(
      <SchoolReleaseForm
        key="release"
        action={release.action}
        release={view.schoolRelease}
        pdfHref={release.pdfHref}
        payHref={view.payHref}
      />,
    );
  }

  const panels: ParticipantPanel[] = [
    {
      tab: "overview",
      label: copy.tabs.overview,
      content: (
        <>
          <StatusCard view={view} />
          <CampCard view={view} />
          <PackingCard />
        </>
      ),
    },
    {
      tab: "details",
      label: copy.tabs.details,
      shortLabel: copy.tabs.detailsShort,
      content: (
        <>
          <AnswersCard view={view} />
          {contactAction && (
            <ParticipantContact
              action={contactAction}
              fields={view.editableFields}
              messages={view.messages}
            />
          )}
        </>
      ),
    },
  ];
  if (documents.length > 0) {
    panels.push({ tab: "documents", label: copy.tabs.documents, content: <>{documents}</> });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground">
          {copy.greeting(view.firstName)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {copy.intro(view.campName)}
        </p>
      </header>

      <StatusStrip view={view} />
      <ParticipantTabs label={copy.tabs.label} panels={panels} />
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      {title && (
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      )}
      <div className={cn(title && "mt-4")}>{children}</div>
    </section>
  );
}

function statusTone(view: ParticipantView): "paid" | "pending" | "danger" {
  if (view.status === "cancelled") return "danger";
  return view.payState === "pay" ? "pending" : "paid";
}

/** Always visible above the tabs while cancelled or an amount is open and payable. */
function StatusStrip({ view }: { view: ParticipantView }) {
  if (view.status === "cancelled") {
    return (
      <p className="rounded-card border border-border bg-surface px-4 py-3 text-sm font-medium text-danger">
        {copy.strip.cancelled}
      </p>
    );
  }
  if (view.payState !== "pay" || !view.payHref) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card border border-border bg-surface px-4 py-3">
      <p className="text-sm font-medium text-foreground tabular-nums">
        {copy.strip.outstanding(formatCurrency(view.amounts.outstanding))}
      </p>
      <ButtonLink href={view.payHref} size="sm">
        {copy.pay.button}
      </ButtonLink>
    </div>
  );
}

const PAY_NOTES: Record<Exclude<PayState, "pay">, string> = {
  paid: copy.pay.paid,
  processing: copy.pay.processing,
  refunded: copy.pay.refunded,
  free: copy.pay.free,
  cancelled: copy.pay.cancelled,
};

function StatusCard({ view }: { view: ParticipantView }) {
  const { amounts } = view;
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-muted-foreground">{copy.status.label}</span>
        <Badge tone={statusTone(view)}>
          {view.status === "cancelled" ? copy.status.cancelled : copy.status.active}
        </Badge>
      </div>

      {view.payState !== "free" && (
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
          <Amount label={copy.amounts.total} value={amounts.total} />
          <Amount label={copy.amounts.paid} value={amounts.paid} />
          <Amount label={copy.amounts.outstanding} value={amounts.outstanding} strong />
        </dl>
      )}

      <div className="mt-6">
        {view.payState === "pay" && view.payHref ? (
          <ButtonLink href={view.payHref} size="lg" className="w-full sm:w-auto">
            {copy.pay.button}
          </ButtonLink>
        ) : (
          <p className="rounded-input border border-border bg-canvas px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {PAY_NOTES[view.payState as Exclude<PayState, "pay">]}
          </p>
        )}
      </div>
    </Card>
  );
}

function Amount({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-display font-extrabold tracking-tight tabular-nums",
          strong ? "text-2xl text-foreground sm:text-3xl" : "text-xl text-ink-700 sm:text-2xl",
        )}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}

function CampCard({ view }: { view: ParticipantView }) {
  return (
    <Card title={copy.camp.heading}>
      <p className="font-display text-xl font-bold tracking-tight text-foreground">{view.campName}</p>
      {(view.campDates || view.campLocation) && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {view.campDates && (
            <Fact
              label={copy.camp.dates}
              value={copy.camp.dateRange(
                formatGermanDate(view.campDates.start),
                formatGermanDate(view.campDates.end),
              )}
            />
          )}
          {view.campLocation && <Fact label={copy.camp.location} value={view.campLocation} />}
        </dl>
      )}
      {view.calendar && (
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href={view.calendar.icsUrl} variant="outline" size="sm">
            <CalendarPlus size={16} aria-hidden />
            {copy.camp.calendarIcs}
          </ButtonLink>
          <ButtonLink
            href={view.calendar.googleUrl}
            variant="outline"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.camp.calendarGoogle}
          </ButtonLink>
        </div>
      )}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function AnswersCard({ view }: { view: ParticipantView }) {
  return (
    <Card title={copy.answers.heading}>
      <dl className="divide-y divide-border">
        {view.rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 py-3 first:pt-0 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-pre-line break-words text-sm text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{copy.answers.changeHint}</p>
    </Card>
  );
}

function PackingCard() {
  return (
    <Card title={copy.packing.heading}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.packing.body}</p>
        <ButtonLink href="/packzettel" variant="outline" className="shrink-0">
          {copy.packing.button}
        </ButtonLink>
      </div>
    </Card>
  );
}
