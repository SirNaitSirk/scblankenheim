# Feature Specification: Schnellere erste Antwort der Startseite

**Feature Branch**: `034-landing-response-time`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Schnellere erste Antwort der Startseite. Messung vom 2.11.2026: Die Startseite braucht 0,85 bis 1,7 s bis zum ersten Byte und wird bei jedem Besuch neu erzeugt, Impressum und Datenschutz antworten in 0,1 bis 0,2 s. Ziel: erstes Byte im warmen Zustand unter etwa 300 ms, ohne dass sich Inhalt oder Verhalten ändert."

**Kontext**: Messung auf summercamp.fcg-blankenheim.de am 2.11.2026. Startseite: erstes Byte nach
0,85 bis 1,7 s (fünf und mehr Aufrufe, jeder ohne Zwischenspeicher). Impressum und Datenschutz: 0,1
bis 0,2 s. Lighthouse sonst gut (mobil 95 bis 96, Desktop 97). Die Startseite ist die Seite, die fast
alle Besucher zuerst sehen; auf dem Handy über Mobilfunk wird jede Sekunde Wartezeit vor dem ersten
Inhalt spürbar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Die Startseite ist sofort da (Priority: P1)

Eine Mutter tippt auf dem Handy den Link aus dem Gemeindebrief an. Die Startseite beginnt ohne
spürbares Warten zu laden, so schnell wie Impressum oder Datenschutz heute. Sie sieht dasselbe wie
heute: Termin, Anmeldestatus, Anmeldebutton, alle Abschnitte.

**Why this priority**: Das ist der einzige Zweck dieser Spec. Die Startseite ist heute die langsamste
öffentliche Seite, obwohl sie für alle Besucher gleich aussieht.

**Independent Test**: Die Startseite zehnmal hintereinander aufrufen und die Zeit bis zum ersten
Byte messen; der Median liegt unter 300 ms. Inhalt mit dem Stand vor der Änderung vergleichen: keine
Abweichung.

**Acceptance Scenarios**:

1. **Given** die Startseite wurde in den letzten Minuten schon einmal aufgerufen, **When** ein
   Besucher sie öffnet, **Then** kommt das erste Byte im Median in unter 300 ms an.
2. **Given** ein beliebiger Anmeldestatus, **When** die Startseite angezeigt wird, **Then** zeigt sie
   denselben Status, dieselben Buttons, denselben Seitentitel mit Campjahr und dieselben Abschnitte
   wie vor der Änderung.
3. **Given** JavaScript ist abgeschaltet, **When** die Startseite geöffnet wird, **Then** sind alle
   Inhalte wie heute sichtbar.

---

### User Story 2 · Der Anmeldestatus bleibt aktuell (Priority: P1)

Ein Admin ändert den Anmeldeschluss oder die Kapazität, oder die letzte freie Anmeldung geht ein.
Besucher sehen den neuen Stand nach spätestens wenigen Minuten. Zum eingestellten Öffnungszeitpunkt
wechselt der Countdown pünktlich auf „Anmeldung offen“, zum Schlusszeitpunkt pünktlich auf
geschlossen.

**Why this priority**: Schneller darf nicht falsch heißen. Ein Anmeldebutton nach Anmeldeschluss oder
ein fehlender Button nach Öffnung kostet Vertrauen und Anmeldungen.

**Independent Test**: Öffnungszeitpunkt eines Testcamps auf zwei Minuten in der Zukunft setzen, ab
dann jede Minute die Startseite laden: spätestens im ersten Aufruf nach dem Zeitpunkt ist die
Anmeldung offen. Kapazität auf die Zahl der aktiven Anmeldungen setzen: spätestens nach 5 Minuten
steht „ausgebucht“.

**Acceptance Scenarios**:

1. **Given** der Öffnungszeitpunkt liegt in der Zukunft, **When** er erreicht ist, **Then** zeigt
   jeder danach ausgelieferte Aufruf die offene Anmeldung (keine Verzögerung).
2. **Given** der Schlusszeitpunkt ist erreicht, **When** die Startseite danach geladen wird, **Then**
   zeigt sie keinen Anmeldebutton mehr (keine Verzögerung).
3. **Given** ein Admin ändert Camp Einstellungen (Termin, Zeitpunkte, Kapazität, aktuelles Camp,
   Schulbefreiung), **When** danach die Startseite geladen wird, **Then** erscheint der neue Stand
   spätestens nach 5 Minuten, möglichst sofort.
4. **Given** die aktiven Anmeldungen erreichen die Kapazität, **When** danach die Startseite geladen
   wird, **Then** steht spätestens nach 5 Minuten „ausgebucht“.
5. **Given** die Startseite zeigt wegen der Verzögerung noch „offen“, obwohl das Camp gerade voll ist,
   **When** jemand absendet, **Then** greift die Prüfung beim Absenden wie heute und die Person
   bekommt die bekannte Rückmeldung.

---

### User Story 3 · Persönliche Einladungslinks bleiben persönlich (Priority: P1)

Eine Person öffnet ihren Einladungslink mit Sonderpreis. Sie sieht ihren Preis wie heute. Kein
anderer Besucher sieht diesen Preis je, auch nicht durch zwischengespeicherte Seiten.

**Why this priority**: Versteckte Preise sind eine feste Regel des Projekts. Ein Zwischenspeicher, der
eine Einladungsseite an andere ausliefert, wäre ein Datenleck.

**Independent Test**: Einladungslink öffnen, danach die Startseite ohne Link öffnen (auch in einem
anderen Browser): kein Sonderpreis. Ungültigen Code öffnen: Seite wie ohne Code.

**Acceptance Scenarios**:

1. **Given** ein gültiger Einladungslink, **When** er geöffnet wird, **Then** zeigt das
   Anmeldeformular den Preis dieser Einladung wie heute.
2. **Given** jemand hat zuvor einen Einladungslink geöffnet, **When** ein anderer Besucher die
   Startseite ohne Link öffnet, **Then** sieht er nur den öffentlichen Preis.
3. **Given** ein ungültiger oder leerer Code, **When** die Seite geöffnet wird, **Then** verhält sie
   sich wie ohne Code.

---

### Edge Cases

- Kein aktuelles Camp gesetzt: Startseite wie heute ohne Termin und mit dem bekannten Zustand.
- Datenbank kurz nicht erreichbar: die Seite verhält sich mindestens so tolerant wie heute (Abschnitte
  fallen auf ihre bekannten Ersatzzustände zurück), sie bricht nicht.
- Prelaunch Sperre aktiv: Besucher ohne Adminprofil sehen weiter die Seite „Demnächst“; Admins sehen
  die echte Startseite.
- Erster Aufruf nach längerer Ruhe oder nach einem neuen Deployment: darf langsamer sein, zählt nicht
  zum Ziel von 300 ms.
- Schulbefreiungsbereich und Footerlink: erscheinen nach denselben Regeln wie heute, mit derselben
  Verzögerung wie der Anmeldestatus.
- Weitere Parameter in der Adresse (etwa aus Newsletter oder Social Media): ändern den Inhalt nicht und
  dürfen die Geschwindigkeit nicht spürbar verschlechtern.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Startseite MUSS im warmen Zustand im Median in unter 300 ms das erste Byte
  ausliefern, gemessen auf der Produktivadresse.
- **FR-002**: Inhalt, Reihenfolge, Texte, Seitentitel und Teilvorschau der Startseite MÜSSEN
  unverändert bleiben.
- **FR-003**: Der Wechsel des Anmeldestatus zum eingestellten Öffnungs und Schlusszeitpunkt MUSS
  pünktlich greifen.
- **FR-004**: Änderungen an Camp Einstellungen und am Stand der aktiven Anmeldungen MÜSSEN spätestens
  nach 5 Minuten auf der Startseite sichtbar sein.
- **FR-005**: Inhalte, die nur für einen Einladungslink gelten, DÜRFEN NIE an Besucher ohne genau
  diesen Link ausgeliefert werden.
- **FR-006**: Die Prüfungen beim Absenden der Anmeldung (Zeitfenster, Kapazität, Einladung) MÜSSEN
  unverändert bleiben; sie sind die verbindliche Instanz.
- **FR-007**: Die Prelaunch Sperre, die Seiten ohne JavaScript und die Barrierefreiheit der Startseite
  MÜSSEN unverändert funktionieren.
- **FR-008**: Andere Seiten (Admin, Teilnehmerseite, Bezahlseite) DÜRFEN NICHT langsamer oder weniger
  aktuell werden.

### Key Entities

- **Öffentlicher Seitenstand**: alles, was für alle Besucher gleich ist: aktuelles Camp, Termin,
  Anmeldestatus, Anmeldebutton, Sichtbarkeit des Schulbefreiungsbereichs. Darf kurz
  zwischengespeichert werden.
- **Persönlicher Teil**: das Ergebnis eines Einladungslinks. Gilt nur für diesen Aufruf.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Median der Zeit bis zum ersten Byte der Startseite über 10 warme Aufrufe unter 300 ms
  (heute rund 1 s).
- **SC-002**: Lighthouse mobil bleibt bei mindestens 95, Desktop bei mindestens 97.
- **SC-003**: Bei einem Öffnungszeitpunkt zeigt kein nach dem Zeitpunkt ausgelieferter Aufruf noch
  den Countdown.
- **SC-004**: Eine Adminänderung an Camp Einstellungen ist in 100 % der Prüfungen nach höchstens
  5 Minuten sichtbar.
- **SC-005**: In keiner Prüfung sieht ein Besucher ohne Einladungslink einen Sonderpreis.

## Assumptions

- „Warm“ heißt: die Startseite wurde in den letzten Minuten schon aufgerufen und seit dem letzten
  Deployment schon einmal ausgeliefert.
- Bis zu 5 Minuten Verzögerung bei Adminänderungen und Anmeldezahlen sind akzeptabel (Vorgabe des
  Nutzers: „wenige Minuten“); Zeitpunkte müssen trotzdem pünktlich greifen.
- Die Prelaunch Sperre bleibt Teil dieser Seite; falls sie selbst einen spürbaren Teil der Wartezeit
  verursacht, darf der Plan das mit angehen, ohne ihr Verhalten zu ändern.
- Kein neues Datenmodell, keine Migration, keine sichtbare Änderung.
- Herovideo und Bildgrößen sind nicht Teil dieser Spec.
