# Feature Specification: Landingpage Aufbau, Gestaltung und Technik

**Feature Branch**: `024-landing-structure`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Landingpage überarbeiten: Aufbau, Gestaltung und Technik (Feedbackpunkte 11 bis 16). 1) Neue Reihenfolge der Abschnitte: Hero, Fakten, Programm, Gemeinschaft und Anreise, Anmeldung, danach ein Bereich \"Gut zu wissen\" (FAQ) mit Bezahlen, Packliste und Schulbefreiung; Packliste und Schulbefreiung stehen nicht mehr vor der Anmeldung. 2) Navigation: \"Start\" entfällt, Einträge für Schulbefreiung (nur wenn der Abschnitt sichtbar ist) und FAQ kommen dazu; Footer passend. 3) Die Überschrift im Lagerfeuerblock (\"Sei dabei und erlebe den Sommer deines Lebens\") bricht auf dem Desktop nicht mehr Wort für Wort um. 4) Alle Inhalte sind ohne JavaScript bzw. vor dem Laden sichtbar; die Einblendanimation beim Scrollen ist nur eine Zugabe und darf nie zu leeren Flächen führen, auch nicht im Hero. 5) Vorschaubild und Metadaten für geteilte Links (WhatsApp, Social Media) mit Campname und Termin. 6) Die Chips der Packliste wirken nicht mehr klickbar (kein Hover Effekt, da keine Links). Nicht im Umfang: Inhalte wie Impressum, Termine, Zielgruppe, Eltern, Fotos, Markenname (Punkte 1 bis 10)."

**Kontext**: Ein Review der Landingpage am 2026-10-30 hat 16 Punkte ergeben. Diese Spec deckt
nur Aufbau, Gestaltung und Technik ab (Punkte 11 bis 16). Heute stehen Packliste und
Schulbefreiung vor der Anmeldung, obwohl sie erst danach wichtig sind. Abschnitte sind bis zum
Laden des Skripts unsichtbar, sodass auf langsamen Handys leere Flächen und ein leerer Hero zu
sehen sind. Geteilte Links zeigen kein Vorschaubild.

Eine Impeccable Kritik (Designprüfung plus Detektor, Snapshot in
`.impeccable/critique/2026-10-30T13-00-31Z__app-page-tsx.md`, Wert 20 von 32) hat die Punkte
bestätigt und ergänzt.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-30 getroffen)**:

- „So kommst du ins Camp“ ist Logistik und wandert nach „Gut zu wissen“; vor der Anmeldung
  bleiben nur die Jugendgruppen.
- „Gut zu wissen“ besteht aus offenen, kompakten Blöcken, kein Akkordeon.
- Die Buttons zur Anmeldung richten sich nach dem Anmeldestatus; im Countdown verspricht nichts
  mehr „Jetzt anmelden“.
- „Anmelden“ steht in der Navigation als Button rechts.
- Unter der Überschrift der Anmeldung steht eine kurze Zeile zu Preis und Zahlungsarten.
- Die Schulbefreiung bleibt sichtbar wie heute (keine Änderung an Spec 020), einen Kalenderlink
  am Countdown gibt es in dieser Spec nicht.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Inhalte sind sofort sichtbar (Priority: P1)

Jemand öffnet die Landingpage auf einem langsamen Handy oder mit abgeschaltetem JavaScript.
Überschrift, Text und Buttons im Hero sind sofort da, und beim Scrollen erscheint jeder Abschnitt
mit Inhalt, nie eine leere Fläche.

**Why this priority**: Eine scheinbar leere Seite wirkt kaputt und kostet Anmeldungen. Das ist
der schwerste Mangel dieser Gruppe.

**Independent Test**: Seite mit abgeschaltetem JavaScript öffnen und bis zum Footer scrollen.
Danach mit stark gedrosseltem Netz auf Handygröße laden und sofort scrollen.

**Acceptance Scenarios**:

1. **Given** JavaScript ist aus, **When** die Landingpage geladen wird, **Then** sind alle Texte,
   Bilder und Buttons aller Abschnitte sichtbar.
2. **Given** ein langsames Netz, **When** die Seite zu laden beginnt, **Then** ist der Text im Hero
   sichtbar, bevor das Skript geladen ist.
3. **Given** JavaScript ist an, **When** ein Abschnitt ins Bild scrollt, **Then** darf er sanft
   einblenden, war aber vorher nie vollständig unsichtbar für jemanden ohne Skript.
4. **Given** die Einstellung „Bewegung reduzieren“ ist aktiv, **When** die Seite geladen wird,
   **Then** erscheinen alle Inhalte ohne Animation.

---

### User Story 2 · Sinnvolle Reihenfolge mit „Gut zu wissen“ (Priority: P1)

Eine Besucherin liest von oben nach unten: worum es geht, die wichtigsten Fakten, das Programm,
wer dabei ist, dann die Anmeldung. Danach findet sie unter „Gut zu wissen“ die Antworten zu
Anreise, Bezahlen, Packliste und Schulbefreiung.

**Why this priority**: Die Anmeldung ist das Ziel der Seite. Nebenthemen davor verlängern den Weg
dorthin.

**Independent Test**: Landingpage öffnen und die Reihenfolge der Abschnitte prüfen. Mit
aktivierter und deaktivierter Schulbefreiung vergleichen.

**Acceptance Scenarios**:

1. **Given** die Landingpage, **When** sie von oben nach unten gelesen wird, **Then** ist die
   Reihenfolge: Hero, Fakten, Programm, Jugendgruppen, emotionaler Lagerfeuerblock, Anmeldung,
   „Gut zu wissen“, Footer.
2. **Given** „Gut zu wissen“, **When** der Bereich angezeigt wird, **Then** enthält er unter einer
   gemeinsamen Überschrift die offenen Blöcke Anreise, Bezahlen, Packliste und Schulbefreiung,
   jeweils mit kleinerer Überschrift als die Abschnitte darüber.
3. **Given** die Schulbefreiung ist für das aktuelle Camp aus oder das Camp ist vorbei, **When**
   „Gut zu wissen“ angezeigt wird, **Then** fehlt nur das Thema Schulbefreiung, ohne Lücke.
4. **Given** ein bestehender Link auf `#packliste` oder `#schulbefreiung` (etwa aus einer Mail),
   **When** er geöffnet wird, **Then** springt die Seite zum passenden Thema in „Gut zu wissen“.
5. **Given** die Packliste in „Gut zu wissen“, **When** sie angezeigt wird, **Then** führt der Link
   weiterhin zur vollständigen Packliste.

---

### User Story 3 · Navigation passt zur Seite (Priority: P2)

Die Navigation oben und der Footer zeigen genau die Ziele, die es auf der Seite gibt.

**Why this priority**: Kleiner Aufwand, aber spürbar bessere Orientierung.

**Independent Test**: Jeden Navigationseintrag auf Desktop und Handy anklicken, mit Schulbefreiung
an und aus.

**Acceptance Scenarios**:

1. **Given** die Navigation, **When** sie angezeigt wird, **Then** gibt es keinen Eintrag „Start“;
   der Name oben links führt zum Seitenanfang.
2. **Given** die Navigation, **When** sie angezeigt wird, **Then** enthält sie die Textlinks Camp,
   Gut zu wissen und, nur bei sichtbarer Schulbefreiung, Schulbefreiung, dazu ganz rechts einen
   hervorgehobenen Button zur Anmeldung (im Handymenü ebenfalls hervorgehoben).
3. **Given** der Footer, **When** er angezeigt wird, **Then** enthält er dieselben Ziele wie die
   Navigation plus den Link zur vollständigen Packliste.
4. **Given** das Handymenü, **When** ein Eintrag angetippt wird, **Then** schließt sich das Menü
   und die Seite springt zum Ziel, ohne dass die Überschrift unter der festen Leiste verschwindet.

---

### User Story 4 · Vorschaubild beim Teilen (Priority: P2)

Jemand teilt den Link zur Landingpage in einer WhatsApp Gruppe. In der Vorschau erscheinen ein
Bild, der Name des Camps und der Termin.

**Why this priority**: Der Link wird vor allem in Jugendgruppen geteilt; eine leere Vorschau wird
übersehen.

**Independent Test**: Die Vorschaudaten der Startseite mit einem Prüfwerkzeug für geteilte Links
auslesen und das Vorschaubild direkt öffnen.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp mit Start und Enddatum, **When** der Link geteilt wird, **Then**
   zeigt die Vorschau ein Bild mit Campname und Termin auf Deutsch, dazu Titel und Beschreibung.
2. **Given** das aktuelle Camp hat noch kein Datum oder es gibt kein aktuelles Camp, **When** der
   Link geteilt wird, **Then** zeigt die Vorschau ein Bild mit dem Campnamen ohne Termin und ohne
   Fehler.
3. **Given** die Coming Soon Sperre ist aktiv, **When** der Link geteilt wird, **Then** verrät die
   Vorschau nichts, was die Sperre verbergen soll (sie verhält sich wie die Coming Soon Seite).

---

### User Story 5 · Feinschliff der Gestaltung (Priority: P2)

Die Überschriften lesen sich auf dem Desktop in wenigen, ausgewogenen Zeilen, auch die im
Lagerfeuerblock. Auf dem Handy ist in der Faktenkarte nichts abgeschnitten. Was nicht klickbar
ist, reagiert auch nicht auf die Maus.

**Why this priority**: Die Impeccable Kritik vom 2026-10-30 hat gezeigt, dass derselbe Fehler
drei Überschriften betrifft (Lagerfeuer 8 Zeilen, Programm und Packliste je 3 Zeilen auf rund
260 bis 320 Pixel Breite) und die Faktenkarte auf 375 Pixel die Adresse abschneidet. Das wirkt
kaputt, gerade am emotionalen Höhepunkt.

**Independent Test**: Seite bei 1280 und 1440 Pixel Breite und auf Handygröße ansehen und über
die Packlistenbegriffe fahren.

**Acceptance Scenarios**:

1. **Given** eine Breite ab 1024 Pixel, **When** der Lagerfeuerblock angezeigt wird, **Then** steht
   die Überschrift auf höchstens drei Zeilen und keine Zeile besteht aus nur einem Wort.
2. **Given** Handygröße, **When** der Lagerfeuerblock angezeigt wird, **Then** passt die Überschrift
   ohne waagrechtes Scrollen und ohne abgeschnittene Wörter.
3. **Given** die Packlistenbegriffe und die Programmkarten, **When** die Maus darüber fährt,
   **Then** ändern sie weder Farbe, Lage noch Zeiger.
4. **Given** eine Breite ab 1024 Pixel, **When** die Abschnitte Programm und Packliste angezeigt
   werden, **Then** nutzen ihre Überschriften eine ihrer Schriftgröße angemessene Breite und stehen
   auf höchstens zwei Zeilen.
5. **Given** Handygröße 375 Pixel, **When** die Faktenkarte angezeigt wird, **Then** sind Wert und
   Notiz jeder Zeile vollständig lesbar, nichts ist abgeschnitten.

---

### User Story 6 · Ehrliche Buttons und Preis an der Anmeldung (Priority: P2)

Ein Jugendlicher tippt im Countdown auf den Button im Hero. Dort steht nicht „Jetzt anmelden“,
sondern wann die Anmeldung öffnet. Eine Mutter, die bei der Anmeldung ankommt, sieht direkt unter
der Überschrift, was das Camp kostet, was enthalten ist und wie bezahlt wird.

**Why this priority**: Ein Button, der etwas verspricht, das nicht geht, kostet Vertrauen. Eltern
zögern am Formular meist wegen des Geldes.

**Independent Test**: Die Seite im Zustand offen, Countdown, geschlossen und ausgebucht ansehen
und alle Buttons zur Anmeldung lesen; die Preiszeile mit und ohne Einladungslink prüfen.

**Acceptance Scenarios**:

1. **Given** die Anmeldung ist offen, **When** Hero, Navigation und Lagerfeuerblock angezeigt
   werden, **Then** laden ihre Buttons zum Anmelden ein.
2. **Given** der Countdown läuft, **When** dieselben Buttons angezeigt werden, **Then** nennen sie
   das Öffnungsdatum (etwa „Anmeldung ab 30. November“) und führen zum Countdown.
3. **Given** die Anmeldung ist geschlossen oder ausgebucht, **When** dieselben Buttons angezeigt
   werden, **Then** sagen sie das und versprechen keine Anmeldung.
4. **Given** ein aktuelles Camp mit Grundpreis, **When** der Anmeldebereich angezeigt wird,
   **Then** steht unter der Überschrift eine kurze Zeile mit dem öffentlichen Grundpreis, was
   enthalten ist und den Zahlungsarten.
5. **Given** ein Einladungslink mit verstecktem Preis, **When** der Anmeldebereich angezeigt wird,
   **Then** zeigt die Preiszeile weiterhin nur den öffentlichen Grundpreis; der versteckte Preis
   erscheint nur dort, wo er heute erscheint.

---

### Edge Cases

- Kein aktuelles Camp: „Gut zu wissen“ zeigt Anreise, Bezahlen und Packliste, das Vorschaubild zeigt nur
  den Campnamen bzw. den allgemeinen Namen des Summercamps.
- Anmeldung im Zustand Countdown, geschlossen oder ausgebucht: Reihenfolge und Navigation bleiben
  gleich.
- Aufruf mit `?einladung=`: Die Anmeldung mit verstecktem Preis funktioniert unverändert.
- Laden der Schulbefreiungseinstellungen schlägt fehl: Thema und Navigationseintrag fehlen, die
  Seite lädt trotzdem.
- Sehr lange Campnamen im Vorschaubild werden umbrochen oder gekürzt, nie abgeschnitten über den
  Rand.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Landingpage MUSS die Abschnitte in der Reihenfolge Hero, Fakten, Programm,
  Jugendgruppen, Lagerfeuerblock, Anmeldung, „Gut zu wissen“, Footer zeigen.
- **FR-002**: „Gut zu wissen“ MUSS die Themen Anreise, Bezahlen, Packliste und Schulbefreiung als
  offene Blöcke unter einer gemeinsamen Überschrift bündeln; Inhalt und Funktion der Themen
  (Ankunft, Treffpunkt, Fahrgemeinschaft, Zahlungsarten, Auszug der Packliste mit Link, Formular
  zum Anfordern des Links) bleiben erhalten.
- **FR-003**: Das Thema Schulbefreiung MUSS genau dann erscheinen, wenn es heute erscheint
  (Schalter des aktuellen Camps an, Camp nicht vorbei, Einstellungen lesbar).
- **FR-004**: Die Sprungziele `#camp`, `#anmelden`, `#packliste` und `#schulbefreiung` MÜSSEN
  erhalten bleiben; „Gut zu wissen“ bekommt ein eigenes Sprungziel.
- **FR-005**: Die Navigation MUSS ohne „Start“ auskommen, die Textlinks Camp, Gut zu wissen sowie
  bedingt Schulbefreiung und rechts einen hervorgehobenen Button zur Anmeldung zeigen; der Name
  oben links MUSS zum Seitenanfang führen.
- **FR-006**: Der Footer MUSS dieselben Ziele wie die Navigation und den Link zur vollständigen
  Packliste enthalten.
- **FR-007**: Sprungziele MÜSSEN so landen, dass die Überschrift nicht unter der festen Leiste
  liegt.
- **FR-008**: Alle Inhalte der Landingpage einschließlich Hero MÜSSEN ohne JavaScript sichtbar
  sein; Einblendanimationen DÜRFEN Inhalte nur für Besucher mit laufendem Skript kurz
  ausblenden.
- **FR-009**: Bei „Bewegung reduzieren“ MÜSSEN alle Inhalte ohne Animation sichtbar sein.
- **FR-010**: Die Startseite MUSS Vorschaudaten für geteilte Links liefern: Titel, Beschreibung,
  Sprache Deutsch und ein Vorschaubild im üblichen Querformat.
- **FR-011**: Das Vorschaubild MUSS den Campnamen und, falls vorhanden, den Termin des aktuellen
  Camps im deutschen Datumsformat zeigen; versteckte Preise DÜRFEN nie darauf erscheinen.
- **FR-012**: Während der Coming Soon Sperre DARF das Vorschaubild nur für Admins erreichbar sein,
  wie jede andere öffentliche Adresse.
- **FR-013**: Die Überschrift im Lagerfeuerblock MUSS ab 1024 Pixel Breite auf höchstens drei
  Zeilen stehen, ohne einzelne Wörter pro Zeile; dieselbe Regel für die Breite von Überschriften
  MUSS für alle Abschnittsüberschriften der Landingpage gelten.
- **FR-014**: Nicht klickbare Elemente (Begriffe der Packliste, Programmkarten, Zahlungsarten)
  DÜRFEN keinen Hover Effekt und keinen besonderen Zeiger haben.
- **FR-016**: Die Faktenkarte MUSS auf 375 Pixel Breite alle Werte und Notizen ohne Abschneiden
  zeigen.
- **FR-017**: Auch bei „Bewegung reduzieren“ MÜSSEN Inhalte von Anfang an sichtbar sein, nicht
  erst beim Scrollen.
- **FR-018**: Das Handymenü MUSS sich mit Esc, durch Tippen außerhalb und nach Wahl eines Ziels
  schließen.
- **FR-019**: Jedes Sprungziel MUSS so landen, dass es auch beim direkten Aufruf aus einer Mail
  zuverlässig sichtbar ist und nicht von der festen Leiste verdeckt wird.
- **FR-020**: Die Beschriftung aller Buttons zur Anmeldung (Hero, Navigation, Lagerfeuerblock)
  MUSS dem Anmeldestatus folgen (offen, Countdown mit Öffnungsdatum, geschlossen, ausgebucht) und
  dieselbe Regel nutzen, die heute den Anmeldebereich steuert.
- **FR-021**: Der Anmeldebereich MUSS unter der Überschrift eine kurze Zeile mit öffentlichem
  Grundpreis, Leistungen und Zahlungsarten zeigen; ohne aktuelles Camp entfällt die Zeile.
  Versteckte Preise DÜRFEN darin nie erscheinen.
- **FR-015**: Alle neuen sichtbaren Texte MÜSSEN deutsch sein und zentral bei den übrigen Texten
  der Landingpage liegen.

### Key Entities

- **Aktuelles Camp**: liefert Name, Start und Enddatum für das Vorschaubild sowie den Schalter der
  Schulbefreiung. Keine neuen Daten, keine Änderung am Datenbestand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mit abgeschaltetem JavaScript sind 100 % der Abschnitte mit Inhalt sichtbar.
- **SC-002**: Auf einem gedrosselten Handy ist der Hero Text beim ersten sichtbaren Bild da, nicht
  erst nach dem Laden des Skripts.
- **SC-003**: Zwischen Seitenanfang und Anmeldung liegen höchstens fünf Abschnitte statt heute
  acht; Anreise, Packliste, Bezahlen und Schulbefreiung stehen danach. Auf dem Handy ist die
  Anmeldung damit deutlich früher erreicht als heute nach rund 8,6 Bildschirmhöhen.
- **SC-007**: In keinem Anmeldestatus führt ein Button mit dem Versprechen „Jetzt anmelden“ zu
  einer geschlossenen Anmeldung.
- **SC-004**: Ein Prüfwerkzeug für geteilte Links zeigt für die Startseite Titel, Beschreibung und
  Bild mit Campname und Termin.
- **SC-005**: Jeder Navigations und Footerlink führt zu einem existierenden Ziel; kein toter Link
  in beiden Zuständen der Schulbefreiung.
- **SC-006**: Die Überschrift im Lagerfeuerblock steht bei 1280 Pixel Breite auf höchstens drei
  Zeilen.

## Assumptions

- „Gut zu wissen“ zeigt die Themen als offene, kompakte Blöcke (zwei Spalten auf dem Desktop, eine
  auf dem Handy), kein Akkordeon. So bleiben Sprungziele aus Mails ohne Skript sichtbar und das
  Formular der Schulbefreiung muss nicht erst aufgeklappt werden.
- Der Text „Die Anmeldung öffnet in Kürze“ im Countdown darf im Zuge von FR-020 konkreter werden
  (Öffnungsdatum); weitere Textänderungen gehören zur Inhaltsspec.
- Der Lagerfeuerblock bleibt als emotionaler Übergang direkt vor der Anmeldung.
- Das Vorschaubild wird aus den Daten des aktuellen Camps erzeugt, nicht als festes Bild
  hochgeladen, damit der Termin jedes Jahr stimmt. Als Hintergrund dient eine ruhige Fläche in
  den Farben der Seite; echte Fotos folgen mit Punkt 4 des Reviews.
- Inhalte (Termine, Zielgruppe, Impressum, Fotos, Markenname „CampConnect“, „Bergen“ und
  „Jugenden“ in Texten) bleiben unverändert; sie sind Gegenstand einer eigenen Spec. Die Kritik
  nennt sie als größten Hebel für Vertrauen (Wert 2 bei „Bezug zur echten Welt“).
- Die Animationen im Hero und beim Scrollen bleiben erhalten, sofern sie FR-008 erfüllen.
- Keine Änderung an Datenbank, Anmeldung, Bezahlung oder Adminbereich.
