import { PageBody, PageHeader } from "@/components/admin/page-header";
import { BusStation } from "@/components/admin/bus-station";
import { Badge } from "@/components/ui/badge";
import { canUseSection } from "@/lib/admin/access";
import { getCampById, getCurrentCampId } from "@/lib/admin/data";
import { guardTab } from "@/lib/admin/guard";
import { isTicketCode } from "@/lib/bus/code";
import { busContext } from "@/lib/bus/data";
import { TRIP_PARAM } from "@/lib/bus/limits";
import { busMessages as copy } from "@/lib/bus/messages";
import type { Trip } from "@/lib/bus/types";

/**
 * Scan page for the bus (specs/021-bus-ticket, US2 and US3). Opened directly
 * by the phone camera through the QR payload `?t=<code>`; the trip comes from
 * `?fahrt=` or the device.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function tripFromParam(value: string | undefined): Trip | null {
  if (value === TRIP_PARAM.outbound) return "outbound";
  if (value === TRIP_PARAM.return) return "return";
  return null;
}

export default async function BusPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await guardTab("/admin/bus");
  const params = await searchParams;
  const code = first(params.t);
  const campId = await getCurrentCampId();
  const camp = campId ? await getCampById(campId) : null;
  const context = campId ? await busContext(campId) : null;

  const state = !camp || !context ? "no_camp" : !context.settings.enabled ? "disabled" : context.active ? "ready" : "mapping_broken";

  return (
    <PageBody>
      <PageHeader
        title={copy.title}
        badge={camp ? <Badge tone="paid">{camp.name}</Badge> : undefined}
        description={camp ? copy.intro(camp.name) : copy.state.noCamp}
      />
      <BusStation
        state={state}
        canScan={canUseSection(profile, "bus")}
        canEditSettings={canUseSection(profile, "camps")}
        settingsHref={camp ? `/admin/camps/${camp.id}/felder` : null}
        initialTrip={tripFromParam(first(params.fahrt))}
        initialCode={isTicketCode(code) ? code : null}
      />
    </PageBody>
  );
}
