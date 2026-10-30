import { busMessages } from "@/lib/bus/messages";
import { qrPng } from "@/lib/bus/qr";

/**
 * Sample QR image for the mail preview and test mails (specs/021-bus-ticket).
 * It encodes a plain sample text, never a ticket code, so it is safe to serve
 * publicly and scans as "Unbekannter Code".
 */

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const png = await qrPng(`${busMessages.participant.title} Beispiel`);
  return new Response(new Blob([new Uint8Array(png)], { type: "image/png" }), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
