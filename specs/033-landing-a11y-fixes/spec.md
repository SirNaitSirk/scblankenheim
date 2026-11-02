# Feature Specification: Landingpage Zugänglichkeit und Abschluss

**Feature Branch**: `033-landing-a11y-fixes`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Kleines Paket aus dem Review `.impeccable/critique/2026-11-02T13-16-52Z__app-page-tsx.md` ohne inhaltliche Entscheidungen: Erfolgs und Weiterleitungsansicht ansagen und fokussieren, Ersatzlink falls die Weiterleitung zur Bezahlseite hängt, Hamburger 44 px, kleine Labels mit ausreichendem Kontrast, Introsatz ohne Countdown."

**Kontext**: Nach specs/031 und 032 bleibt ein P1 aus dem Review, der keine Inhalte von außen braucht
(P1 #3), plus zwei kleine Zugänglichkeitsfehler (P2 #5) und ein veralteter Satz. Angaben für Eltern
folgen in einer eigenen Spec, sobald echte Daten vorliegen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Der Abschluss ist für alle wahrnehmbar (Priority: P1)

Eine Person mit Screenreader oder Tastatur schickt die Anmeldung ab. Statt im Leeren zu landen,
hört sie sofort „Anmeldung eingegangen!“ bzw. „Weiter zur Bezahlung …“, und der Fokus steht auf
dieser Überschrift. Hängt die Weiterleitung zur Bezahlseite, erscheint nach kurzer Zeit ein Link, mit
dem sie selbst weitergehen kann.

**Why this priority**: Das ist der wichtigste Moment der Seite. Heute fällt der Fokus nach dem
Absenden auf den Seitenanfang und nichts wird angesagt.

**Independent Test**: Kostenlose Anmeldung absenden: Fokus auf „Anmeldung eingegangen!“, VoiceOver
sagt sie an. Bezahlte Anmeldung absenden und die Weiterleitung blockieren: nach wenigen Sekunden
erscheint „Zur Bezahlseite“.

**Acceptance Scenarios**:

1. **Given** eine erfolgreiche Anmeldung ohne Weiterleitung, **When** die Erfolgsansicht erscheint,
   **Then** steht der Tastaturfokus auf ihrer Überschrift, die Ansicht ist sichtbar und wird von
   Screenreadern als Status angesagt.
2. **Given** eine erfolgreiche Anmeldung mit Weiterleitung, **When** die Weiterleitungsansicht
   erscheint, **Then** gilt dasselbe für „Weiter zur Bezahlung …“.
3. **Given** die Weiterleitungsansicht, **When** nach 5 Sekunden die Seite noch offen ist, **Then**
   erscheint ein Link „Zur Bezahlseite“ zur selben Bezahladresse.

---

### User Story 2 · Kleine Dinge, die heute ausschließen (Priority: P2)

Das Menü auf dem Handy ist gut zu treffen, die kleinen Labels über Abschnitten und in der
Faktenkarte sind lesbar, und der Anmeldebereich spricht nicht mehr von einem Countdown.

**Independent Test**: Auf 375 px misst der Menüknopf 44 × 44 px; die Labels „Bald geht's los“,
„Wer dabei ist“, „Wann“, „Wo“, „Beitrag“ haben mindestens 12 px und mindestens 4,5:1 Kontrast; der
Introtext im Countdown Zustand enthält das Wort „Countdown“ nicht.

**Acceptance Scenarios**:

1. **Given** eine Breite unter 768 px, **When** die Navigation angezeigt wird, **Then** ist der
   Menüknopf mindestens 44 × 44 px groß.
2. **Given** jede Landingpage, **When** die Labels angezeigt werden, **Then** sind sie mindestens 12 px
   groß und erreichen 4,5:1 Kontrast zu ihrem Hintergrund.
3. **Given** der Countdown Zustand, **When** der Introtext gelesen wird, **Then** lautet er „Merk dir
   den Termin vor. Ab dann kannst du dich hier anmelden.“

### Edge Cases

- Weiterleitung klappt sofort: der Ersatzlink erscheint nie.
- Person drückt nach dem Absenden Zurück im Browser: unverändert wie heute.
- Reduzierte Bewegung: das Scrollen zur Erfolgsansicht springt ohne Animation.

## Requirements *(mandatory)*

- **FR-001**: Erfolgs und Weiterleitungsansicht MÜSSEN als Status angesagt werden und beim Erscheinen
  den Fokus auf ihre Überschrift setzen und sichtbar sein.
- **FR-002**: Die Weiterleitungsansicht MUSS nach 5 Sekunden einen Link zur Bezahladresse zeigen.
- **FR-003**: Der Menüknopf auf dem Handy MUSS mindestens 44 × 44 px groß sein.
- **FR-004**: Labels der Landingpage MÜSSEN mindestens 12 px groß sein und 4,5:1 Kontrast erreichen.
- **FR-005**: Der Introtext im Countdown Zustand DARF NICHT auf einen Countdown verweisen.
- **FR-006**: Neue Texte deutsch, im Textmodul, ohne Gedankenstriche und Bindestriche in Wörtern.

## Success Criteria *(mandatory)*

- **SC-001**: Nach dem Absenden landet der Fokus in 100 % der Fälle auf der Überschrift der
  Ergebnisansicht.
- **SC-002**: Hängt die Weiterleitung, kann die Person spätestens 5 Sekunden später selbst weiter.
- **SC-003**: Kein sichtbares Label der Landingpage unter 12 px oder unter 4,5:1 Kontrast.
- **SC-004**: Ein erneutes Review führt diese Punkte nicht mehr als P1 oder P2.

## Assumptions

- Die Bezahladresse kommt wie heute aus der Antwort der Anmeldung; sie wird nur zusätzlich für den
  Link gemerkt.
- Die Monoschrift der Labels bleibt (keine Typografieänderung in diesem Paket).
- Kein neues Datenmodell, keine Migration, keine neue Route.
