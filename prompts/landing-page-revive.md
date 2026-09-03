# Landing Page Revive — warm, alive, cinematic

## Goal

The public landing page (`app/page.tsx` and `components/marketing/*`) currently reads
**dark and lifeless**. Fix that. Bring it to life with warm, full-color cinematic
photography, smoother motion (parallax, staggered reveals, hover physics, ken-burns),
and a warmer, less-near-black palette — inspired by the two references the user added
(`media/_.jpeg` SAHARA/Travels desert hero, `media/d6d50a4a5a88ac9678f3a59d8c332a90.jpg`
BBC Earth AFRICA wildlife hero): full-bleed color photography, huge display type, only a
soft gradient for legibility (not a near-black wash).

**Design read:** event landing page (Christian youth summer camp, "Ein Sommer in den
Bergen") for teenagers + their youth-group leaders, warm golden-hour / outdoor-adventure
language, leaning into full-color cinematic photography + generous display type + smooth
scroll-driven motion. Persuade mode (impeccable): the design *is* the product; earn
attention and the "Jetzt anmelden" action.

This is a **refinement of the existing landing page**, not a rebuild. Keep all copy,
section order, anchors (`#start #camp #packliste #anmelden`), the registration state
logic (open/countdown/closed), and the server/client boundaries. Only the **look and
motion** change.

**Scope is the landing page only.** Do not touch `/admin`, auth pages, `/packzettel`,
`/bezahlen`, the registration form logic, or any server/data code. The dark admin theme
(`html[data-admin-theme="dark"] .admin-theme-scope`) must remain untouched.

## User decisions (locked)

1. **Imagery:** curated real photo URLs — full-color outdoor/nature/camp photography via
   Unsplash direct URLs, as a strong, swappable baseline (replaces the grayscale picsum).
2. **Animation:** add the **`motion`** library (framer motion, `import { motion } from "motion/react"`)
   for parallax, staggered scroll reveals, hover physics, and ken-burns.
3. **Palette:** **warm & alive overhaul** — keep amber as the anchor accent, but bring in
   warm golden light, full-color photography, and lighter/warmer sections. Cut the
   near-black bands down to at most one or two deliberate dark moments.

## Existing code inspected

- `app/page.tsx` — composes 9 marketing sections in order. `export const dynamic = "force-dynamic"`.
- `components/marketing/mountain-hero.tsx` — **main offender**: `picsum` photo with
  `grayscale`, two stacked `ink-950/85..45` gradients, dark `bg-ink-950` base. CSS
  `.animate-rise` stagger. Vertical side label + dot pagination decoration.
- `components/marketing/program-highlights.tsx` — feature tile also `grayscale opacity-45`
  with a full `from-ink-950` gradient; two flat tiles (surface + amber-100).
- `components/marketing/intro-facts.tsx`, `packing-teaser.tsx`, `arrival-community.tsx`,
  `payment-faq.tsx`, `closing-cta.tsx`, `registration-section.tsx`, `site-footer.tsx` —
  all use the `Reveal` wrapper (IntersectionObserver + CSS transition).
  `arrival-community` and `closing-cta` use dark `bg-surface-inverse` bands.
- `components/marketing/reveal.tsx` — zero-dep scroll reveal (fade + 6px lift), honors
  reduced-motion. Will be **superseded** by Motion's `whileInView` but may stay for
  Server-Component sections (see below).
- `components/marketing/site-nav.tsx` — overlay/solid nav, single line desktop, hamburger
  mobile. Add a scroll-aware solid background transition (transparent over hero → solid
  on scroll).
- `components/ui/button.tsx` — `ButtonLink`/`Button`, pill, `active:scale-[0.98]`. Reuse.
- `app/globals.css` — design tokens (ink scale + amber + semantic), `.animate-rise`,
  `--ease-out-expo`, reduced-motion block. Add warm-light tokens here.
- `app/layout.tsx` — fonts (Archivo display, Geist sans/mono), ClerkProvider. No change
  needed unless adding a font weight.
- `next.config.ts` — `images.remotePatterns` only allows `picsum.photos`. **Must add**
  `images.unsplash.com`.
- `package.json` — no animation lib yet; `@phosphor-icons/react` available.

## Decisions / assumptions

- **Keep the design-token architecture** but extend it: add a small set of warm tokens
  (e.g. a warm off-white `--sand-50`, a deeper golden `--amber-700` for text-on-light,
  maybe a warm shadow) rather than hardcoding hex in components. One accent stays amber.
- **Photography treatment:** full color, NO grayscale. Gradients only where text sits over
  a photo, and kept warm + light-handed (e.g. `from-ink-950/60 via-ink-950/10 to-transparent`
  or a warm amber-tinted scrim) — never the current `/85` near-black wash.
- **Real image URLs:** use Unsplash direct `images.unsplash.com/photo-...` URLs with
  `?auto=format&fit=crop&w=...&q=...`. Pick warm golden-hour outdoor/mountain/campfire/
  community/worship-adjacent images. Each `<Image>` keeps a `// TODO: swap for real camp
  photo` comment so the client can drop in their own later. Keep `alt` text in German.
- **Motion install:** `npm install motion`. All motion components are `"use client"`
  isolated leaves. Server Components (`RegistrationSection` is async) must NOT become
  client — wrap only their inner presentational pieces, or keep `Reveal` for those.
- **Reduced motion:** every Motion usage guards with `useReducedMotion()` and renders the
  final state instantly (matches the existing reduced-motion discipline in globals.css).
- Do not add a second accent color (COLOR CONSISTENCY LOCK). Amber stays the only accent.
- Do not introduce AI-purple gradients, glassmorphism-on-everything, or three-equal-cards.

## Files likely to change

- `package.json` / lockfile — add `motion`.
- `next.config.ts` — allow `images.unsplash.com`.
- `app/globals.css` — warm tokens; keep `.animate-rise` for non-motion fallback.
- `components/marketing/mountain-hero.tsx` — full rework (client): color photo, warm light
  scrim, parallax on scroll, ken-burns zoom, staggered Motion reveals for eyebrow/H1/sub/CTAs.
- `components/marketing/program-highlights.tsx` — color imagery, warm gradient, hover
  scale/lift via Motion, at least 2-3 cells with real visual variation (BENTO diversity).
- `components/marketing/intro-facts.tsx`, `packing-teaser.tsx`, `arrival-community.tsx`,
  `payment-faq.tsx`, `closing-cta.tsx` — warm up backgrounds, reduce near-black, add
  Motion `whileInView` stagger (or keep `Reveal` where the section stays server-rendered).
- `components/marketing/site-nav.tsx` — scroll-aware background transition.
- `components/marketing/reveal.tsx` — keep (used by async server sections); optionally
  fold into a shared `MotionReveal` client component for the client sections.
- Possibly a new `components/marketing/parallax-image.tsx` client helper.

Do NOT change: registration-form.tsx, registration-section.tsx data logic,
countdown-panel.tsx logic, any `lib/`, `app/api/`, admin, or Supabase code.

## Implementation requirements

### Hero (the priority)
- Full-bleed **color** photo (warm golden-hour mountain/valley/outdoor). Remove `grayscale`.
- Replace the two heavy dark gradients with ONE warm, legibility-only scrim: darker at the
  bottom-left where the copy sits, transparent toward the top-right so the photo stays
  visible and warm. Text must still pass WCAG AA over the image (audit the H1 + sub + CTAs).
- **Parallax:** the photo drifts slower than scroll (`useScroll` + `useTransform` on `y`
  and a slight `scale`), giving depth. Isolated to the hero client component.
- **Ken-burns:** a very slow continuous scale (e.g. 1.0 → 1.06 over ~18s, ease, alternate)
  on the photo, gated on `useReducedMotion`.
- **Entrance:** eyebrow → H1 → sub → CTAs stagger in (Motion, spring or expo ease). Replace
  the CSS `.animate-rise` here with Motion for consistency.
- Keep hero within `min-h-[100dvh]`, headline ≤ 2 lines desktop, CTAs visible without
  scroll (impeccable/tasteskill hero discipline). Keep the existing two CTAs
  ("Jetzt anmelden" primary, "Mehr erfahren" outline) — do not add a third text element.
- Nav sits over the hero (overlay). On scroll past the hero, nav gains a solid warm
  background + foreground text (scroll-aware, client).

### Other sections
- **De-darken:** convert the `bg-surface-inverse` bands (`arrival-community`, `closing-cta`)
  to warm treatments — either a warm-light surface or a color-photo band with a light warm
  scrim. Keep at most one intentional dark "campfire/worship" moment if it earns it.
- **Program highlights:** feature tile gets a real color photo (worship/campfire), warm
  bottom-up gradient (not `from-ink-950` full), hover scale+lift. The two side tiles get
  real visual variation (a photo or a warm tint), not flat text cards.
- **Motion everywhere it's motivated:** staggered `whileInView` reveals on section headings
  and grids, hover physics on cards and CTAs, image ken-burns/parallax on photo sections.
  Motion must be motivated (hierarchy/feedback/story) — do not animate every element.
- Respect tasteskill anti-slop rules: EYEBROW RESTRAINT (max ~1 per 3 sections — the page
  currently over-uses `.eyebrow`/mono labels; trim them), ZIGZAG cap, one accent locked,
  section-layout variety, real images (not div fakes).
- **Page theme lock:** the page is a warm-light theme with photographic dark moments — no
  jarring flip between a bright section and a near-black section without intent.

### Motion / code discipline
- `npm install motion`; import from `motion/react`.
- Every animated component is `"use client"` and an isolated leaf. `RegistrationSection`
  stays an async Server Component — animate only its inner presentational children (client)
  or keep `Reveal`.
- Continuous/scroll values use `useScroll`/`useMotionValue`/`useTransform`, never `useState`
  per frame.
- All motion honors `useReducedMotion()` → instant final state.
- TypeScript throughout, explicit props, small components. No `any`. German UI copy only;
  English identifiers. No unrelated refactors.

## Security requirements

- None sensitive here (public marketing page, no secrets). Do not add tracking/3rd-party
  scripts. Only outbound requests are the Next/Image loader fetching Unsplash images
  (allow-listed in `next.config.ts`).

## Acceptance criteria

- Hero shows a **warm full-color** photo (no grayscale), legible copy over a light warm
  scrim, with visible parallax + ken-burns + staggered entrance; CTAs above the fold.
- No section reads as a near-black "dead" band unless it's a single deliberate dark moment.
- Every photo is full color; all `<Image>` have German `alt` + a `// TODO: real camp photo`
  marker.
- Smooth staggered scroll reveals and hover physics on cards/CTAs, all reduced-motion safe.
- Nav transitions from transparent-over-hero to solid-on-scroll.
- Anchors, copy, registration states, and server/client boundaries unchanged; admin theme
  untouched.
- `npm run lint` and `npm run build` pass.

## Checks to run

- `npm run lint`
- `npm run build`
- Report exact output of both.

## Manual test steps

1. `npm run dev` → open http://localhost:3000.
2. Hero: confirm color photo, readable headline/sub/CTAs, parallax on scroll, slow
   ken-burns, staggered entrance. Nav goes solid after scrolling past hero.
3. Scroll the whole page: sections reveal with stagger; cards lift on hover; no dark dead
   bands; palette feels warm and alive.
4. DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" → reload: everything
   appears in final state, no animation, still looks correct.
5. Resize to mobile (375px): hero fits `100dvh`, columns collapse, nav hamburger works,
   images not distorted.
6. Verify `/admin` still loads in its dark theme, unaffected.
