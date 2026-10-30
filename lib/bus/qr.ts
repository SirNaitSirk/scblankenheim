import "server-only";

import QRCode from "qrcode";
import { QR_PNG_SIZE } from "./limits";

/** QR rendering on the server (specs/021-bus-ticket, research R2). */

const OPTIONS = { errorCorrectionLevel: "M", margin: 4, color: { dark: "#000000", light: "#ffffff" } } as const;

/** SVG markup that scales with its container (no fixed width or height). */
export async function qrSvg(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { ...OPTIONS, type: "svg" });
  return svg.replace(/\s(width|height)="[^"]*"/g, "");
}

export async function qrPng(text: string, size: number = QR_PNG_SIZE): Promise<Buffer> {
  return QRCode.toBuffer(text, { ...OPTIONS, type: "png", width: size });
}

/** PNG as data URL; only for the admin mail preview, never in sent mails. */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { ...OPTIONS, width: 240 });
}
