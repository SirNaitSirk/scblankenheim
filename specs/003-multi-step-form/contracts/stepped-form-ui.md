# Contract: Public Stepped Registration Form

Component: `components/marketing/registration-form.tsx` (replaces the flat list; still the only
public form). Props unchanged: `fields`, `availability`, `invitationToken`.

## Layout per step

```
┌ card ─────────────────────────────────────────────┐
│ progress   [Deine Daten]─[Gesundheit]─[Prüfen]      │  ≥ 640px: segments with titles
│            Schritt 2 von 4  ▬▬▬▬▬▬▬▬░░░░░░          │  < 640px: label plus bar
│                                                     │
│ H3  Gesundheit                     (focus target)   │
│     optional subtitle                               │
│                                                     │
│     fields of this step (gap 20px)                  │
│                                                     │
│ [Zurück]                               [Weiter →]   │  phone: stacked, primary first
└─────────────────────────────────────────────────────┘
```

Review step: title `Angaben prüfen`, one group per step with heading, `Ändern` button and a
definition list. Values: text as entered, checkbox `Ja` or `Nein`, empty `Keine Angabe`, date in
German format. Server error banner above the primary button `Verbindlich anmelden`.

## Buttons

| Situation | Left | Primary |
|-----------|------|---------|
| Step 1 | none | `Weiter` |
| Step 2..n | `Zurück` | `Weiter` |
| Step opened from review | `Zurück` | `Zurück zur Übersicht` |
| Review | `Zurück` | `Verbindlich anmelden` / `Wird gesendet …` |

## Motion

| Element | Default | Reduced motion |
|---------|---------|----------------|
| Step enter / exit | x ±24px and opacity, 0.32s, ease `[0.22,1,0.36,1]`, direction aware | opacity only, 0.15s |
| Card height | layout animation, same timing | none |
| Progress fill | scaleX, 0.32s | none |
| Error on Next | first invalid field focused, no shake | same |

## Accessibility

- Live region: `Schritt {n} von {total}: {title}` on every change.
- Focus moves to the step heading; on validation failure to the first invalid input.
- Progress segments are `aria-hidden`; the textual `Schritt n von m` is the accessible label.
- Enter in single line inputs submits the form element, which runs Next on question steps.

## New copy (in `lib/register/messages.ts`, `steps` group)

`coreTitle: "Deine Daten"`, `autoTitle: "Weitere Angaben"`, `reviewTitle: "Angaben prüfen"`,
`reviewIntro`, `next: "Weiter"`, `back: "Zurück"`, `backToReview: "Zurück zur Übersicht"`,
`edit: "Ändern"`, `submit: "Verbindlich anmelden"`, `progress(n, total)`,
`announce(n, total, title)`, `yes: "Ja"`, `no: "Nein"`, `empty: "Keine Angabe"`.
