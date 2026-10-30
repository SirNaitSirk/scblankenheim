import { Bus, SunDim, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { TICKET_ANCHOR } from "@/lib/bus/limits";
import { busMessages } from "@/lib/bus/messages";
import type { ParticipantBusTicket } from "@/lib/bus/types";

const copy = busMessages.participant;

/**
 * Bus ticket on the participant page (specs/021-bus-ticket, US4): a large QR
 * code on white with quiet zone, name and camp below. The SVG is rendered on
 * the server by `qrcode` from our own scan URL, never from user input.
 */
export function BusTicketCard({
  ticket,
  firstName,
  campName,
}: {
  ticket: ParticipantBusTicket;
  firstName: string;
  campName: string;
}) {
  return (
    <section
      id={TICKET_ANCHOR}
      aria-labelledby="bus-ticket-title"
      className="scroll-mt-6 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      <h2
        id="bus-ticket-title"
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <Bus size={16} weight="bold" />
        {copy.title}
      </h2>

      {ticket.blocked ? (
        <p className="mt-4 flex gap-2 text-sm leading-relaxed text-foreground">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-danger" />
          {copy.blocked}
        </p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <div
            role="img"
            aria-label={copy.alt(firstName)}
            className="w-full max-w-[18rem] rounded-input bg-white p-2 ring-1 ring-ink-200 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: ticket.svg }}
          />
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-foreground">{firstName}</p>
            <p className="text-sm text-muted-foreground">{campName}</p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SunDim size={16} />
            {copy.brightness}
          </p>
        </div>
      )}
    </section>
  );
}
