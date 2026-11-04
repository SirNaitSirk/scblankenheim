# Contracts: Campfeedback

Alle Meldungen an Nutzer sind deutsch und stehen in `lib/feedback/messages.ts` (öffentlich) bzw.
`lib/admin/messages.ts` unter `de.feedback` (Admin). Eingaben werden mit Zod geprüft.

## Öffentlich

### Seite `GET /feedback/[code]` (`app/feedback/[code]/page.tsx`)

- Lädt per Service Client `camp_feedback_settings` mit `link_code = code`, dazu Camp und Fragen.
- Antwortet immer mit Status 200 und `robots: noindex`.
- Zustände:
  - `unavailable`: Code unbekannt, Feedback geschlossen oder keine Fragen. Einheitlicher Hinweis
    ohne Campname (FR-006).
  - `done`: Cookie `feedback_<campId>` gesetzt. Dank mit Hinweis „schon geantwortet“.
  - `form`: Campname, Anonymitätshinweis, Fragen sortiert, verstecktes `nonce` (neue UUID),
    `formToken` (`issueFormToken`) und Fallenfeld.

### Server Action `submitFeedback` (`app/feedback/[code]/actions.ts`)

Eingabe:

```ts
{
  code: string;                        // aus der Adresse
  nonce: string;                       // uuid
  formToken: string;
  trap?: string;                       // Fallenfeld, muss leer sein
  answers: Record<string, unknown>;    // key -> Rohwert aus dem Formular
}
```

Ablauf (alles auf dem Server):

1. Code auflösen; geschlossen oder unbekannt → `{ status: "unavailable" }`.
2. `checkSubmission(trap, formToken)`: `silent` → `{ status: "ok" }` ohne Speichern; `expired` →
   `{ status: "expired" }` (Seite neu laden).
3. Drosselung über `submission_attempts` (`kind = 'feedback'`, IP aus `requestIp`, `camp_id`):
   pro IP oder Camp über der Grenze → `{ status: "throttled" }`.
4. Aktuelle Fragen laden, `validateFeedback(questions, answers)` aus `lib/feedback/validation.ts`:
   Werte von Schlüsseln, die es nicht mehr gibt, werden verworfen; Fehler →
   `{ status: "invalid", errors: Record<key, string>, questions? }` (bei geänderten Fragen kommen
   die neuen Fragen mit, Spec Edge Case).
5. Insert in `feedback_responses` (`camp_id`, `nonce`, `answers`). Unique Verletzung auf `nonce`
   zählt als Erfolg.
6. Cookie `feedback_<campId>=1` setzen (`path=/feedback`, `httpOnly`, `sameSite=lax`,
   `maxAge=365 Tage`, `secure` in Produktion).
7. `{ status: "ok" }`.

Kein Logeintrag, keine Mail.

Ergebnis:

```ts
type SubmitFeedbackResult =
  | { status: "ok" }
  | { status: "unavailable" }
  | { status: "expired" }
  | { status: "throttled" }
  | { status: "invalid"; errors: Record<string, string>; questions?: PublicFeedbackQuestion[] };
```

## Admin (alle mit `requirePermission("feedback")`, sonst `ActionResult` Fehler „keine Berechtigung“)

Server Actions in `app/admin/feedback/actions.ts`, Rückgabe wie üblich `ActionResult` aus
`lib/admin/types.ts`, danach `revalidatePath` der betroffenen Seite.

| Action | Eingabe | Regeln |
|--------|---------|--------|
| `createFeedbackQuestion` | `campId`, `label`, `type`, `required`, `options[]`, `key` | Schlüssel eindeutig im Camp; Optionen nur bei Auswahl; hinten anhängen |
| `updateFeedbackQuestion` | `id`, gleiche Felder | Mit Antworten: `key` und `type` gleich, `options` nur ergänzt (R7) |
| `deleteFeedbackQuestion` | `id` | erlaubt; Antworten bleiben |
| `moveFeedbackQuestion` | `id`, `direction: "up" \| "down"` | tauscht `sort_order` mit dem Nachbarn |
| `copyFeedbackQuestions` | `targetCampId`, `sourceCampId` | Quelle ≠ Ziel; nur fehlende Schlüssel; hinten anhängen; Ergebnis nennt die Zahl übernommener Fragen |
| `setFeedbackOpen` | `campId`, `open` | Öffnen nur mit mindestens einer Frage; legt bei Bedarf die Settings Zeile mit Code an |
| `renewFeedbackLink` | `campId` | neuer `link_code`; Logeintrag `feedback.link_renewed` ohne Code |

Logeinträge (`logs`) nur für Verwaltungsaktionen, nie für Antworten.

## Admin Seiten und Route Handler

| Adresse | Inhalt | Schutz |
|---------|--------|--------|
| `/admin/feedback` | Historie über alle Camps (US4) und Liste der Camps mit Antwortzahl und Zustand | `guardTab` + `canUseSection("feedback")` |
| `/admin/feedback/[campId]` | Kopf mit Schalter, Adresse, „QR Code zeigen“, „Als Bild laden“, „Link erneuern“; Tabs „Auswertung“ und „Fragen“; CSV Export | wie oben; Schreiben zusätzlich in den Actions |
| `/admin/feedback/[campId]/qr` | Vollbild und Druckansicht: großer QR Code, Campname, Adresse in Klarschrift | wie oben |
| `GET /api/admin/feedback/[campId]/qr` | PNG 1024 Pixel, `Content-Disposition: attachment; filename="feedback-qr-<campslug>.png"` | Clerk im Proxy + `requirePermission("feedback")`; 403 ohne |

## CSV Export (im Browser, `feedbackResponsesToCsv` in `lib/feedback/csv.ts`)

- Trennzeichen Semikolon, UTF 8 mit BOM, wie der Finanzexport.
- Spalten: eine pro Schlüssel (aktuelle Fragen in Reihenfolge, danach gelöschte), Kopf ist der
  aktuelle bzw. zuletzt gespeicherte Fragetext.
- Zeilen: eine pro Antwort, in zufälliger Reihenfolge gemischt. Mehrfachauswahl mit „, “ verbunden.
- Keine Spalte für Person, ID oder Zeit (FR-022).
- Dateiname: `feedback-<campslug>.csv`.
