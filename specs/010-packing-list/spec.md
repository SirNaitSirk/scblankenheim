# Feature Specification: Packliste für das aktuelle Camp

**Feature Branch**: `010-packing-list`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Packzettel Seite (/packzettel): öffentliche Seite mit der Packliste für das aktuelle Camp"

**Kontext**: Die Startseite zeigt im Abschnitt „Alles, was du mitbringen musst“ elf Gegenstände als
Auswahl und verlinkt auf „Zur vollständigen Packliste“ unter `/packzettel`. Auch der Footer
verlinkt dorthin. Diese Seite gibt es noch nicht, der Link führt ins Leere. Die Gegenstände auf der
Startseite sind fest im Teaser hinterlegt und stammen aus der Packliste von v1.

Getroffene Entscheidungen:

1. Die Packliste wird an genau einer Stelle zentral gepflegt und gilt für jedes Camp gleich. Eine
   Änderung braucht eine neue Version der Website, aber keinen Adminbereich, keine Tabelle und
   keine Berechtigungen. Begründung: Die Liste ändert sich nur selten, und auch die Mailvorlagen
   werden aus genau diesem Grund im Code gepflegt. Falls Admins sie später selbst pflegen sollen,
   wird das eine eigene Spec.
2. Inhalt ist der Packzettel der bisherigen Website (summercamp.fcg-blankenheim.de/packzettel),
   übernommen mit allen Bereichen und Hinweisen (siehe Assumptions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Vollständige Packliste lesen (Priority: P1)

Eine angemeldete Person oder ihre Eltern öffnen die Packliste, zum Beispiel über den Link auf der
Startseite. Sie sehen alle Gegenstände übersichtlich nach Bereichen gruppiert (Waschzeug, Das
Wichtigste, Schlafsachen, Geschirr und Besteck, Klamotten, Sonstiges), dazu kurze Hinweise, wo
nötig (zum Beispiel „für alle, die im Zelt schlafen“). Oben stehen der Name des aktuellen Camps und sein Zeitraum, damit klar ist, für welches
Camp die Liste gilt.

**Why this priority**: Der Link auf der Startseite und im Footer führt heute ins Leere. Ohne diese
Seite fehlt eine Information, die jede teilnehmende Familie vor dem Camp braucht.

**Independent Test**: `/packzettel` ohne Anmeldung aufrufen. Die Seite zeigt alle Gegenstände
gruppiert, den Campnamen und den Zeitraum, und lässt sich auf dem Handy ohne seitliches Scrollen
lesen.

**Acceptance Scenarios**:

1. **Given** ein aktuelles Camp ist gesetzt, **When** jemand `/packzettel` öffnet, **Then** sieht
   er die vollständige Packliste nach Bereichen gruppiert sowie Campname und Zeitraum.
2. **Given** jemand ist auf der Startseite, **When** er auf „Zur vollständigen Packliste“ oder im
   Footer auf „Packliste“ klickt, **Then** landet er auf dieser Seite.
3. **Given** die Seite ist geöffnet, **When** jemand zurück zur Startseite oder zur Anmeldung
   möchte, **Then** findet er einen sichtbaren Weg dorthin.

---

### User Story 2 · Packliste ausdrucken (Priority: P2)

Eltern drucken die Liste aus, um beim Packen Punkt für Punkt abzuhaken. Der Ausdruck enthält nur
die Liste mit Campname und Zeitraum, ohne Navigation, Bilder oder Fußzeile, und passt bei üblicher
Länge auf eine Seite.

**Why this priority**: Packen passiert oft offline und mit Kindern gemeinsam. Ein sauberer Ausdruck
ist der häufigste Weg, die Liste wirklich zu nutzen.

**Independent Test**: Die Druckvorschau des Browsers öffnen. Sie zeigt nur die Liste mit
Kästchen zum Abhaken, in Schwarz auf Weiß, auf einer Seite.

**Acceptance Scenarios**:

1. **Given** die Seite ist geöffnet, **When** jemand auf „Drucken“ klickt oder über den Browser
   druckt, **Then** enthält der Ausdruck nur Überschrift, Campname, Zeitraum und die gruppierte
   Liste mit einem leeren Kästchen vor jedem Gegenstand.

---

### User Story 3 · Am Handy abhaken (Priority: P3)

Eine Person packt mit dem Handy in der Hand und tippt Gegenstände an, um sie als eingepackt zu
markieren. Schließt sie die Seite und öffnet sie später auf demselben Gerät wieder, sind die
Haken noch da. Ein Knopf setzt alle Haken zurück.

**Why this priority**: Angenehm, aber nicht nötig. Die Liste funktioniert auch ohne Abhaken.

**Independent Test**: Drei Gegenstände abhaken, Seite neu laden, die drei sind weiterhin
abgehakt. „Zurücksetzen“ entfernt alle Haken.

**Acceptance Scenarios**:

1. **Given** die Seite ist geöffnet, **When** jemand einen Gegenstand antippt, **Then** wird er
   sichtbar als eingepackt markiert, und ein Fortschritt („5 von 18 eingepackt“) aktualisiert sich.
2. **Given** Gegenstände sind abgehakt, **When** die Seite auf demselben Gerät erneut geöffnet
   wird, **Then** sind die Haken erhalten.
3. **Given** das Speichern im Browser ist nicht möglich (etwa privates Fenster), **When** jemand
   abhakt, **Then** funktioniert das Abhaken trotzdem für die aktuelle Sitzung, ohne Fehlermeldung.

---

### Edge Cases

- Es ist kein aktuelles Camp gesetzt: Die Seite zeigt trotzdem die Packliste, ohne Campname und
  Zeitraum, und bleibt nutzbar.
- Das aktuelle Camp hat keinen Zeitraum hinterlegt: Der Zeitraum entfällt, der Rest bleibt.
- Die Packliste ändert sich, nachdem jemand abgehakt hat: Haken zu nicht mehr vorhandenen
  Gegenständen verschwinden, neue Gegenstände erscheinen nicht abgehakt.
- Die Daten des Camps sind kurzzeitig nicht erreichbar: Die Packliste erscheint trotzdem, nur
  Campname und Zeitraum fehlen.
- Sehr lange Gegenstandsnamen oder Hinweise brechen sauber um und schieben das Layout nicht aus
  dem Bildschirm.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Seite `/packzettel` MUSS ohne Anmeldung öffentlich erreichbar sein.
- **FR-002**: Die Seite MUSS die Packliste vollständig anzeigen, gruppiert nach Bereichen, jeder
  Bereich mit Überschrift und Gegenständen; ein Gegenstand KANN einen kurzen Hinweis haben.
- **FR-003**: Die Seite MUSS Name und Zeitraum des aktuellen Camps zeigen, sofern vorhanden, und
  ohne diese Angaben fehlerfrei funktionieren.
- **FR-004**: Der Inhalt der Packliste MUSS an genau einer Stelle zentral gepflegt werden und für
  jedes Camp gleich gelten. Eine Änderung an dieser Stelle MUSS sich auf Seite und Teaser
  auswirken, ohne dass an anderer Stelle etwas angepasst werden muss.
- **FR-005**: Der Packteaser auf der Startseite und die Seite `/packzettel` MÜSSEN aus derselben
  Quelle gespeist werden, damit beide nie voneinander abweichen. Der Teaser zeigt weiterhin nur
  eine Auswahl.
- **FR-006**: Die Seite MUSS eine Druckansicht bieten, die nur Überschrift, Campname, Zeitraum und
  die Liste mit einem leeren Kästchen pro Gegenstand ausgibt.
- **FR-007**: Nutzer MÜSSEN Gegenstände am Bildschirm abhaken und alle Haken zurücksetzen können;
  die Haken bleiben nur auf dem eigenen Gerät erhalten und werden nirgends übertragen.
- **FR-008**: Die Seite MUSS einen sichtbaren Weg zur Startseite und zur Anmeldung bieten.
- **FR-009**: Alle sichtbaren Texte MÜSSEN Deutsch sein und gehören zu den zentral gepflegten
  Texten der Website.
- **FR-010**: Die Seite MUSS auf Handybreite ohne seitliches Scrollen lesbar sein und mit Tastatur
  und Screenreader bedienbar sein (Kästchen sind beschriftet, Fortschritt wird angesagt).
- **FR-011**: Die Seite MUSS einen deutschen Seitentitel und eine Beschreibung für Suchmaschinen
  und geteilte Links haben.
- **FR-012**: Die Seite DARF keine Preise, keine Anmeldedaten und keine personenbezogenen Daten
  anzeigen.

### Key Entities *(include if feature involves data)*

- **Packliste**: geordnete Bereiche, jeder mit Titel und geordneten Gegenständen.
- **Gegenstand**: Bezeichnung, optionaler kurzer Hinweis, Markierung, ob er im Teaser der
  Startseite erscheint.
- **Aktuelles Camp** (vorhanden): liefert Name und Zeitraum für die Überschrift.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Beide bestehenden Links zur Packliste (Startseite und Footer) führen zu einer
  funktionierenden Seite statt ins Leere.
- **SC-002**: Die Seite ist auf einem durchschnittlichen Handy in unter 2 Sekunden lesbar.
- **SC-003**: Der Ausdruck der Liste (heute 24 Einträge, bis zu 35) passt auf eine DIN A4
  Seite.
- **SC-004**: Jeder Gegenstand im Teaser der Startseite kommt auch auf der vollständigen Liste vor
  (0 Abweichungen).
- **SC-005**: Eine Person findet einen bestimmten Gegenstand auf der Liste in unter 10 Sekunden.

## Assumptions

- Inhalt ist der bisherige Packzettel, Schreibweisen ohne Striche angepasst:
  - **Waschzeug**: Handtuch, Zahnbürste, Zahnpasta, Kamm oder Bürste, Duschzeug
  - **Das Wichtigste**: Die Bibel, Notizblock und Stift
  - **Schlafsachen**: Schlafsack, Kissen, Laken (für alle, die im Haus schlafen), Isomatte (für
    alle, die im Zelt schlafen)
  - **Geschirr und Besteck**: Suppenteller und flacher Teller, Suppenlöffel, Teelöffel und Gabel,
    Tasse und Glas
  - **Klamotten**: Etwas Sportliches (empfohlen), warme Sachen, Schwimmsachen, regenfeste Schuhe,
    lockere Kleidung
  - **Sonstiges**: Sonnenmilch, Kopfbedeckung, Sonnenbrille, Gesellschaftsspiele, Taschengeld
- Der Einleitungssatz der alten Seite wird sinngemäß übernommen: „Schau vor der Abfahrt nochmal
  rein, damit du nichts vergisst.“
- Der Bereich hieß bisher „Besteck“, enthält aber auch Geschirr, deshalb heißt er „Geschirr und
  Besteck“.
- Der Teaser auf der Startseite zeigt weiterhin eine Auswahl von etwa elf Gegenständen, nun aus
  dieser Liste markiert.
- Ein Abschnitt „Bitte zu Hause lassen“ ist nicht Teil dieser Spec, solange das Camp keine
  entsprechenden Regeln vorgibt.
- Abhaken wird nur im Browser des Geräts gemerkt; es gibt kein Konto und keine Synchronisierung.
- Die Packliste wird nicht automatisch per Mail verschickt; ein Link in der Bestätigungsmail ist
  eine mögliche spätere Ergänzung.
- Die Seite übernimmt das Erscheinungsbild der Startseite (Farben, Schrift, Navigation, Footer).
