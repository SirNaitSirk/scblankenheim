import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatCampDateRange } from "@/lib/marketing/camp-dates";
import { getLandingCamp } from "@/lib/marketing/current-camp";
import { marketingMessages } from "@/lib/marketing/messages";

/**
 * Share image of the landing page (specs/024-landing-structure R7): camp name
 * and dates of the current camp on the page's warm sand, never a price.
 * Regenerated hourly so a new camp date shows without a deploy.
 */

const copy = marketingMessages.share;

export const alt = copy.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

// Brand tokens from app/globals.css (sand, amber, ink).
const SAND = "#fbf7f0";
const AMBER = "#e8933a";
const AMBER_DEEP = "#a4571a";
const INK = "#0a0a0b";

/**
 * The image is prerendered at build time, where preview builds may lack the
 * Supabase env. Fall back to the generic name instead of failing the build.
 */
async function readCamp() {
  try {
    return await getLandingCamp();
  } catch {
    return null;
  }
}

export default async function Image() {
  const [camp, font] = await Promise.all([
    readCamp(),
    readFile(join(process.cwd(), "assets/fonts/ArchivoBlack-Regular.ttf")),
  ]);
  const name = camp?.name ?? copy.fallbackName;
  const dates = camp ? formatCampDateRange(camp.startDate, camp.endDate) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: SAND,
          color: INK,
          fontFamily: "Archivo Black",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 10, borderRadius: 999, background: AMBER }} />
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: AMBER_DEEP }}>
            {copy.eyebrow}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: name.length > 34 ? 72 : 92,
              lineHeight: 1.02,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>
          {dates ? (
            <div style={{ fontSize: 44, color: AMBER_DEEP }}>{dates}</div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo Black", data: font, style: "normal", weight: 400 }],
    },
  );
}
