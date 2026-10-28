import { z } from "zod";
import { buildCampIcs, calendarFileName, toCampEvent } from "@/lib/calendar/ics";
import { calendarMessages } from "@/lib/calendar/messages";
import { appBaseUrl } from "@/lib/email/links";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Public calendar file of one camp (specs/019-calendar-file,
 * contracts/calendar.md). Only name, dates, location and the website link.
 */

// Any 8 4 4 4 12 hex id like Postgres accepts; seed camps use non RFC ids.
const campIdSchema = z.guid();

function notFound(): Response {
  return new Response(calendarMessages.notFound, {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campId: string }> },
): Promise<Response> {
  const parsed = campIdSchema.safeParse((await params).campId);
  // The request always has an origin, so a missing APP_URL does not break the file.
  const base = appBaseUrl() ?? new URL(request.url).origin;
  if (!parsed.success) return notFound();

  const { data: camp, error } = await getServiceClient()
    .from("camps")
    .select("id, name, start_date, end_date, location")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error || !camp) return notFound();

  const event = toCampEvent(camp, base);
  if (!event) return notFound();

  return new Response(buildCampIcs(event, new Date(), new URL(base).host), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${calendarFileName(camp.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
