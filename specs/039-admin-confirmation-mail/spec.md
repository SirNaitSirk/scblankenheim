# Feature Specification: Anmeldebestätigung bei Anmeldungen aus dem Admin

**Feature Branch**: `039-admin-confirmation-mail`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "wird nach jetzigem stand, wenn ich manuell einen user anlege, auch eine anmeldebestätigung gesendet?" Antwort: nein. Auftrag: "Yes, add it".

**Kontext**: Meldet sich jemand über die Landingpage an, bekommt die Person sofort die
Anmeldebestätigung (Eckdaten, Betrag, Bezahlknopf, Link zur Teilnehmerseite, Kalenderdatei).
Legt eine Admin die Anmeldung im Admin von Hand an (etwa nach einem Telefonat oder auf Papier),
geht heute keine Mail raus. Die Person erfährt nichts von ihrer Anmeldung, bekommt keinen Link
zur Teilnehmerseite und keinen Bezahlknopf, bis die Admin von Hand den Zahlungslink schickt.

**Produktentscheidungen**:

- Im Dialog „Anmeldung hinzufügen“ gibt es einen Schalter „Anmeldebestätigung senden“. Er ist
  standardmäßig an.
- Ist er an und hat die Anmeldung eine Mailadresse, bekommt sie dieselbe Bestätigung wie bei der
  öffentlichen Anmeldung, mit denselben Inhalten und Einstellungen des Camps.
- Ist er aus, geht keine Mail raus (wie heute). Das ist für Nachträge gedacht, etwa wenn die Person
  schon Bescheid weiß.
- Die Bestätigung geht pro Anmeldung höchstens einmal raus. Das gilt schon heute und bleibt so.
- Beim Bearbeiten einer bestehenden Anmeldung gibt es den Schalter nicht.
- Kein Nachsenden der Bestätigung für ältere Anmeldungen. Dafür gibt es weiter den Zahlungslink.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Bestätigung beim Anlegen senden (Priority: P1)

Eine Admin legt eine Anmeldung mit Mailadresse an und lässt den Schalter an. Die Person bekommt
kurz danach die Anmeldebestätigung. Im Mailverlauf der Anmeldung steht die Bestätigung mit Auslöser
Admin. Der Hinweis nach dem Speichern sagt, dass die Bestätigung verschickt wird.

**Acceptance Scenarios**:

1. **Given** der Dialog „Anmeldung hinzufügen“ ist offen, **When** er erscheint, **Then** ist der
   Schalter „Anmeldebestätigung senden“ an.
2. **Given** Schalter an und Mailadresse vorhanden, **When** die Admin speichert, **Then** wird die
   Anmeldung angelegt und genau eine Bestätigung verschickt, im Mailverlauf mit Auslöser Admin.
3. **Given** die Anmeldung kostet nichts, **When** die Bestätigung kommt, **Then** enthält sie wie
   bei der öffentlichen Anmeldung keinen Bezahlknopf.
4. **Given** das Speichern klappt, aber der Versand scheitert, **Then** bleibt die Anmeldung
   bestehen, das Scheitern steht im Mailverlauf und im Log.

### User Story 2 · Ohne Bestätigung anlegen (Priority: P2)

Die Admin schaltet den Schalter aus und speichert. Es geht keine Mail raus.

**Acceptance Scenarios**:

1. **Given** Schalter aus, **When** die Admin speichert, **Then** wird keine Bestätigung verschickt
   und der Mailverlauf bleibt leer.
2. **Given** die Anmeldung hat keine Mailadresse, **When** die Admin mit Schalter an speichert,
   **Then** wird die Anmeldung angelegt, keine Mail verschickt und das im Log vermerkt.

### Edge Cases

- Bearbeiten einer Anmeldung zeigt den Schalter nicht und verschickt nie eine Bestätigung.
- Fehlt `APP_URL`, wird wie heute übersprungen und geloggt.
- Die Infomails und Zahlungserinnerungen bleiben unverändert.

## Requirements *(mandatory)*

- **FR-001**: Der Dialog zum Anlegen zeigt den Schalter „Anmeldebestätigung senden“, standardmäßig an.
- **FR-002**: Mit Schalter an verschickt der Server nach dem Anlegen die Bestätigung mit derselben
  Vorlage wie die öffentliche Anmeldung.
- **FR-003**: Die Bestätigung wird mit Auslöser „admin“ und der anlegenden Admin im Mailverlauf
  festgehalten.
- **FR-004**: Ein Fehler beim Versand macht das Anlegen nicht rückgängig und zeigt keinen Fehler im
  Dialog.
- **FR-005**: Der Hinweis nach dem Speichern unterscheidet „mit Bestätigung“ und „ohne Bestätigung“.
- **FR-006**: Bearbeiten verschickt nie eine Bestätigung.

## Success Criteria *(mandatory)*

- **SC-001**: Eine im Admin angelegte Anmeldung mit Mailadresse bekommt bei Standardeinstellung die
  Bestätigung, ohne zusätzlichen Klick.
- **SC-002**: Mit Schalter aus entsteht kein Eintrag im Mailverlauf.
