# Landing registration section — state-driven (open · countdown · closed)

## Goal

Replace the placeholder `#anmelden` call-to-action on the public landing page
(`app/page.tsx`) with a **state-driven registration section** whose content is
decided server-side from the **current camp**:

1. **Open** — `registrationOpen === true` → render the **config-driven
   registration form** built from `camp_form_fields` for the current camp.
   Fields are interactive and client-side validated. The network submit is
   **deliberately deferred** to a later step (see Scope decisions).
2. **Countdown** — registration not open yet **and** the opening moment is in
   the future → show a **live countdown** to `registrationOpensAt`
   (fallback: the camp `startDate`).
3. **Closed** — registration not open and there is no future opening moment →
   show a clear, friendly "registration closed" state.
4. **No current camp** (defensive) → treat as Closed.

## Scope decisions (confirmed with user)

- **Form scope = render form only.** Build the interactive, config-driven form
  with client-side Zod validation and all states, but do **not** build
  `/api/register`, DB writes, `submission_attempts`, or Stripe yet. On a valid
  submit the form shows an honest inline notice that online submission is being
  finalized — it must **not** fake a success or pretend to persist anything.
- **Countdown target = `registrationOpensAt`**, falling back to `startDate`
  when `registrationOpensAt` is null.

## Existing code inspected

- `app/page.tsx` — static marketing sections; `ClosingCta` renders the
  `#anmelden` anchor with placeholder buttons (`href="#anmelden"`,
  `TODO: point to the config-driven registration route once built`).
- `components/marketing/*` — section components; `Reveal` (scroll-reveal
  wrapper, reduced-motion aware), `mountain-hero.tsx` (hero CTA `#anmelden`).
- `lib/supabase/public.ts` — `getPublicClient()` (anon). RLS in
  `supabase/migrations/0001_init_schema.sql` already grants anon `select` on
  `camps`, `camp_settings`, `camp_form_fields`, `price_tiers` (hidden tiers
  excluded). **No new migration needed.**
- `lib/admin/data.ts` — service-role reads (admin only); `mapCamp` shows the
  camps row → domain mapping and the `camp_settings.current_camp_id` lookup.
  Do **not** reuse these here (they are `server-only` + service-role).
- `lib/admin/types.ts` — `Camp`, `CampFormField`, `FieldConfig`; field flags
  `registrationOpen`, `registrationOpensAt`, `registrationClosesAt`,
  `startDate`.
- `lib/admin/field-types.ts` — `FIELD_TYPES`
  (`text|textarea|email|tel|number|date|select|checkbox`), `isChoiceType`.
- `components/admin/field-preview.tsx` — read-only field rendering (disabled).
  Reuse the *shape/logic* (options/config reading, input-type mapping) for the
  live public field renderer, but the public one is **interactive**.
- `components/ui/*` — `Input`, `Select` (`{value,onChange,options}`),
  `Textarea`, `Button` (variants incl. `outline`, sizes incl. `lg`), `Field`.
- `lib/database.types.ts` — generated `Tables<...>` row types.
- Tokens (`app/globals.css`): monochrome `ink-*`, `amber-400/500/600`,
  semantic `accent`, `surface`, `surface-inverse`, `on-inverse`, `border`,
  `danger`, `success`; radii `--radius-input|card|pill`; `font-display`;
  `--ease-out-expo`; `animate-rise`.
- Deps: `zod@4` present. **`react-hook-form` is NOT installed** → use
  controlled React state + a dynamically-built Zod schema (no new dependency).

## Decisions / assumptions

- `registrationOpen` (the admin toggle) is the **master switch** for the Open
  state. We do not additionally gate Open on the `registrationClosesAt` window
  in this step (admin owns the switch); note as a future refinement.
- Copy lives inline in the new marketing components as a small local `const`
  object (matches the existing marketing convention where German copy is inline
  in each section — the `lib/admin/messages.ts` module is admin-scoped). Keep
  **all user-facing copy German**; code identifiers English.
- The landing read runs in a **Server Component** using the **anon** public
  client. Select only public-safe columns. No secrets, no service-role.
- State selection (open/countdown/closed) is computed **server-side**; only the
  ticking countdown and the form inputs are Client Components.

## Files likely to change / add

**Add**

- `lib/marketing/current-camp.ts` — server helper `getLandingCamp()`:
  reads `camp_settings.current_camp_id`, then the `camps` row and its
  `camp_form_fields` (ordered by `sort_order`) via the anon client. Returns a
  lightweight public shape:
  ```ts
  type LandingCamp = {
    name: string;
    startDate: string | null;
    registrationOpen: boolean;
    registrationOpensAt: string | null;
    fields: CampFormField[]; // reuse the domain type + mapping
  } | null;
  ```
  Include a small `getRegistrationState(camp): "open" | "countdown" | "closed"`
  helper with the precedence in Goal (target = `registrationOpensAt ??
  startDate`; countdown only when that target parses to a future instant).
- `components/marketing/registration-section.tsx` — **Server Component**.
  Fetches via `getLandingCamp()`, computes state, renders one of:
  `RegistrationForm` / `CountdownPanel` / `RegistrationClosed`. Owns the
  `#anmelden` section wrapper, eyebrow, and heading. Keep the section id
  `#anmelden` so the hero/nav CTAs still anchor here.
- `components/marketing/registration-form.tsx` — **Client Component**.
  Config-driven form from `fields`; controlled state; dynamic Zod schema built
  from field type + `required`; per-field German error messages; on valid
  submit show the honest "wird finalisiert" inline notice. Empty-fields
  fallback: friendly "in Kürze" message (no broken form).
- `components/marketing/countdown-panel.tsx` — **Client Component**. Live
  countdown (days/hours/minutes/seconds) to a passed ISO target; ticks each
  second via a single interval; reduced-motion respected (no gratuitous
  motion); shows the target date in German (`de-DE`) as supporting copy.
- `components/marketing/registration-closed.tsx` — closed state (can be a small
  component or inlined in the section) with contact fallback CTA
  (`mailto:info@fcg-blankenheim.de`, matching existing pattern).

**Change**

- `app/page.tsx` — swap `<ClosingCta />` for `<RegistrationSection />`
  (RegistrationSection becomes the `#anmelden` moment). Keep `SiteFooter` after
  it. Remove `ClosingCta` import if no longer used (or keep it as the emotional
  lead-in *above* the section — decide during build; do not leave dead
  imports).
- `components/marketing/closing-cta.tsx` — if kept as lead-in, drop its
  duplicate "Jetzt anmelden" button (the section below now owns the action) to
  avoid two competing CTAs; if fully replaced, delete the import only.

## Implementation requirements

- **Data layer:** anon client only; `select` explicit public columns; handle
  "no current camp" and query errors by returning `null` → Closed state (never
  throw on the public page).
- **Form:** one field renderer switch over `FIELD_TYPES`, interactive versions
  of every type (`text/email/tel/number/date` → `Input`, `textarea` →
  `Textarea`, `select` → `Select`, `checkbox` → native styled checkbox like
  FieldPreview). Read `placeholder`/`helpText` from `field.config`
  defensively. `required` fields marked with `*`. Client Zod validation on
  submit; show errors inline; focus/scroll first error is a nice-to-have.
- **No new dependency** (no react-hook-form). Keep components small and typed;
  no `any`.
- **i18n:** every visible string German, including validation errors, the
  countdown unit labels (Tage/Std./Min./Sek.), and the closed/deferred
  notices. Dates formatted with `Intl.DateTimeFormat("de-DE")`.

## Security requirements

- Public page uses the **anon** client only. Service-role key, Clerk secret,
  Stripe, `SUPABASE_ROLE_KEY` never imported into this path.
- Hidden price tiers are not read or rendered here.
- No secrets in client components; countdown/form are pure client UI over
  props passed from the server.

## UI / design (impeccable · Persuade mode; taste: refine incumbent world)

- **Language:** stay in the established monochrome-ink + warm-amber editorial
  system. No new palette, no AI-slop gradients/glass. `font-display` for the
  section heading; `Reveal` for entrance; `--ease-out-expo` timing.
- **Layout:** full-width band, `max-w-[1400px]` inner, `px-6 md:px-10`,
  generous vertical rhythm (`py-24`/`py-28`) consistent with siblings. Form in
  a comfortable single readable column (~`max-w-2xl`) on a `surface` card with
  `rounded-card` and hairline `border-border`; countdown/closed states
  centered and confident.
- **Open (form):** clear label→input rhythm, `1.5`–`2` gap; primary submit
  `Button size="lg"`; helper/eyebrow amber; error text `text-danger` small.
- **Countdown:** large numerals (display font), unit labels in
  `uppercase tracking` micro-caps `muted-foreground`; amber accent on the
  numerals or separators; supporting line "Anmeldung öffnet am <date>".
- **Closed:** honest, warm, not a dead end — short line + contact CTA.
- **States to cover:** loading is N/A (server-rendered); **empty** (no fields /
  no camp) → friendly "in Kürze"; **error** (query fail) → Closed fallback;
  **countdown reaching zero** client-side → swap to a gentle "Anmeldung sollte
  jetzt geöffnet sein — bitte Seite neu laden" (avoid negative timers).
- **Responsive:** countdown units wrap gracefully on mobile; form full-width on
  small screens; check desktop + mobile.
- **A11y:** labels tied to inputs (`htmlFor`/`id`), `aria-invalid` +
  `aria-describedby` on errored fields, `aria-live="polite"` on the countdown,
  visible focus rings (`--ring`), reduced-motion respected.

## Acceptance criteria

- Current camp with `registrationOpen = true` → the config-driven form renders
  all its `camp_form_fields`, is interactive, validates required/typed fields
  client-side, and shows the honest deferred-submit notice on valid submit
  (no fake success, no network call).
- Current camp with `registrationOpen = false` and a future
  `registrationOpensAt` (or future `startDate` when it is null) → live
  countdown ticks to that target with German labels + date.
- Current camp with `registrationOpen = false` and no future target → Closed
  state with contact CTA.
- No current camp / query error → Closed state (page never crashes).
- Hero and nav `#anmelden` CTAs scroll to the new section.
- All copy German; no English leaks; no service-role/secret import on the
  public path; no `any`; no new npm dependency.

## Checks to run

- `npm run lint`
- `npm run build` (routing/server-component + new client components changed)

## Manual test steps

1. `npm run dev` → open `http://localhost:3000`.
2. In Supabase (or seed), set the current camp `registration_open = true` →
   reload `/`, scroll to "Anmelden": form renders every configured field; try
   submitting empty → German required errors; fill validly → deferred notice.
3. Set `registration_open = false` and `registration_opens_at` to a near-future
   timestamp → reload: countdown appears and ticks; verify the German date.
4. Set `registration_opens_at = null` and `start_date` in the future → reload:
   countdown targets the start date.
5. Set `registration_open = false` with no future target (past dates) →
   reload: Closed state + contact CTA.
6. Click the hero "Jetzt anmelden" → smooth-scrolls to the section.
7. Check mobile width (375px) and reduced-motion.
