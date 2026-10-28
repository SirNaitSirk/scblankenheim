# Feature Specification: Kalendereintrag für das Camp

**Feature Branch**: `019-calendar-file`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Eine .ics Datei mit Zeitraum und Ort des Camps, verlinkt in der Bestätigungsmail und als Button auf der Teilnehmerseite."

**Kontext**: Familien tragen sich den Campzeitraum heute von Hand in den Kalender ein, oft erst spät
oder mit falschen Tagen. Ein Kalendereintrag mit einem Tipp macht das sicherer und erinnert alle
rechtzeitig.

**Voraussetzung für die Planung**: AGENTS.md Abschnitt 4 wird vor der Umsetzung ergänzt
(Verfassung, Prinzip III).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Camp mit einem Tipp in den Kalender (Priority: P1)

Eine Mutter bekommt die Bestätigungsmail, tippt auf „In den Kalender eintragen“ und hat das Camp als
ganztägigen Termin vom ersten bis zum letzten Tag mit Ort im Kalender ihres iPhones. Ihr Mann nutzt
Google Kalender und tippt auf „Google Kalender“.

**Why this priority**: Das ist der ganze Nutzen des Features.

**Independent Test**: Den Link aus der Bestätigungsmail auf iPhone, in Outlook und in Google Kalender
öffnen. Der Termin hat Name, Zeitraum, Ort und einen Link zur Website.

**Acceptance Scenarios**:

1. **Given** ein Camp mit Start und Ende, **When** die Person „In den Kalender eintragen“ öffnet,
   **Then** bekommt sie eine Kalenderdatei mit einem ganztägigen Termin vom ersten bis einschließlich
   letzten Camptag, Campname als Titel, Ort und Link zur Website.
2. **Given** ein Camp mit Start und Ende, **When** die Person „Google Kalender“ öffnet, **Then**
   öffnet sich Google Kalender mit demselben Termin vorausgefüllt.
3. **Given** ein Camp ohne Start oder Ende, **When** eine Mail oder die Teilnehmerseite erzeugt
   wird, **Then** gibt es keine Kalenderlinks.
4. **Given** der Campzeitraum wird später geändert, **When** die Person den Link erneut öffnet,
   **Then** enthält die Datei die neuen Daten mit derselben Termin Kennung, sodass Kalender den
   Termin aktualisieren statt doppelt anzulegen.

---

### User Story 2 · Kalenderlinks an den richtigen Stellen (Priority: P1)

Die Links stehen in der Bestätigungsmail (bezahlt und kostenlos), in der Infomail acht Wochen vorher
und auf der Teilnehmerseite im Bereich „Camp“.

**Why this priority**: Ohne Zustellweg nützt die Datei niemandem.

**Independent Test**: Mail Vorschau und Teilnehmerseite zeigen beide Links.

**Acceptance Scenarios**:

1. **Given** die Bestätigungsmail, **When** sie erzeugt wird, **Then** enthält sie beide
   Kalenderlinks unter den Campdaten.
2. **Given** die Infomail acht Wochen vorher, **When** sie erzeugt wird, **Then** enthält sie beide
   Kalenderlinks.
3. **Given** die Teilnehmerseite, **When** sie angezeigt wird, **Then** stehen beide Links im
   Bereich „Camp“.

---

### Edge Cases

- Sonderzeichen, Kommas und Zeilenumbrüche in Name oder Ort werden korrekt maskiert.
- Ein unbekanntes oder ungültiges Camp im Link liefert „nicht gefunden“ ohne weitere Daten.
- Eintägiges Camp (Start gleich Ende): ein ganztägiger Termin an diesem Tag.
- Ende vor Start (Fehleingabe): keine Kalenderlinks und „nicht gefunden“.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUSS pro Camp eine öffentlich abrufbare Kalenderdatei im Standardformat
  liefern, mit einem ganztägigen Termin vom Start bis einschließlich Ende, Titel gleich Campname,
  Ort, Beschreibung mit Link zur Website und einer stabilen Termin Kennung pro Camp.
- **FR-002**: Das System MUSS zusätzlich einen vorausgefüllten Google Kalender Link bilden.
- **FR-003**: Die Datei DARF nur Name, Zeitraum, Ort und den Link zur Website enthalten, keine
  personenbezogenen Daten und keine Preise.
- **FR-004**: Bestätigungsmail, Infomail acht Wochen vorher und Teilnehmerseite MÜSSEN beide Links
  zeigen, wenn Start und Ende gesetzt sind.
- **FR-005**: Ohne gültigen Zeitraum DÜRFEN keine Links erscheinen; die Datei antwortet mit „nicht
  gefunden“.
- **FR-006**: Alle sichtbaren Texte MÜSSEN Deutsch sein.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Der Termin lässt sich mit höchstens zwei Tipps aus der Mail in Apple Kalender, Outlook
  und Google Kalender übernehmen.
- **SC-002**: Der übernommene Termin zeigt in allen drei Kalendern dieselben Tage wie die
  Campdaten.
- **SC-003**: Keine Kalenderdatei enthält personenbezogene Daten.

## Assumptions

- Ein Termin pro Camp, keine einzelnen Programmpunkte.
- Keine Erinnerung im Termin selbst; die Infomails übernehmen das Erinnern.
- Kein abonnierbarer Kalender, nur eine Datei zum einmaligen Übernehmen.
- Die Datei ist öffentlich, weil sie nur Daten enthält, die auch auf der Website stehen.
