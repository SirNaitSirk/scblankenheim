# Research: Botschutz für das Anmeldeformular

## R1 · Formularzeitpunkt als signiertes Token

- **Decision**: Der Server Component `RegistrationSection` erzeugt beim Rendern ein Token
  `<issuedAtMs>.<hmac>` (base64url, HMAC SHA256 über `issuedAtMs`) und gibt es als Prop an das
  Formular. Das Formular schickt es unverändert als `formToken` mit. Die Prüfung vergleicht die
  Signatur mit `timingSafeEqual` und rechnet das Alter aus der Serveruhr.
- **Rationale**: Die Landingpage ist `force-dynamic`, jeder Aufruf bekommt ein frisches Token. Die
  Uhr des Geräts spielt keine Rolle. Nichts wird gespeichert, es braucht keine Tabelle.
- **Alternatives considered**: Zeitstempel ohne Signatur (vom Bot fälschbar); Token in der Datenbank
  ablegen (Schreibzugriff bei jedem Seitenaufruf, unnötig); Cookie (Prelaunch Gate und Caching
  komplizierter, kein Vorteil).

## R2 · Schlüssel für die Signatur

- **Decision**: Der Schlüssel wird aus `SUPABASE_ROLE_KEY` abgeleitet:
  `HMAC_SHA256(SUPABASE_ROLE_KEY, "registration-form-token")`. Kein neuer Env Eintrag.
- **Rationale**: Der Wert ist geheim, nur auf dem Server vorhanden und in jeder Umgebung gesetzt. Ein
  fehlender neuer Env Eintrag könnte sonst alle Anmeldungen blockieren. Die Ableitung mit festem Label
  trennt den Zweck sauber vom Datenbankzugriff; aus dem Token lässt sich der Schlüssel nicht
  zurückrechnen.
- **Alternatives considered**: Eigener Env Wert `FORM_TOKEN_SECRET` (sauberer getrennt, aber
  zusätzliche Einrichtung in Vercel und lokal; bei Bedarf später austauschbar, da nur
  `lib/register/form-token.ts` den Schlüssel kennt).

## R3 · Fallenfeld

- **Decision**: Ein Textfeld außerhalb von `values`, im Payload als `trap`. Sichtbar versteckt per
  Position außerhalb des Bildschirms (nicht `display:none`, das manche Bots erkennen), mit
  `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"` und einem Namen ohne Bezug zu Autofill
  Kategorien (kein name, email, tel, address, url, company).
- **Rationale**: Bots, die das HTML auswerten, füllen gern alle Felder. Liegt das Feld außerhalb von
  `values`, kann es die Feldprüfung der dynamischen Formularfelder nicht stören.
- **Alternatives considered**: Feld in `camp_form_fields` (falsche Stelle, Admins könnten es
  bearbeiten).

## R4 · Stille Abweisung

- **Decision**: Bei Fallenfeld, fehlendem, gefälschtem oder zu jungem Token antwortet die Route mit
  200 und `{ reference: generateReference(), free: true, checkoutUrl: null }`. Nichts wird
  gespeichert, keine Mail, keine Stripe Sitzung. Die Prüfung läuft in der Route vor
  `submitRegistration`, also vor jedem Datenbankzugriff außer dem Protokolleintrag.
- **Rationale**: Ein Bot bekommt keinen Hinweis, welche Schicht ihn erkannt hat (SC-005).
- **Alternatives considered**: 400 mit Fehler (verrät die Abwehr und lädt zum Nachbessern ein).

## R5 · Veraltetes Formular

- **Decision**: Gültige Signatur, Alter über 24 Stunden: Antwort 409 mit
  `registerMessages.api.formExpired`. Das Formular zeigt die Meldung wie jeden Serverfehler; die
  Eingaben bleiben im React State erhalten.
- **Rationale**: Ein Mensch soll merken, dass er nicht angemeldet ist. Ein Bot mit gültiger Signatur
  hat das Formular wirklich geladen und gewinnt durch den Hinweis nichts.

## R6 · Nachvollziehbarkeit abgewiesener Bots

- **Decision**: Pro stiller Abweisung eine Zeile in `submission_attempts` mit `kind`
  `registration_bot_trap`, `registration_bot_fast` oder `registration_bot_token`, dazu `ip` und
  `camp_id` (wenn bekannt), ohne `email`. Kein Eintrag in `logs` pro Bot.
- **Rationale**: `kind` ist freier Text ohne Check (Migration 0007), also keine Migration. Die Zeilen
  fallen unter die bestehende 7 Tage Löschung und die Datenschutzerklärung („IP Adresse und
  Zeitpunkt“). Ein Logeintrag pro Bot würde das Admin Protokoll fluten.

## R7 · Obergrenze pro Stunde

- **Decision**: In `submitRegistration` nach der Feldprüfung und vor `isThrottled`: Zahl der
  `submission_attempts` mit `kind = 'registration'` und `camp_id` des aktuellen Camps in der letzten
  Stunde. Ab `REGISTRATION_HOURLY_CEILING` (60) Ergebnis `busy`, Route antwortet 429 mit
  `registerMessages.api.busy`. Dabei wird höchstens einmal pro Stunde ein `logs` Eintrag
  `registration.ceiling` mit Stufe `warning` geschrieben (vorher Prüfung, ob in der letzten Stunde
  schon einer existiert). Schlägt die Zählung fehl, geht die Anmeldung weiter und der Fehler wird
  protokolliert.
- **Rationale**: Diese Zeilen schreibt nur der öffentliche Weg; Admin Anlagen über
  `createRegistrationAction` bleiben außen vor (FR-009). Kein neues Feld an `registrations` nötig.
  Gezählt werden Versuche mit gültigen Angaben, was bei einem Angriff eher früher greift (FR-006).
- **Alternatives considered**: `registrations.created_at` zählen (Admin Anlagen nicht unterscheidbar,
  bräuchte eine neue Spalte); feste Uhrstunden statt gleitender Stunde (Angriff kurz vor und nach
  dem Stundenwechsel doppelt so groß).

## R8 · Grenzwerte

- **Decision**: Neue Datei `lib/register/limits.ts` mit `FORM_MIN_FILL_MS = 3000`,
  `FORM_TOKEN_MAX_AGE_MS = 24 h`, `REGISTRATION_HOURLY_CEILING = 60`,
  `REGISTRATION_CEILING_WINDOW_MS = 1 h`. Die bestehende Drosselung in `service.ts` bleibt
  unverändert (FR-011).
