# Quickstart: Landingpage Aufbau, Gestaltung und Technik

## Prerequisites

- `.env.local` with the Supabase public variables and `APP_URL=http://localhost:3000`.
- A current camp with start and end date and an opening time in the future (countdown state).
- `npm run dev`, then open http://localhost:3000.

## Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Manual validation

1. **Visible without JavaScript (US1)**: DevTools, disable JavaScript, reload. Hero text, every
   section and every block of „Gut zu wissen“ are visible down to the footer.
2. **Slow phone (US1)**: Mobile size, network „Slow 4G“, reload. The hero headline is in the first
   painted frame. Scroll fast: no empty areas.
3. **Reduced motion (FR-009, FR-017)**: Emulate `prefers-reduced-motion: reduce`. Everything is
   visible immediately, nothing fades in.
4. **Order (US2)**: Hero, Facts, Program, Youth groups, Campfire band, Registration, Gut zu wissen
   (Anreise, Bezahlen, Packliste, Schulbefreiung), Footer.
5. **Anchors from mails (FR-004, FR-019)**: Open `/#packliste`, `/#schulbefreiung`, `/#anmelden`
   in a fresh tab. Each lands with its heading visible below the nav.
6. **School release off (FR-003)**: Turn the release switch of the current camp off in the admin.
   The block and the nav item disappear, the grid has no gap.
7. **Navigation (US3)**: Desktop: Camp, Gut zu wissen, Schulbefreiung, CTA button right, all on one
   line at 1024 px. Brand jumps to the top. Mobile: menu closes with Esc, a tap outside and after
   choosing a target.
8. **CTA per state (US6)**: Countdown: hero and band read „Anmeldung ab …“, nav „Ab …“. Switch
   the camp to open, closed (deadline in the past) and full (capacity 1 with one registration):
   labels follow, none promises „Jetzt anmelden“ outside the open state.
9. **Price line (US6)**: Under the registration heading one line with the base price and payment
   methods. With `/?einladung=<valid token>` the line still shows the base price.
10. **Headings and facts (US5)**: At 1280 px the campfire heading has at most three lines, program
    heading at most two. At 375 px the facts card shows „Check in ab 16 Uhr, Bahnhofstraße 18“
    completely.
11. **No fake hover (FR-014)**: Hover packing tags, program cards and the youth group tile: no
    color change, no lift, no zoom.
12. **Share preview (US4)**: Open http://localhost:3000/opengraph-image: PNG with camp name and
    date range. View source of `/`: `og:image`, `og:title`, `og:locale`, `twitter:card` present.
    Clear the camp dates: image shows only the name.
13. **Coming soon (FR-012)**: Run with `COMING_SOON=true` in `.env.local`, signed out: `/` and
    `/opengraph-image` both show or return the coming soon response.
