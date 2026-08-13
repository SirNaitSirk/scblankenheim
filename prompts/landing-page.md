# Prompt: Landing Page (`/`) — CampConnect

## Goal
Build the public landing page at `app/page.tsx` for the FCG Blankenheim Summercamp.
It must sell the camp and drive to registration, built entirely on the **existing**
design system (`app/globals.css` tokens, `components/ui/*`, `components/marketing/*`)
and guided by the `impeccable` + `design-taste-frontend` skills. Persuade surface.

## Design read
Persuade landing page for a Christian youth summer camp (teens / young adults + their
groups). Reuses the incumbent visual world: cinematic grayscale mountain hero, warm
amber accent, Archivo display + Geist body, uppercase mono eyebrows (rationed), pill
buttons, soft cards. Dials: VARIANCE 7 · MOTION 4 (CSS-only) · DENSITY 3.

## Existing code inspected
- `app/page.tsx` — current default Next.js template (to be replaced).
- `app/globals.css` — token system (ink scale, amber accent, radii, shadows, motion, `.eyebrow`).
- `components/marketing/mountain-hero.tsx` — full-bleed hero (reuse; overlay `SiteNav`).
- `components/marketing/site-nav.tsx` — nav with anchors `#start #camp #packliste #anmelden`.
- `components/ui/{button,card,badge,eyebrow}.tsx` — primitives.
- `app/design-system/page.tsx` — reference for section composition + tone.
- `lib/cn.ts` — className joiner. No `motion`/`gsap` deps (Tailwind v4 + React 19 only).

## Content source (from the live v1 bundle — information only, not design)
Real German copy pulled from `summercamp.fcg-blankenheim.de`:
- Value prop: „Erlebe eine unvergessliche Woche voller Gemeinschaft, Abenteuer, Spaß und Glaube."
- „Ein Camp voller Gemeinschaft, Abenteuer und Glaube. Wir freuen uns auf dich und deine Gruppe."
- „Sei dabei und erlebe den Sommer deines Lebens!"
- Program highlights: **Worship Sessions** („Gemeinsam Gott begegnen"),
  **Input & Workshops** („Inspirierende Inputs und interaktive Workshops"),
  **Sport, Lagerfeuer & Nacht-Geländespiel** („Glaube, Spaß und Gemeinschaft").
- Packliste: Schlafsack, Iso-Matte (fürs Zelt), Kissen, Handtuch, Waschzeug, Zahnbürste,
  Zahnpasta, warme Sachen, lockere Kleidung, regenfeste Schuhe, etwas Sportliches, die Bibel.
- Anreise / Check-in: „16 Uhr · FCG Blankenheim, Bahnhofstraße 18" + Fahrgemeinschaft möglich.
- Beteiligte Jugenden: Blankenheim, Euskirchen, C3, Kall, Lüdenscheid, Ludwigshafen.
- Bezahlung: „Die Bezahlung läuft sicher online direkt bei der Anmeldung — per Karte,
  Apple Pay, Google Pay oder PayPal." (rewrite without em-dash).
- Kontakt: „Bei Fragen melde dich gerne unter:" + Mail.

## Decisions / assumptions
- **Dates & exact price are DB-driven** (`camps` / `camp_settings`) and not public. Use the
  repo's own example framing as placeholders: **„Sommer 2026"** and **Teilnahmebeitrag ab
  150 €**, clearly marked as placeholder in a code comment. (Live site title is „Summercamp 27";
  repo examples say 2026 — per AGENTS I trust the repo and flag this: **confirm the target year/price**.)
- **Static page for now** — CTAs link to `#anmelden` / `/bezahlen` placeholders; the config-driven
  registration form and live camp data are separate future tasks. No data fetching here.
- Keep the incumbent theme pattern: cinematic dark hero as a media section, light `canvas`
  content below (one theme family; hero is photographic, not a mid-page inversion).
- All copy German; identifiers/comments English. Copy lives inline for now (a shared messages
  module is a later refactor; note as TODO).
- Images: reuse the hero picsum seed; add at most one supporting placeholder image with a
  clear `TODO: replace with real camp photography` comment. No div-fake screenshots.

## Files likely to change / add
- `app/page.tsx` — rewrite to compose the landing sections (Server Component).
- `components/marketing/mountain-hero.tsx` — minor: wire CTAs to `#anmelden` / anchors,
  align eyebrow/side-label copy; keep design intact.
- New section components under `components/marketing/`:
  - `intro-facts.tsx` — lead paragraph + 3 key-fact tiles (Termin · Ort · Beitrag).
  - `program-highlights.tsx` — asymmetric bento of the 3 real highlights (not 3 equal cards).
  - `packing-teaser.tsx` — packing items as grouped chips + link to `/packzettel`.
  - `arrival-community.tsx` — Anreise/Check-in + beteiligte Jugenden.
  - `payment-faq.tsx` — Kosten & sichere Bezahlung, short reassurance.
  - `closing-cta.tsx` — final CTA + Kontakt.
  - `site-footer.tsx` — minimal footer.
  - `reveal.tsx` — tiny `"use client"` IntersectionObserver wrapper for CSS scroll-reveal
    (opacity/translate, honors `prefers-reduced-motion`). Reused across sections.
- Update `site-nav.tsx` anchors only if section ids change (keep `#camp #packliste #anmelden`).

## Section plan (≥4 distinct layout families, eyebrows ≤ 3 total incl. hero)
1. **Hero** (`MountainHero`) — value prop, primary „Jetzt anmelden", secondary „Mehr erfahren".
2. **Intro + Fakten** — left lead text, right 3 stacked fact tiles (asymmetric split).
3. **Programm-Highlights** — bento: one large tile (Worship) + two stacked (Input/Workshops, Sport & Lagerfeuer).
4. **Packliste-Teaser** — full-width band, items as chips, CTA to `/packzettel`.
5. **Anreise & Gemeinschaft** — two-column: Check-in/Adresse card + beteiligte-Jugenden list.
6. **Kosten & Bezahlung** — centered reassurance block (payment methods as text, no fake logos).
7. **Abschluss-CTA** — inverse (`surface-inverse`) band, „Sei dabei…" + Kontakt-Mail.
8. **Footer** — brand + copyright + quick links.

## Implementation requirements
- Server Components by default; only `reveal.tsx` and `site-nav.tsx` are `"use client"`.
- Use only existing tokens/utilities (`bg-canvas`, `bg-surface-inverse`, `text-amber-400`,
  `rounded-card`, `shadow-card`, `font-display`, `.eyebrow`, `max-w-[1400px]` container, etc.).
- Reuse `Button`, `Card`, `Badge`, `Eyebrow`; do not fork new visual primitives.
- Motion: CSS transitions + IntersectionObserver reveal only. No new dependencies.
- Responsive: mobile-first, high-variance layouts collapse to single column `< md`.
- `min-h-[100dvh]` hero (already), never `h-screen`.
- Zero em-dashes anywhere in visible copy.
- `metadata` on the page: German title/description.

## Security requirements
- None active (static, public). No secrets, no service-role client, no data fetching.
- No inline forms that post anywhere yet; CTAs are anchors/hrefs only.

## Acceptance criteria
- `/` renders the full landing page with real camp information, no Next.js boilerplate left.
- Built purely on existing design system; visually coherent with `/design-system`.
- All visible copy is German; all code identifiers/comments English.
- Passes the taste-skill Pre-Flight: one theme family, one accent, one radius scale,
  ≤3 eyebrows, ≥4 layout families, no 3-equal-card row, no em-dashes, no AI-slop tells,
  reduced-motion respected, mobile collapse explicit.
- CTAs point to `#anmelden` (and `/packzettel`, `/bezahlen` where relevant) as placeholders.

## Checks to run
- `npm run lint`
- `npm run build`
- Then run the impeccable detector over changed targets:
  `node .agents/skills/impeccable/scripts/detect.mjs --json app/page.tsx components/marketing/*.tsx`

## Manual test steps
1. `npm run dev`, open `http://localhost:3000`.
2. Verify hero fits the viewport; „Jetzt anmelden" scrolls to `#anmelden`.
3. Scroll through all sections; confirm reveal animations fire and are disabled under
   OS „reduce motion".
4. Resize to 375px width; confirm every section collapses to one clean column.
5. Confirm packing teaser links to `/packzettel`; payment section mentions Karte/Apple Pay/
   Google Pay/PayPal; community list shows all six Jugenden; contact mail is present.
6. Compare against `/design-system` for token/visual consistency.
