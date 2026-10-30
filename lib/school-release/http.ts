import type { ReleasePdf } from "./data";

/**
 * Response helpers for the release PDF routes (specs/020-school-release,
 * contracts/school-release.md). Every failure gets the same plain 404 body.
 */

export function pdfResponse(pdf: ReleasePdf, disposition: "attachment" | "inline"): Response {
  return new Response(new Blob([pdf.bytes as BlobPart], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${pdf.fileName}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export function plainResponse(status: 401 | 403 | 404, body: string): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
