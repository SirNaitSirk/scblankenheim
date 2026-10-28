# Research: Packliste für das aktuelle Camp

## R1 · Quelle der Packliste

- **Decision**: Ein typisiertes Modul `lib/marketing/packing-list.ts` exportiert die Bereiche und
  Gegenstände als Konstante. Seite und Teaser lesen nur daraus.
- **Rationale**: Spec Entscheidung 1. Ändert sich selten; eine Datei zu ändern ist einfacher als
  ein Editor im Adminbereich. Gleiche Haltung wie bei den Mailvorlagen (`lib/email/templates.ts`).
- **Alternatives considered**: Tabelle `packing_items` mit Admin Editor (Migration, Rechte, UI;
  für eine seltene Änderung zu viel). JSON Datei (kein Typschutz, kein Mehrwert gegenüber TS).

## R2 · Teaser auf der Startseite

- **Decision**: Jeder Gegenstand hat ein Flag `featured`. `components/marketing/packing-teaser.tsx`
  verliert seine eigene Liste und zeigt `featuredPackingItems()` aus dem Modul.
- **Rationale**: FR-005 und SC-004 (0 Abweichungen) sind so per Konstruktion erfüllt; ein Unit
  Test prüft zusätzlich, dass jeder Teaser Eintrag in der Liste steht und die Auswahl nicht leer ist.
- **Alternatives considered**: Die ersten N Einträge zeigen (unpassende Auswahl, etwa Kamm statt
  Schlafsack). Separate Teaserliste (genau das Problem von heute).

## R3 · Campname und Zeitraum

- **Decision**: Bestehenden Helfer `getLandingCamp()` aus `lib/marketing/current-camp.ts` nutzen
  und um `endDate` erweitern (`end_date` in den Select aufnehmen). Formatierung über
  `formatGermanDate()` aus `lib/time/berlin.ts`, Ausgabe etwa „12.07.2027 bis 18.07.2027“.
- **Rationale**: Konstitution IV verlangt einen gemeinsamen Helfer für das aktuelle Camp. Der
  Helfer nutzt den öffentlichen anon Client, liefert bei Fehlern `null` und ist per React `cache`
  günstig. Nur Name und Datum werden ausgegeben, keine Preise (FR-012).
- **Alternatives considered**: Eigener Query nur für Name und Datum (zweiter Weg zum aktuellen
  Camp, widerspricht IV). Die Formularfelder werden zwar mitgeladen, aber nicht ausgegeben; der
  Overhead ist eine kleine Abfrage und nicht relevant.

## R4 · Rendering und Caching

- **Decision**: `app/packzettel/page.tsx` als Server Component mit `export const dynamic =
  "force-dynamic"`, wie die Startseite.
- **Rationale**: Ein Wechsel des aktuellen Camps soll sofort sichtbar sein; die Seite ist klein,
  die Abfrage ist bereits gecacht pro Request. SC-002 (unter 2 Sekunden) ist damit erreichbar.
- **Alternatives considered**: Statisch mit Revalidierung (schneller, aber veraltete Campdaten nach
  einem Wechsel; der Gewinn ist bei dieser Last vernachlässigbar).

## R5 · Abhaken mit Speicherung auf dem Gerät

- **Decision**: Eine kleine Client Komponente `PackingChecklist` hält die Haken als Set von
  Gegenstand IDs und speichert sie in `localStorage` unter `packing-list:v1`. Lesen und Schreiben
  stehen in `try/catch`; schlägt das fehl, bleibt der Zustand nur im Speicher (FR-007, Edge Case
  privates Fenster). Beim Laden werden unbekannte IDs verworfen (Edge Case geänderte Liste).
- **Rationale**: Gleiches Muster wie `hooks/use-column-settings.ts` und `use-admin-theme.ts`.
  Keine Übertragung an den Server, keine personenbezogenen Daten.
- **Alternatives considered**: Speichern auf dem Server (Konto nötig, außerhalb Scope). Kein
  Speichern (P3 Akzeptanzszenario 2 nicht erfüllt).
- **Hydration**: Der Server rendert alle Kästchen leer; die Haken werden nach dem Mount aus dem
  Speicher geladen. Das vermeidet Abweichungen zwischen Server und Client.

## R6 · Stabile IDs

- **Decision**: Jeder Gegenstand trägt eine feste englische `id` (zum Beispiel `sleeping-bag`).
  Die Haken hängen an der ID, nicht am deutschen Text.
- **Rationale**: Eine Textkorrektur löscht keine Haken; eine neue ID gilt als neuer Gegenstand.
  Ein Unit Test prüft, dass IDs eindeutig sind.

## R7 · Druckansicht

- **Decision**: Die Liste steht in einem Element mit Klasse `print-sheet`. Die vorhandene Regel in
  `app/globals.css` (`body:has(.print-sheet)`) blendet beim Drucken alles andere aus. Ein Knopf
  „Drucken“ nutzt die bestehende `PrintButton` Komponente (aus `components/admin/` nach
  `components/ui/` verschieben, damit Marketing nicht aus Admin importiert). Im Druck ist das
  Kästchen leer, egal ob am Bildschirm abgehakt (FR-006). Bereiche erhalten `break-inside: avoid`
  und eine zweispaltige Anordnung, damit 24 bis 35 Einträge auf eine A4 Seite passen (SC-003).
- **Rationale**: Wiederverwendung statt neuer Druckmechanik; die Regel ist bereits für die
  Zimmerplanung erprobt.
- **Alternatives considered**: Eigene Druckroute wie `/admin/zimmerplanung/druck` (zweite Seite
  für denselben Inhalt, unnötig).

## R8 · Navigation und Footer

- **Decision**: Kopfbereich wie `PaymentShell`: Link „FCG Blankenheim Summercamp“ zur Startseite,
  dazu ein Aufruf „Jetzt anmelden“ zu `/#anmelden`. `SiteNav` wird nicht genutzt, weil ihre
  Einträge reine Anker der Startseite sind. Im Footer werden die Anker auf `/#camp` und
  `/#anmelden` umgestellt, damit sie auch von Unterseiten (`/packzettel`, `/bezahlen`)
  funktionieren (FR-008).
- **Rationale**: Kleinste Änderung, die FR-008 erfüllt; behebt nebenbei denselben toten Anker auf
  den Bezahlseiten.

## R9 · Texte

- **Decision**: Alle Texte der Seite (Titel, Einleitung, Knöpfe, Fortschritt, Metadaten) stehen in
  `lib/marketing/packing-list.ts` als `packingListMessages`, die Gegenstände direkt daneben.
- **Rationale**: Konstitution V verlangt ein zentrales Modul; die anderen Bereiche nutzen je ein
  `messages.ts` pro Domäne (`lib/payment/messages.ts`, `lib/register/messages.ts`).

## R10 · Barrierefreiheit

- **Decision**: Jeder Gegenstand ist ein echtes `<input type="checkbox">` mit `<label>`; Bereiche
  sind `<fieldset>` mit `<legend>`. Der Fortschritt steht in einem `aria-live="polite"` Element.
  Fokusring sichtbar, Trefferfläche mindestens 44 px hoch.
- **Rationale**: FR-010; native Elemente brauchen kein eigenes Tastaturverhalten.
