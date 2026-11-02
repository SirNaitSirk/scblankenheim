# UI Contract: Landingpage Review Fixes

## Countdown panel (`#anmelden`, state `countdown`)

- One card (existing `rounded-card border bg-surface`, no wide shadow), centered.
- Line 1, display font, largest: „Samstag, 1. Februar 2027“.
- Line 2: „ab 18:00 Uhr“.
- Line 3, muted: „Noch 90 Tage“ · „Noch 5 Stunden“ · „In weniger als einer Stunde“.
- No seconds, no minutes, no `aria-live`. Server render and first hydration show lines 1 and 2;
  line 3 appears after hydration (no mismatch).
- Reached: existing „Es geht los!“ notice and one refresh.
- Mobile 375 px: lines wrap, no horizontal scroll.

## Nav (all pages using `SiteNav`)

- Items: „Camp“, „Gut zu wissen“. No „Schulbefreiung“ on desktop or in the mobile menu.
- Countdown short label: „Anmeldung ab 1.2.“.

## Review step (registration form)

- Between the review list (and server error) and the action row: block „So geht es weiter“ on
  `bg-sand-50`, small text, three lines with check icons, then the contact line with a mailto link.
- Not shown on earlier steps.

## Success notice

- Body text without the number, then a row: label „Referenznummer“, the number in a tabular,
  selectable style, button „Kopieren“ (outline, small) → „Kopiert“.
- Under it: „Du findest sie auch in deiner Bestätigungsmail.“
- Applies to paid and free success views; existing „Jetzt bezahlen“ and „Noch jemanden anmelden“ stay.

## Gut zu wissen · Bezahlen

- Text: „Du bezahlst sicher online, direkt nach der Anmeldung oder später über den persönlichen
  Link aus deiner Bestätigungsmail. Im Teilnahmebeitrag sind Übernachtung und Verpflegung für die
  ganze Woche enthalten.“

## Schulbefreiung block and footer link

- Visible only when release is active (spec 020) and the camp has ≥ 1 active registration.
- Submit button `variant="outline"`, full width as before.
