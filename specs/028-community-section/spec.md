# Feature Specification: Jugendgruppen hell, Lagerfeuer als einziger dunkler Moment

**Feature Branch**: `028-community-section`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Die Abschnitte „Jugenden aus der ganzen Region“ und „Sei dabei und erlebe den Sommer deines Lebens“ passen hintereinander nicht zusammen. Variante A aus der Kritik vom 2026-10-31: Jugendgruppen werden ein heller Abschnitt mit den Gruppennamen groß als Typografie und ein bis zwei Tagesfotos; das Lagerfeuer bleibt der eine dunkle Moment mit eigenem, weniger generischem Text. Reihenfolge der Abschnitte bleibt."

**Kontext**: Nach specs/027-camp-photos zeigen Jugendgruppen Band und Lagerfeuer Band zwei dunkle
Abendfotos in gleicher Machart direkt hintereinander. Zusammen wirken sie wie ein langer dunkler
Block, die Ausrichtung kippt von linksbündig zu zentriert, und die Gruppennamen, der stärkste Beleg
der Seite, gehen als kleine Chips unter. Der Satz „Sei dabei und erlebe den Sommer deines Lebens“
ist austauschbar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Wer dabei ist, auf einen Blick (Priority: P1)

Eine Jugendliche oder ein Elternteil scrollt nach dem Programm weiter und sieht in einem hellen
Abschnitt sofort, welche Jugendgruppen mitfahren: die Namen stehen groß und gut lesbar, daneben
Tagesfotos vom Camp (Gruppenumarmung am Volleyballnetz, zwei Leute am Strand von hinten).

**Why this priority**: Die Gruppennamen sind der glaubwürdigste Beleg, dass man Leute kennt oder
kennenlernt. Heute gehen sie unter.

**Independent Test**: Landingpage auf Handy und Desktop öffnen, zum Abschnitt scrollen: heller
Hintergrund, Namen als größtes Element, zwei Fotos, kein dunkles Band.

**Acceptance Scenarios**:

1. **Given** die Landingpage, **When** der Jugendgruppen Abschnitt sichtbar ist, **Then** hat er einen
   hellen Hintergrund, der sich vom Programmabschnitt davor erkennbar abhebt.
2. **Given** der Abschnitt, **When** er angezeigt wird, **Then** stehen alle sechs Gruppennamen groß in
   der Displayschrift, getrennt durch „·“, und sind das auffälligste Element nach der Überschrift.
3. **Given** der Abschnitt, **When** er angezeigt wird, **Then** zeigt er die Fotos `IMG_3265`
   (Gruppenumarmung am Netz) und `IMG_3450` (Strand von hinten).
4. **Given** eine Handybreite von 375 px, **When** der Abschnitt angezeigt wird, **Then** brechen die
   Namen sauber um, ohne Silbentrennung mitten im Ortsnamen, und die Fotos stehen unter dem Text.

---

### User Story 2 · Das Lagerfeuer als einziger dunkler Moment (Priority: P2)

Nach dem hellen Jugendgruppen Abschnitt folgt das dunkle Lagerfeuer Band mit einer eigenen, zum Camp
passenden Überschrift und dem Anmeldebutton. Es ist der einzige dunkle Fotomoment zwischen Hero und
Anmeldung.

**Why this priority**: Gibt dem Übergang zur Anmeldung wieder Gewicht; ohne Story 1 nicht sinnvoll.

**Independent Test**: Seite von Programm bis Anmeldung scrollen: hell, hell, dunkel (Lagerfeuer),
hell (Anmeldung).

**Acceptance Scenarios**:

1. **Given** die Landingpage, **When** das Lagerfeuer Band sichtbar ist, **Then** lautet die Überschrift
   „Ein Kreis ums Feuer. Und du gehörst dazu.“
2. **Given** das Band, **When** der Anmeldestatus wechselt, **Then** folgt der Hauptbutton weiterhin dem
   Anmeldestatus wie bisher (specs/024-landing-structure).

---

### Edge Cases

- Ein Foto lädt nicht: der Platz bleibt in der hellen Grundfarbe, Text und Namen bleiben vollständig.
- Ohne JavaScript: Namen, Text und Fotos sind sichtbar.
- Sehr schmale Geräte (320 px): kein seitliches Scrollen, kein Name wird abgeschnitten.
- Kommt später eine siebte Gruppe dazu, bricht die Reihe einfach um.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Jugendgruppen Abschnitt MUSS einen hellen Hintergrund haben, der sich tonal vom
  Programmabschnitt unterscheidet.
- **FR-002**: Überschrift „Jugenden aus der ganzen Region“ und der bisherige Text bleiben; darüber steht
  die kleine Zeile „Wer dabei ist“.
- **FR-003**: Die Gruppennamen MÜSSEN groß in der Displayschrift als fortlaufende Reihe mit „·“ als
  Trenner stehen; die bisherigen Chips entfallen.
- **FR-004**: Der Abschnitt MUSS die Fotos `IMG_3265` und `IMG_3450` zeigen; das Lobpreisfoto
  `IMG_3491` entfällt an dieser Stelle.
- **FR-005**: Auf keinem Foto DARF eine Person klar erkennbar sein (wie specs/027-camp-photos).
- **FR-006**: Das Lagerfeuer Band MUSS die Überschrift „Ein Kreis ums Feuer. Und du gehörst dazu.“
  tragen; Buttons, Foto und Verhalten bleiben.
- **FR-007**: Alle Texte beider Abschnitte MÜSSEN im zentralen Textmodul stehen.
- **FR-008**: Reihenfolge der Abschnitte, Hero, Anmeldung und „Gut zu wissen“ bleiben unverändert.

### Key Entities

- **Campfoto**: wie specs/027-camp-photos, zwei neue Einträge (Gruppenumarmung, Strand).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zwischen Hero und Anmeldung gibt es genau ein dunkles Fotoband (Lagerfeuer).
- **SC-002**: Die Gruppennamen sind auf Desktop mindestens so groß wie die Abschnittsüberschriften der
  Seite.
- **SC-003**: Auf 375 px und 1440 px Breite gibt es kein seitliches Scrollen und keinen abgeschnittenen
  Namen.
- **SC-004**: Die zwei neuen Fotos sind zusammen kleiner als 800 KB.

## Assumptions

- Die Fotos sind am 2026-10-31 in voller Größe geprüft: alle Personen von hinten.
- Das Strandfoto zeigt zwei Personen Hand in Hand von hinten; als Motiv für „Strand in Belgien“
  akzeptiert. Ersatz wäre `IMG_3330` Ausschnitt oder ein anderes Tagesfoto.
- Der zweite Button im Lagerfeuer Band („Bei Fragen schreib uns“) bleibt in diesem Feature.
- Das Lobpreisfoto `IMG_3491` bleibt als Datei erhalten, wird aber nicht mehr verwendet und darf
  entfernt werden.
