# Feature Specification: Neue Landingpage

**Feature Branch**: `002-landing-page-redesign`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Landingpage überarbeiten: Die aktuelle öffentliche Landingpage (/) des FCG Blankenheim Summercamps gefällt nicht und soll neu konzipiert werden. Ziel: eine klare, ansprechende, eigenständige Landingpage mit Campinfos und klarem Einstieg in die Anmeldung."

**Kontext**: Die heutige Startseite besteht aus neun aufeinanderfolgenden Bereichen (Berg Hero, Fakten,
Programm, Packliste, Anreise und Gemeinschaft, Bezahlung und Fragen, Abschlussaufruf, Anmeldung,
Fußzeile). Sie nutzt Stockfotos von Bergen, die nichts mit Blankenheim zu tun haben, zeigt fest
eingetragene Platzhalterwerte („Sommer 2027“, „ab 150 €“) statt der Daten des aktuellen Camps und
wiederholt den Aufruf zur Anmeldung mehrfach, bevor das Formular erst ganz unten erscheint. Der
Projektinhaber empfindet die Seite insgesamt als nicht gelungen. Diese Spec beschreibt, was die neue
Seite leisten muss; das bestehende Anmeldeformular (Spec 001) bleibt fachlich unverändert und wird nur
neu eingebettet.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · In Sekunden verstehen, worum es geht, und zur Anmeldung kommen (Priority: P1)

Eine interessierte Person (Jugendliche oder Elternteil) kommt über einen geteilten Link auf die Seite.
Ohne zu scrollen sieht sie, was das Camp ist, wann und wo es stattfindet, was es kostet und ob die
Anmeldung gerade offen ist. Ein einziger, eindeutiger Aufruf führt sie direkt zum Formular.

**Why this priority**: Die Seite existiert, um Anmeldungen zu erzeugen. Wer nicht sofort Termin, Ort,
Preis und den Weg zur Anmeldung findet, springt ab oder fragt per Nachricht nach.

**Independent Test**: Seite auf einem Smartphone öffnen; ohne zu scrollen sind Campname, Zeitraum,
Ort, Preis ab Normalpreis und der Anmeldestatus lesbar, und ein Tippen auf den Hauptaufruf landet am
Formular.

**Acceptance Scenarios**:

1. **Given** für das aktuelle Camp sind Name, Zeitraum, Ort und Normalpreis gepflegt, **When** die
   Seite geladen wird, **Then** erscheinen genau diese Werte im ersten sichtbaren Bereich, nicht fest
   eingetragene Platzhalter.
2. **Given** die Anmeldung ist offen, **When** die Person den Hauptaufruf wählt, **Then** springt die
   Seite zum Formular und das erste Feld ist erreichbar.
3. **Given** die Anmeldung öffnet erst später, **When** die Seite geladen wird, **Then** zeigt der
   erste Bereich statt „Jetzt anmelden“ das Öffnungsdatum bzw. den Countdown.
4. **Given** die Anmeldung ist geschlossen, **When** die Seite geladen wird, **Then** sieht die Person
   das klar und findet eine Kontaktmöglichkeit, aber keinen Aufruf, der ins Leere führt.

---

### User Story 2 · Vertrauen fassen: Was erwartet mich bzw. mein Kind? (Priority: P2)

Vor allem Eltern wollen wissen, wer das Camp veranstaltet, wie ein Tag aussieht, wie Unterkunft und
Verpflegung geregelt sind und wie Anreise und Bezahlung funktionieren. Diese Informationen stehen
knapp und gut scannbar auf der Seite, ohne dass man lange Texte lesen muss.

**Why this priority**: Die Anmeldung von Minderjährigen hängt an der Zustimmung der Eltern. Fehlendes
Vertrauen ist der häufigste Grund, nicht anzumelden.

**Independent Test**: Eine Person, die das Camp nicht kennt, beantwortet nach höchstens zwei Minuten
auf der Seite: Wer veranstaltet? Was ist im Preis enthalten? Wie komme ich hin? Wie bezahle ich?

**Acceptance Scenarios**:

1. **Given** die Seite ist geladen, **When** die Person nach unten scrollt, **Then** findet sie einen
   Bereich zum Veranstalter (FCG Blankenheim) und zur Idee des Camps.
2. **Given** die Seite ist geladen, **When** die Person nach Programm, Anreise oder Bezahlung sucht,
   **Then** findet sie jeweils eine kurze Antwort, ohne die Seite zu verlassen.
3. **Given** die Person hat noch eine Frage, **When** sie das Ende der Seite erreicht, **Then** findet
   sie eine direkte Kontaktmöglichkeit.

---

### User Story 3 · Die Seite fühlt sich nach diesem Camp an, nicht nach einer Vorlage (Priority: P3)

Wer die Seite sieht, erkennt eine eigene, warme Handschrift, die zum christlichen Jugendcamp in
Blankenheim passt: echte Bilder vom Camp, eine klare Gestaltung, wenige, gezielte Bewegungseffekte.

**Why this priority**: Der Eindruck entscheidet mit, ob die Seite geteilt wird. Er baut aber auf
Story 1 und 2 auf und ist ohne sie wertlos.

**Independent Test**: Drei Personen aus der Zielgruppe sehen die alte und die neue Seite und wählen,
welche besser zum Camp passt.

**Acceptance Scenarios**:

1. **Given** die Seite ist geladen, **When** die Person die Bilder betrachtet, **Then** zeigen sie
   zunächst neutrale, zur Region passende Stimmungsbilder (Wald, Wiese, Lagerfeuer, Gruppe), die
   später ohne Umbau der Seite gegen echte Campfotos getauscht werden können.
2. **Given** das Gerät ist auf reduzierte Bewegung eingestellt, **When** die Seite geladen wird,
   **Then** laufen keine Parallax, Zoom oder Endlosanimationen.
3. **Given** die Gestaltungsrichtung, **When** die Seite umgesetzt wird, **Then** folgt sie
   einer warmen, naturnahen Richtung ohne Kitsch: erdige Töne, Lagerfeuerstimmung, ruhige
   Typografie. Welche konkrete Ausprägung, wird vor dem Plan anhand von Designentwürfen gewählt.

---

### Edge Cases

- Für das aktuelle Camp fehlen Zeitraum, Ort oder Preis: der betroffene Wert wird ausgelassen, statt
  einen Platzhalter oder „null“ anzuzeigen; die Seite bleibt vollständig nutzbar.
- Es ist gar kein aktuelles Camp gesetzt: die Seite zeigt einen neutralen Hinweis mit Kontakt statt
  eines Formulars.
- Die Person kommt über einen versteckten Einladungslink für einen Sonderpreis: das Verhalten aus
  Spec 001 bleibt erhalten, auf der Seite selbst wird kein Sonderpreis öffentlich genannt.
- Ein Bild lädt nicht: Text und Aufrufe bleiben lesbar, das Layout springt nicht.
- Sehr schmale Bildschirme (320 Pixel Breite) und Desktop: kein waagerechtes Scrollen, Aufrufe
  bleiben ohne Zoom bedienbar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Seite MUSS Campname, Zeitraum, Ort und Normalpreis aus den gepflegten Daten des
  aktuellen Camps anzeigen; fest eingetragene Werte für diese Angaben sind nicht zulässig.
- **FR-002**: Der erste sichtbare Bereich MUSS auf Smartphone und Desktop Zeitraum, Ort, Preis,
  Anmeldestatus und genau einen Hauptaufruf enthalten.
- **FR-003**: Der Hauptaufruf MUSS dem Anmeldestatus folgen: offen führt zum Formular, noch nicht
  offen zeigt Öffnungsdatum bzw. Countdown, geschlossen zeigt Kontakt.
- **FR-004**: Das bestehende Anmeldeformular aus Spec 001 MUSS unverändert in Inhalt und Verhalten
  eingebunden werden; es gibt weiterhin genau ein Formular.
- **FR-005**: Die Seite MUSS Bereiche zu Veranstalter und Idee, Programm bzw. Tagesablauf, Anreise
  sowie Bezahlung und häufigen Fragen enthalten, jeweils knapp und scannbar.
- **FR-006**: Die Seite MUSS einen Verweis auf die Packliste (`/packzettel`) enthalten, statt die
  Packliste vollständig zu wiederholen.
- **FR-007**: Wiederholte Aufrufe zur Anmeldung MÜSSEN auf den Hauptaufruf oben, einen Aufruf am
  Formular selbst und höchstens einen weiteren beschränkt sein; eine dauerhaft erreichbare Navigation
  darf zusätzlich zur Anmeldung führen.
- **FR-008**: Die Seite MUSS eine direkte Kontaktmöglichkeit (Mail) enthalten.
- **FR-009**: Sonderpreise DÜRFEN auf der Seite nirgends öffentlich erscheinen.
- **FR-010**: Alle sichtbaren Texte MÜSSEN deutsch sein und an einer zentralen Stelle gepflegt werden.
- **FR-011**: Bewegungseffekte MÜSSEN bei aktivierter Einstellung „Bewegung reduzieren“ entfallen.
- **FR-012**: Die Seite MUSS per Tastatur vollständig bedienbar sein, Bilder haben deutsche
  Alternativtexte, Texte erfüllen ausreichenden Kontrast (WCAG AA).
- **FR-013**: Es gibt genau eine Landingpage; eine zweite Variante oder ein A/B Test wird nicht gebaut.

### Key Entities

- **Aktuelles Camp**: das in den Einstellungen als aktuell markierte Camp mit Name, Zeitraum, Ort,
  Normalpreis, Kurzbeschreibung und Anmeldezeitraum. Liefert alle variablen Inhalte der Seite.
- **Anmeldestatus**: abgeleitet aus dem aktuellen Camp (offen, demnächst, geschlossen); steuert
  Hauptaufruf und Anmeldebereich.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Auf einem Smartphone sind Termin, Ort, Preis und Anmeldestatus ohne Scrollen sichtbar
  (prüfbar bei 375 × 667 Pixeln).
- **SC-002**: Vom Öffnen der Seite bis zum ersten ausgefüllten Formularfeld braucht eine neue Person
  höchstens zwei Interaktionen.
- **SC-003**: Testpersonen beantworten die vier Vertrauensfragen aus Story 2 in höchstens zwei Minuten
  ohne Hilfe.
- **SC-004**: Mindestens zwei von drei Testpersonen bevorzugen die neue Seite gegenüber der alten.
- **SC-005**: Nach einer Änderung an Termin, Ort oder Preis des aktuellen Camps im Adminbereich zeigt
  die Seite beim nächsten Laden den neuen Wert, ohne Codeänderung.
- **SC-006**: Die Seite ist auf einem durchschnittlichen Smartphone mit mobilem Netz in unter drei
  Sekunden lesbar und bedienbar.

## Assumptions

- Zielgruppe sind Jugendliche und ihre Eltern im Umfeld der FCG Blankenheim; die meisten Besuche
  kommen per Smartphone über geteilte Links.
- Die bereits pflegbaren Campangaben (Ort, Zeitraum, Normalpreis, Leitsatz, Beschreibung) reichen für
  die variablen Inhalte; Programm, Anreise und Fragen bleiben feste Texte im zentralen
  Textmodul, weil sie sich selten ändern.
- Anmeldeformular, Countdown Logik, Anmeldestatus und Einladungslinks aus Spec 001 werden
  wiederverwendet, nicht neu gebaut.
- Packliste, Bezahlseite und Adminbereich sind nicht Teil dieser Spec.
- Die Kontaktadresse ist eine allgemeine Mailadresse des Camps; sie wird zentral gepflegt.
