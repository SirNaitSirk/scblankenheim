# Research: Schnellere erste Antwort der Startseite

## Messung (2026-11-02)

- Startseite `/`: erstes Byte nach 0,85 bis 1,7 s, `cache-control: private, no-store`, `x-vercel-cache: MISS`.
- `/impressum`, `/datenschutz`: 0,1 bis 0,2 s im warmen Zustand.
- `x-vercel-id: fra1::iad1::…`: Der Besucher landet am Edge in Frankfurt, die Funktion läuft in
  Washington (iad1, Vercel Standard, `vercel.json` setzt keine Region).
- Supabase liegt in Stockholm (`lib/legal/operator.ts`, `hostingRegion`), am 2026-11-02 vom Nutzer im
  Supabase Dashboard bestätigt: Region `eu-north-1`.

## R1 · Ursache der Wartezeit

**Befund**: Die Startseite liest ihre Daten nacheinander, jede Stufe wartet auf die vorige:

1. `camp_settings` (aktuelles Camp), `lib/marketing/current-camp.ts`
2. `camps` und `camp_form_fields` (parallel)
3. Schulbefreiungseinstellungen, `lib/marketing/landing-state.ts`
4. Anzahl aktiver Anmeldungen (nur mit Kapazität oder aktiver Schulbefreiung)
5. Platzgrenzen pro Feld, `components/marketing/registration-section.tsx`
6. Einladung prüfen (nur mit `?einladung=`)

Jede Stufe geht von Washington nach Stockholm und zurück (rund 100 bis 120 ms), dazu kommt der
Verbindungsaufbau beim ersten Aufruf einer Instanz. Fünf bis sechs Stufen ergeben die gemessene
Sekunde. Impressum und Datenschutz lesen keine Daten und sind deshalb schnell.

## R2 · Funktionsregion neben die Datenbank legen

**Decision**: Die Vercel Funktionen laufen in `arn1` (Stockholm), festgelegt in `vercel.json`
mit `"regions": ["arn1"]`.

**Rationale**: Ein Konfigurationswert entfernt die Atlantiküberquerung für jede Abfrage. Eine Stufe
kostet dann wenige Millisekunden statt rund 110 ms. Der Inhalt bleibt exakt gleich, jede Anfrage
liest weiter live, also bleiben Anmeldestatus, Zeitpunkte, Kapazität und Einladung ohne jede
Verzögerung korrekt (FR003 bis FR006 ohne Zusatzaufwand erfüllt). Auch Admin, Teilnehmerseite und
Bezahlseite werden schneller (FR008). Der Weg vom Besucher in Deutschland zur Funktion wird ebenfalls
kürzer.

**Folgen**:

- Aufrufe an Clerk, Stripe und Resend (USA) werden etwas länger. Sie passieren beim Absenden, im
  Admin und in den Cron Läufen, nicht beim Anzeigen der Startseite. Die Anmeldung ruft Stripe einmal
  auf, das kostet rund 100 ms mehr, gleicht sich aber mit den eingesparten Datenbankstufen beim
  Speichern mehr als aus.
- Der Proxy prüft bei aktiver Prelaunch Sperre die Clerk Sitzung. Das passiert lokal ohne
  Netzaufruf, nur `isAdminUserId` liest die Datenbank und wird dadurch ebenfalls schneller.
- Datenschutzerklärung: Sie nennt Vercel als Hoster ohne Standort; der Text bleibt richtig.

**Alternatives considered**:

- *Gemeinsame Daten kurz zwischenspeichern* (`use cache` mit Cache Components oder `unstable_cache`):
  bringt ähnlich viel nur für die Startseite, verlangt aber Invalidierung an jeder Stelle, die Camps,
  Schulbefreiung oder Anmeldungen ändert, und erlaubt bis zu Minuten alten Stand. `unstable_cache`
  ist in Next.js 16 abgelöst, Cache Components wären eine projektweite Umstellung. Widerspricht
  Prinzip VII, solange die Region allein das Ziel erreicht. Bleibt als Stufe 2, falls die Messung
  nach R2 das Ziel verfehlt (siehe R4).
- *Abfragen parallelisieren* (Schulbefreiung und Anzahl gleichzeitig): spart eine Stufe, nach R2
  nur wenige Millisekunden. Nicht nötig.
- *Statische Seite mit clientseitigem Nachladen des Status*: verletzt „Inhalte ohne JavaScript
  sichtbar“ und ändert Verhalten.
- *Supabase in die USA umziehen*: Datenumzug, schlechter für Besucher in Deutschland, widerspricht
  der Angabe in der Datenschutzerklärung.

## R3 · Einladungslinks

**Decision**: Unverändert. Die Startseite bleibt pro Anfrage gerendert und `private, no-store`;
nichts wird zwischen Besuchern geteilt. FR005 ist damit strukturell erfüllt.

## R4 · Messkriterium und Stufe 2

**Decision**: Nach dem Deployment mit `arn1` zehn warme Aufrufe messen (siehe quickstart.md). Liegt
der Median unter 300 ms, ist die Spec erfüllt. Liegt er darüber, wird keine Stufe 2 in diesem Plan
improvisiert: der Befund wird gemeldet und eine Ergänzung des Plans (gemeinsame Daten kurz
zwischenspeichern, Grenze 5 Minuten laut Spec) zur Freigabe vorgelegt.

**Rationale**: Erwartet werden etwa 150 bis 250 ms (Edge Frankfurt nach Stockholm plus Rendern plus
fünf kurze Abfragen). Eine Messung ist billiger als spekulative Caching Logik.
