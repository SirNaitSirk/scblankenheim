# Feature Specification: Adminbereich zuverlässig und schnell

**Feature Branch**: `004-admin-fast-reliable`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Manchmal werden im Adminbereich keine Daten angezeigt, obwohl Anmeldungen vorhanden sind. Das ist schon bei allen möglichen Tabs passiert, auch bei Finanzen. Zudem möchte ich, dass der Adminbereich noch schneller wird, also quasi ohne Ladezeit."

**Kontext**: Die Datenbank liefert die Anmeldungen nachweislich vollständig und schnell (15 parallele
Abfragen, jedes Mal alle 20 Anmeldungen, unter 0,5 Sekunden). Das Problem liegt also in der Kette
zwischen Datenbank und Anzeige. Jeder Tab stellt heute beim Öffnen eine größere Zahl einzelner
Abfragen, teils doppelt (das Dashboard fragt die Camp Liste mehrfach ab und das eigene Profil zweimal).
Jede einzelne Abfrage kann nach Leerlauf hängen bleiben oder scheitern, und ein einziger Ausfall lässt
den ganzen Tab leer oder mit der Fehlermeldung „Die Daten konnten nicht geladen werden“ enden. Beim
Tabwechsel wird außerdem jedes Mal alles neu geladen, auch wenn sich nichts geändert hat.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Daten sind immer da (Priority: P1)

Eine Admin öffnet einen beliebigen Tab (Dashboard, Finanzen, Camps, Felder, Benutzer, Logs, Profil),
auch nach längerer Pause oder direkt nach dem Start. Sie sieht immer die vorhandenen Daten. Eine
leere Ansicht erscheint nur, wenn es wirklich keine Daten gibt; die Fehlermeldung erscheint nur, wenn
die Datenbank tatsächlich nicht erreichbar ist.

**Why this priority**: Leere Tabs trotz vorhandener Anmeldungen zerstören das Vertrauen ins Werkzeug.
Admins könnten glauben, Anmeldungen oder Zahlungen seien verloren.

**Independent Test**: Den Adminbereich 15 Minuten unbenutzt lassen, dann nacheinander alle Tabs
öffnen. Jeder Tab zeigt dieselben Zahlen wie die Datenbank. Den Vorgang dreimal wiederholen.

**Acceptance Scenarios**:

1. **Given** es gibt Anmeldungen im aktuellen Camp, **When** die Admin nach längerem Leerlauf das
   Dashboard öffnet, **Then** sieht sie Kennzahlen und Tabelle mit allen Anmeldungen.
2. **Given** eine einzelne Abfrage scheitert kurzzeitig oder hängt, **When** ein Tab lädt, **Then**
   wird sie innerhalb weniger Sekunden automatisch wiederholt und der Tab zeigt die Daten.
3. **Given** die Datenbank ist wirklich nicht erreichbar, **When** ein Tab lädt, **Then** erscheint
   nach spätestens rund 10 Sekunden die deutsche Fehlermeldung mit „Erneut versuchen“, nie eine
   scheinbar leere Ansicht.
4. **Given** es gibt Anmeldungen, **When** Finanzen geöffnet wird, **Then** stimmen Erwartet,
   Eingegangen und Offen mit den Anmeldungen überein (nie 0 bei vorhandenen Anmeldungen).

---

### User Story 2 · Tabwechsel ohne spürbare Ladezeit (Priority: P2)

Eine Admin klickt in der Seitenleiste zwischen den Tabs hin und her. Der neue Tab erscheint praktisch
sofort mit Inhalt, statt erst ein Ladegerüst zu zeigen.

**Why this priority**: Der Adminbereich wird in der Anmeldephase täglich benutzt; Wartezeiten bei
jedem Klick summieren sich.

**Independent Test**: Nach dem ersten Laden zwischen Dashboard, Finanzen und Camps wechseln und die
Zeit bis zur vollständigen Anzeige messen.

**Acceptance Scenarios**:

1. **Given** der Adminbereich ist geöffnet, **When** die Admin einen Tab in der Seitenleiste anklickt,
   den sie seit dem Öffnen noch nicht besucht hat, **Then** erscheint er mit Daten in unter einer
   halben Sekunde, weil er im Hintergrund schon vorbereitet wurde.
2. **Given** ein Tab wurde kürzlich besucht, **When** die Admin zurückwechselt, **Then** erscheint er
   sofort ohne Ladegerüst.
3. **Given** ein Tab wird zum allerersten Mal ohne Vorbereitung geöffnet, **When** er lädt, **Then**
   erscheint der Inhalt schneller als heute, weil weniger und keine doppelten Abfragen nötig sind.

---

### User Story 3 · Eigene Änderungen sofort sichtbar (Priority: P1)

Eine Admin bearbeitet, löscht oder legt eine Anmeldung an, ändert einen Zahlungsstatus, ein Camp,
ein Feld oder einen Benutzer. Danach zeigt jeder Tab, den sie öffnet, sofort den neuen Stand.

**Why this priority**: Schnelligkeit darf nie dazu führen, dass alte Daten angezeigt werden, nachdem
man selbst etwas geändert hat. Das wäre ein neuer, schlimmerer Fehler.

**Independent Test**: Auf dem Dashboard eine Anmeldung auf „bezahlt“ setzen, sofort zu Finanzen
wechseln: Eingegangen ist um den Betrag gestiegen.

**Acceptance Scenarios**:

1. **Given** die Admin ändert eine Anmeldung, **When** sie direkt danach Finanzen öffnet, **Then**
   sind die Beträge bereits aktualisiert.
2. **Given** eine Person meldet sich öffentlich an, während die Admin im Adminbereich ist, **When** die
   Admin den Tab wechselt, **Then** erscheint die neue Anmeldung spätestens nach 30 Sekunden oder
   sofort beim Neuladen der Seite.

---

### Edge Cases

- Erster Aufruf direkt nach dem Start oder nach langem Leerlauf: hängende Verbindungen dürfen den Tab
  nicht minutenlang im Ladegerüst halten.
- Eine von mehreren Abfragen eines Tabs scheitert: nur sie wird wiederholt, nicht der ganze Tab.
- Ein echter Datenfehler (zum Beispiel ungültige Abfrage) wird nicht endlos wiederholt, sondern sofort
  als Fehler gemeldet.
- Rechte einer Admin werden geändert, während sie eingeloggt ist: beim nächsten Neuladen gelten die
  neuen Rechte; vorbereitete Tabs dürfen keine Inhalte zeigen, die sie nicht sehen darf.
- Abmelden: vorbereitete Daten dürfen nach dem Abmelden nicht mehr sichtbar sein.
- Mobile Seitenleiste: dieselbe Schnelligkeit wie am Desktop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Jeder Admintab MUST die vorhandenen Daten anzeigen, solange die Datenbank erreichbar ist;
  eine leere Ansicht nur bei tatsächlich fehlenden Daten.
- **FR-002**: Eine einzelne hängende Abfrage MUST nach einer festen Höchstdauer abgebrochen und
  automatisch wiederholt werden, statt den Tab unbegrenzt zu blockieren.
- **FR-003**: Vorübergehende Verbindungsfehler MUST automatisch wiederholt werden; dauerhafte Fehler
  MUST nach spätestens rund 10 Sekunden die bestehende deutsche Fehlermeldung zeigen.
- **FR-004**: Abgefragte Admindaten MUST bei jedem Seitenaufbau frisch aus der Datenbank kommen; es
  darf kein serverseitiger Zwischenspeicher alte oder leere Ergebnisse wiederverwenden.
- **FR-005**: Innerhalb eines Seitenaufbaus MUST jede gleiche Information (aktuelles Camp, Camp Liste,
  eigenes Profil) nur einmal abgefragt werden.
- **FR-006**: Tabs in der Seitenleiste MUST im Hintergrund vorbereitet werden, sobald die Seitenleiste
  sichtbar ist, sodass der Wechsel praktisch sofort erfolgt.
- **FR-007**: Kürzlich besuchte oder vorbereitete Tabs MUST für höchstens 30 Sekunden wiederverwendet
  werden dürfen; danach werden sie neu geladen.
- **FR-008**: Jede eigene Änderung (Anmeldung, Zahlung, Camp, Feld, Benutzer, Dashboard Kennzahlen)
  MUST alle wiederverwendeten Tabs sofort verwerfen, damit danach nur aktuelle Daten erscheinen.
- **FR-009**: Rechte und sichtbare Bereiche MUST weiterhin bei jedem Seitenaufbau auf dem Server
  geprüft werden; Vorbereitung im Hintergrund darf diese Prüfung nicht umgehen.
- **FR-010**: Inhalte, Texte, Rechte und Funktionen des Adminbereichs bleiben unverändert.

### Key Entities

- Keine neuen Daten. Betroffen sind nur die bestehenden Lesewege für Camps, Anmeldungen,
  Preisstufen, Profile, Einladungen und Logs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 3 Durchgängen (jeweils nach 15 Minuten Leerlauf) zeigen alle sieben Tabs in 100 %
  der Aufrufe die vorhandenen Daten.
- **SC-002**: Ein Wechsel zu einem vorbereiteten oder kürzlich besuchten Tab zeigt den Inhalt in unter
  0,5 Sekunden.
- **SC-003**: Die Zahl der Datenbankabfragen beim Öffnen des Dashboards sinkt um mindestens ein Drittel.
- **SC-004**: Nach einer eigenen Änderung zeigt jeder danach geöffnete Tab in 100 % der Fälle den neuen
  Stand.
- **SC-005**: Ist die Datenbank nicht erreichbar, erscheint die Fehlermeldung nach höchstens 10 Sekunden.

## Assumptions

- Neue öffentliche Anmeldungen dürfen im geöffneten Adminbereich bis zu 30 Sekunden verzögert
  erscheinen; ein Neuladen der Seite zeigt sie sofort.
- Die Admin Datenmengen bleiben klein (dutzende bis wenige hundert Anmeldungen); eine Seitenweise
  Ladung ist nicht nötig.
- Gemessen wird im Produktionsbetrieb; im lokalen Entwicklungsmodus ist das Vorbereiten von Tabs
  eingeschränkt und der erste Aufruf langsamer.
- Kein neuer Dienst und keine neue Bibliothek; die bestehende Plattform reicht aus.
