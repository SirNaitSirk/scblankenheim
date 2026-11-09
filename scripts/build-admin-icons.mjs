// Builds the icons of the admin home screen app (specs/040-admin-mobile-app).
//
// Usage: node scripts/build-admin-icons.mjs
//
// Renders the admin monogram "SC" (the brand block of the admin sidebar) with
// sharp, which ships with Next.js. The generated PNGs are committed; run the
// script again only when the design changes.
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BACKGROUND = "#0a0a0b"; // --ink-950, the sidebar monogram block
const LETTERS = "#ffffff";
const ACCENT = "#f2a85a"; // --amber-400

/**
 * SVG of the monogram on a full bleed square. `scale` shrinks the letters so
 * the maskable variant keeps them inside the 80% safe zone.
 */
function monogram(scale) {
  const size = 512;
  const fontSize = 230 * scale;
  const barWidth = 150 * scale;
  const barHeight = 22 * scale;
  const center = size / 2;
  const baseline = center + fontSize * 0.28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <text x="${center}" y="${baseline}" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="900"
    font-size="${fontSize}" letter-spacing="${-fontSize * 0.04}" fill="${LETTERS}">SC</text>
  <rect x="${center - barWidth / 2}" y="${baseline + fontSize * 0.16}"
    width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="${ACCENT}"/>
</svg>`;
}

const outputs = [
  { file: "public/admin-icons/icon-192.png", size: 192, scale: 1 },
  { file: "public/admin-icons/icon-512.png", size: 512, scale: 1 },
  { file: "public/admin-icons/icon-maskable-512.png", size: 512, scale: 0.78 },
  { file: "app/admin/apple-icon.png", size: 180, scale: 1 },
];

for (const { file, size, scale } of outputs) {
  const target = join(root, file);
  await mkdir(dirname(target), { recursive: true });
  await sharp(Buffer.from(monogram(scale)))
    .resize(size, size)
    .flatten({ background: BACKGROUND })
    .png({ compressionLevel: 9 })
    .toFile(target);
  console.log(`${file} (${size}px)`);
}
