# Prompt: CampConnect Design System

## Goal
Establish the foundational **design system** for CampConnect (FCG Blankenheim Summercamp), derived from the three references in `media/`, and prove it with a live showcase page. This is foundation-only: tokens, fonts, base styles, and a `/design-system` showcase. No backend, no Clerk/Supabase wiring, no real product routes yet.

## Design read
Reading this as: the visual foundation for a Christian summer-camp registration platform (public **Persuade** landing surfaces + an internal **Operate** admin dashboard), with a **monochrome-editorial + cinematic mountain** language, leaning toward Tailwind v4 tokens + a heavy grotesque display face + one warm accent.

DNA extracted from the three `media/` references:
- **Skillset dashboard** — soft light-grey canvas, white rounded cards (~16px radius), hairline borders, one near-black "hero" card, pill toggles, restrained monochrome, sidebar shell.
- **SAFFRON** — heavy black display wordmark, uppercase letter-spaced nav, grayscale mountain photography, generous whitespace, floating panel with soft shadow.
- **apreatif "Mountains"** — full-bleed mountain hero, massive bold display headline, warm sunset gradient wash over B&W photo, thin uppercase spaced nav, dot pagination, vertical side labels.

## Decisions (approved by user)
- **Accent:** monochrome base + **one warm amber/sunset accent** (`#E8933A` family). Used for CTAs, active states, focus rings, links, and the hero gradient wash. Locked for the whole system (COLOR CONSISTENCY LOCK).
- **Scope:** design tokens + fonts + base styles + a `/design-system` showcase page rendering every primitive. No landing-page rebuild yet, no product logic.
- **Shape lock:** cards = 16px radius; inputs = 10px; buttons/pills = full radius. One rule, applied everywhere.
- **Fonts (`next/font/google`, self-hosted, `swap`):**
  - Display/headlines: **Archivo** (700–900, wide grotesque — matches the heavy hero type).
  - Body/UI: **Geist Sans**.
  - Mono labels/data: **Geist Mono** (uppercase letter-spaced eyebrows, table numerics).
- **UI copy is German** (per AGENTS.md §11). Showcase demo strings are German; token/code identifiers stay English.

## Existing code inspected
- `app/globals.css` — Next scaffold default (`--background/--foreground`, `@theme inline`, body `font-family: Arial`). Will be replaced with the token system.
- `app/layout.tsx` — Geist + Geist Mono wired via `next/font`, `lang="en"`. Change display font wiring; set `lang="de"`.
- `app/page.tsx` — Next starter template (untouched by this task; left as-is or lightly linked to the showcase — do NOT build the real landing here).
- Tailwind v4 via `@tailwindcss/postcss` (`postcss.config.mjs`), no `tailwind.config` file — tokens live in `@theme` inside `globals.css`.
- No `prompts/`, `components/`, or `lib/` dirs yet.

## Token architecture (three layers, in `app/globals.css` via Tailwind v4 `@theme`)
Primitive → semantic → component, all as CSS variables exposed to Tailwind utilities.

**Color (primitives):**
- Ink scale (cool near-black → white): `--ink-950 #0A0A0B`, `--ink-900 #141416`, `--ink-700 #3A3A40`, `--ink-500 #6B6B73`, `--ink-300 #B7B7BE`, `--ink-200 #D6D6DB`, `--ink-100 #E9E9ED`, `--ink-50 #F5F5F7`, `--paper #FFFFFF`, `--canvas #ECECEE` (dashboard grey).
- Amber accent scale: `--amber-600 #C56E1F`, `--amber-500 #E8933A` (base), `--amber-400 #F2A85A`, `--amber-100 #FBE9D4`.
- Status (muted, derived once): `--success #2E7D57`, `--warning --amber-500`, `--danger #B23B3B`.

**Semantic tokens:** `--background` (=canvas), `--surface` (=paper), `--surface-inverse` (=ink-950), `--foreground` (=ink-950), `--muted-foreground` (=ink-500), `--border` (=ink-100), `--accent` (=amber-500), `--accent-foreground` (=ink-950 on amber / paper on ink), `--ring` (=amber-500).

**Scale tokens:**
- Radius: `--radius-card 16px`, `--radius-input 10px`, `--radius-pill 9999px`, `--radius-sm 8px`.
- Shadow (tinted to ink, never pure black): `--shadow-card 0 1px 2px rgba(20,20,22,.04), 0 8px 24px -12px rgba(20,20,22,.12)`; `--shadow-pop` slightly stronger for popovers.
- Spacing rhythm relies on Tailwind's default 4px scale (no custom needed).
- Type scale exposed as font families: `--font-display`, `--font-sans`, `--font-mono`.
- Motion: `--ease-out-expo cubic-bezier(0.16,1,0.3,1)`, durations `--dur-fast 150ms`, `--dur 250ms`.

Expose all via `@theme inline` so utilities like `bg-canvas`, `text-muted-foreground`, `rounded-card`, `shadow-card`, `font-display`, `ring-accent` work.

**Base layer:** body → `background: var(--canvas)`, `color: var(--foreground)`, `font-family: var(--font-sans)`; `*` selection color amber; sensible `-webkit-font-smoothing`. Provide `.eyebrow` utility (mono, uppercase, `tracking-[0.22em]`, `text-[11px]`, muted) — used sparingly per tasteskill eyebrow restraint.

## Files to create / change
- **`app/globals.css`** — replace with the token system + base layer above.
- **`app/layout.tsx`** — wire Archivo (`--font-display`) + Geist (`--font-sans`) + Geist Mono (`--font-mono`); `lang="de"`; update `metadata` (title `CampConnect — FCG Blankenheim Summercamp`, German description); keep `antialiased`, canvas background.
- **`lib/design-tokens.ts`** — small typed export documenting the token names (accent, radii, motion) for reuse in TS (no magic strings later). Types explicit, no `any`.
- **`components/ui/`** — minimal, hand-authored primitives that encode the system (NOT full shadcn install here; these are the demonstrated tokens made concrete):
  - `button.tsx` — variants `primary` (amber), `inverse` (ink), `ghost`, `outline`; sizes `sm/md/lg`; pill radius; `:active` `scale-[0.98]`; focus-visible amber ring; CVA-style variant map (plain object, no new dep) . Contrast-checked (amber bg → ink text).
  - `card.tsx` — `Card` (paper, 16px, `shadow-card`, hairline border) + `CardHeader/Title/Content`.
  - `badge.tsx` — status pills (paid/pending/muted) matching the dashboard "Paid" pill.
  - `eyebrow.tsx` — mono uppercase label.
- **`components/marketing/site-nav.tsx`** — the uppercase letter-spaced nav bar (SAFFRON/apreatif style), transparent-over-hero variant + solid variant, German items (`Start · Camp · Packliste · Anmelden`). Single line at desktop, ≤72px tall, hamburger below `md`.
- **`components/marketing/mountain-hero.tsx`** — full-bleed hero: B&W mountain image + warm amber gradient wash + massive `font-display` headline (German, ≤2 lines), one primary CTA, dot pagination + vertical side label as decoration. `min-h-[100dvh]`, hero fits initial viewport, `pt` ≤ `pt-24`. Uses a real image (see Assets).
- **`components/admin/stat-card.tsx`** + **`components/admin/dashboard-preview.tsx`** — the dashboard tile row (one near-black hero tile + white tiles) and a small course-table snippet with the "Bezahlt" badge, to prove the Operate side of the system.
- **`app/design-system/page.tsx`** — the showcase: color swatches, type scale, the nav, the mountain hero, buttons (all variants + states), cards, badges, and the dashboard-tile row — each section labeled. Server Component; only hero/nav interactivity islands are `"use client"` if needed (dot pagination can be static).

## Assets
- Hero + dashboard thumbnail need a real B&W mountain image. No image-gen tool is assumed available; use `https://picsum.photos/seed/blankenheim-mountains/2000/1200` (grayscale via CSS `filter grayscale` + the amber gradient overlay) as a labeled placeholder, with a `{/* TODO: replace with real camp photography */}` note. If an image-gen tool IS available in the environment, generate a B&W alpine/hill photograph instead and save under `public/media/`.
- Do NOT hand-roll SVG mountain illustrations or div-based fake screenshots.

## Implementation requirements
- TypeScript throughout, explicit prop types, no `any`. Small components, one concern each.
- Tailwind v4 utilities driven by the `@theme` tokens — no hardcoded hex in components; reference token utilities (`bg-accent`, `text-ink-500`, etc.).
- One accent (amber), one radius system, one type system — locked page-wide (tasteskill consistency locks).
- Respect `prefers-reduced-motion` for any transitions; keep motion subtle (`MOTION_INTENSITY ~3`, this is a foundation, not an Awwwards reel).
- Nav renders on one line at desktop; hero fits the first viewport; buttons never wrap at desktop; every button/badge passes WCAG AA contrast.
- German for all visible copy; English for all identifiers/comments. No mixed-language identifiers.
- No new runtime dependencies beyond what `next/font` already provides (CVA variants done with a tiny local helper).

## Security requirements
- None touched (no secrets, no server privileged work, no data layer). Pure presentation. Do not add env vars.

## Acceptance criteria
- `/design-system` renders: palette, type scale, nav (both variants), mountain hero, all button variants + hover/active/focus, cards, status badges, and the dashboard tile row — cohesive, monochrome + single amber accent.
- Tokens are the single source: changing `--amber-500` recolors every accent usage.
- Hero fits initial viewport, nav is one line at desktop, no CTA wraps, contrast holds, copy is German.
- `npm run lint` and `npm run build` both pass clean.

## Checks to run
- `npm run lint`
- `npm run build`
(Report exact output.)

## Manual test steps
1. `npm run dev`, open `http://localhost:3000/design-system`.
2. Verify each labeled section renders and looks cohesive at desktop width.
3. Resize to ~375px: nav collapses to hamburger, hero headline stays ≤2 lines and in-viewport, tiles stack.
4. Tab through buttons: amber focus ring visible; hover lifts, `:active` presses.
5. In `globals.css` temporarily change `--amber-500` → confirm all accents shift together, then revert.
