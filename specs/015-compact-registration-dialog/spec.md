# Feature Specification: Kompakterer Anmeldedialog im Adminbereich

**Feature Branch**: `015-compact-registration-dialog`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Ich möchte bei der Ansicht der Anmeldungen, wenn ich eine öffne, ein wenig mehr auf einmal sehen. Wenn es recht viele Felder sind, wird das Pop up echt lang und man muss scrollen."

**Kontext**: Öffnet ein Admin in der Anmeldeliste eine Anmeldung (oder legt eine neue an), erscheint
ein Dialog mit drei Bereichen: Kontakt, Anmeldung (Preisstufe, Status, Zahlung, Beträge) und die
Campfelder des aktuellen Camps. Der Dialog ist schmal, und alle Campfelder stehen untereinander in
einer einzigen Spalte. Bei einem Camp mit vielen Feldern wird der Dialog sehr lang, und der Admin muss
viel scrollen, um eine Anmeldung zu überblicken oder zu bearbeiten.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Mehr Felder auf einen Blick (Priority: P1)

Ein Admin öffnet am Laptop oder Desktop eine Anmeldung. Der Dialog nutzt die Breite des Bildschirms
besser: Er ist deutlich breiter, und die Campfelder stehen nebeneinander in mehreren Spalten. Kurze
Felder (Text, Zahl, Datum, Auswahl) teilen sich eine Zeile. Lange Freitextfelder laufen über die volle
Breite, damit der Inhalt lesbar bleibt. Ja/Nein Felder stehen kompakt gesammelt nebeneinander.

**Why this priority**: Das ist der eigentliche Wunsch: weniger scrollen, mehr Überblick.

**Independent Test**: Ein Camp mit mindestens 12 Campfeldern (gemischt aus Text, Auswahl, Datum,
Ja/Nein und einem langen Freitext) anlegen, eine Anmeldung öffnen und mit vorher vergleichen. Es sind
deutlich mehr Felder gleichzeitig sichtbar, der Dialog ist spürbar kürzer.

**Acceptance Scenarios**:

1. **Given** ein Bildschirm mit mindestens 1280 Pixel Breite, **When** der Admin eine Anmeldung öffnet,
   **Then** stehen kurze Campfelder in mindestens drei Spalten nebeneinander.
2. **Given** ein Camp hat ein langes Freitextfeld, **When** der Dialog offen ist, **Then** nimmt dieses
   Feld die volle Breite ein.
3. **Given** ein Camp hat mehrere Ja/Nein Felder, **When** der Dialog offen ist, **Then** stehen sie
   kompakt nebeneinander statt jeweils in einer eigenen Zeile.
4. **Given** ein Camp mit 12 gemischten Campfeldern, **When** der Admin eine Anmeldung öffnet,
   **Then** ist die Gesamthöhe des Dialoginhalts höchstens etwa halb so groß wie vorher.
5. **Given** Kontakt und Anmeldebereich, **When** der Dialog breit dargestellt wird, **Then** nutzen
   auch diese Bereiche die zusätzliche Breite (mehr Felder pro Zeile).

---

### User Story 2 · Mobil bleibt bedienbar (Priority: P2)

Ein Admin öffnet eine Anmeldung auf dem Handy. Der Dialog ist wie bisher einspaltig und passt in die
Bildschirmbreite, ohne seitliches Scrollen.

**Why this priority**: Die Verbesserung darf die mobile Nutzung nicht verschlechtern.

**Independent Test**: Dieselbe Anmeldung bei 375 Pixel Breite öffnen. Alle Felder stehen untereinander,
nichts ragt über den Rand.

**Acceptance Scenarios**:

1. **Given** ein Bildschirm unter 640 Pixel Breite, **When** der Admin eine Anmeldung öffnet,
   **Then** stehen alle Felder in einer Spalte und es gibt kein seitliches Scrollen.
2. **Given** ein mittelgroßer Bildschirm (Tablet), **When** der Dialog offen ist, **Then** stehen die
   Felder in zwei Spalten.

---

### Edge Cases

- Ein Camp ohne Campfelder: Der Dialog zeigt nur Kontakt und Anmeldung, ohne leeren Bereich.
- Ein Camp mit nur einem oder zwei Campfeldern: Die Felder stehen links ausgerichtet, ohne merkwürdige
  Lücken.
- Sehr lange Feldbezeichnungen oder Hilfetexte: Sie brechen sauber um und überlappen keine
  Nachbarfelder.
- Validierungsfehler in einem Feld: Die Fehlermeldung erscheint direkt unter dem Feld, ohne das Raster
  der Nachbarfelder zu zerstören.
- Der Zahlungslinkbereich (bei offener Zahlung) bleibt vollständig sichtbar und bedienbar.
- Die Reihenfolge der Campfelder für Tastatur und Screenreader entspricht weiterhin der im Camp
  festgelegten Reihenfolge; nur die Ja/Nein Felder werden gesammelt dargestellt.
- Andere Dialoge im Adminbereich bleiben unverändert.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Anmeldedialog MUSS auf großen Bildschirmen deutlich breiter sein als heute und
  trotzdem einen Rand zum Bildschirm lassen.
- **FR-002**: Kurze Campfelder (Text, Mail, Telefon, Zahl, Datum, Auswahl) MÜSSEN je nach Breite in
  einer, zwei oder drei Spalten stehen (Handy, Tablet, Desktop).
- **FR-003**: Lange Freitextfelder MÜSSEN über die volle Breite des Bereichs laufen.
- **FR-004**: Ja/Nein Felder MÜSSEN gesammelt und kompakt in mehreren Spalten stehen.
- **FR-005**: Die Bereiche Kontakt und Anmeldung MÜSSEN die zusätzliche Breite ebenfalls nutzen.
- **FR-006**: Abstände zwischen Bereichen und Feldern SOLLEN etwas enger werden, ohne dass Felder
  gedrängt wirken oder Klickflächen kleiner werden.
- **FR-007**: Kopf und Fußzeile des Dialogs (Titel, Speichern, Abbrechen, Löschen) MÜSSEN beim
  Scrollen weiterhin sichtbar bleiben.
- **FR-008**: Daten, Validierung, Pflichtfelder, Speichern, Löschen, Wiederherstellen und der
  Zahlungslinkbereich MÜSSEN sich genau wie bisher verhalten.
- **FR-009**: Auf Bildschirmen unter 640 Pixel Breite MUSS der Dialog einspaltig ohne seitliches
  Scrollen bleiben.
- **FR-010**: Die Änderung MUSS sowohl im hellen als auch im dunklen Admin Theme korrekt aussehen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei einem Camp mit 12 gemischten Campfeldern ist eine geöffnete Anmeldung auf einem
  1440 × 900 Bildschirm mit höchstens einmal Scrollen vollständig zu sehen (heute deutlich mehr).
- **SC-002**: Die Höhe des Dialoginhalts sinkt in diesem Fall um mindestens 40 Prozent.
- **SC-003**: Bei 375 Pixel Breite gibt es kein seitliches Scrollen, und alle Felder sind bedienbar.
- **SC-004**: Alle bestehenden Abläufe (Anlegen, Bearbeiten, Speichern mit Fehlern, Löschen,
  Zahlungslink) funktionieren unverändert.

## Assumptions

- Betroffen ist nur der Dialog zum Anlegen und Bearbeiten einer Anmeldung in der Anmeldeliste. Andere
  Dialoge und der Finanztab bleiben wie sie sind.
- Es gibt keine neue Leseansicht; der bestehende Bearbeitungsdialog wird kompakter.
- Ja/Nein Felder werden am Ende des Campfelderbereichs gesammelt; ihre Reihenfolge untereinander bleibt
  erhalten. Das ist eine bewusste Abweichung von der reinen Feldreihenfolge zugunsten der Kompaktheit.
- Keine Änderung an Daten, Datenbank, Rechten oder Texten.
