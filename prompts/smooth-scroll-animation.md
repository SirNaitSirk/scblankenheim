# Prompt: Smooth Scrolling & Hero-Animation — Landingpage

> Nachträglich dokumentiert. Diese Änderung wurde umgesetzt, bevor das Prompt-File
> erstellt wurde — ein Verstoß gegen den AGENTS.md-Workflow (Prompt vor Code). Das
> File hält den tatsächlichen Umfang fest, damit die Historie konsistent bleibt.

## Goal
Weiches In-Page-Scrolling für die Anchor-Navigation der Landingpage und eine
gestaffelte Entrance-Animation für den above-the-fold Hero-Bereich, den der
IntersectionObserver-basierte `Reveal` nicht abdeckt. Alles reduced-motion-sicher.

## Existing code inspected
- `app/globals.css` — Token-/Base-Layer, bestehender `prefers-reduced-motion`-Guard.
- `components/marketing/mountain-hero.tsx` — Hero mit Eyebrow, H1, Subtext, CTAs.
- `components/marketing/reveal.tsx` — bestehende Scroll-Reveal-Logik (bleibt unverändert).

## Decisions / assumptions
- CSS-only, keine neue Dependency (konsistent mit dem Rest der Landingpage).
- Kein Sticky-Nav → `scroll-padding-top: 2rem` reicht als Anker-Abstand.
- Hero-Entrance über eine `@keyframes rise-in`, nur innerhalb
  `@media (prefers-reduced-motion: no-preference)` definiert → reduced-motion-User
  sehen sofort den Endzustand (kein hängendes `opacity: 0`).

## Files changed
- `app/globals.css`
  - `html { scroll-behavior: smooth; scroll-padding-top: 2rem; }`
  - `@keyframes rise-in` + `.animate-rise` (nur unter no-preference).
  - Reduced-motion-Block: `html { scroll-behavior: auto; }` ergänzt.
- `components/marketing/mountain-hero.tsx`
  - `.animate-rise` auf Eyebrow, H1, Subtext, CTA-Zeile mit gestaffeltem
    `animationDelay` (0.05s → 0.45s).

## Implementation requirements
- Nur `transform`/`opacity` animieren (Hardware-beschleunigt).
- Bestehende Design-Tokens nutzen (`--ease-out-expo`).
- Keine Änderung an Inhalt/Copy oder Layout.

## Security requirements
- Keine (rein visuell, statisch).

## Acceptance criteria
- Anchor-Klicks (`#camp`, `#packliste`, `#anmelden`) scrollen weich.
- Hero-Elemente steigen beim Laden gestaffelt ein.
- Unter „Bewegung reduzieren" sind Smooth-Scroll und Entrance deaktiviert.

## Checks
- `npm run lint` — clean.
- `npm run build` — passt.
- impeccable-Detector über geänderte Targets — keine Findings.

## Manual test steps
1. `npm run dev`, `http://localhost:3000`.
2. „Jetzt anmelden" klicken → weiches Scrollen zu `#anmelden`.
3. Seite neu laden → Hero-Text steigt gestaffelt ein.
4. OS „Bewegung reduzieren" aktivieren → sofortiger Sprung, keine Entrance.
