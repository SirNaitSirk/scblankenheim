# Feature Specification: Mailübersicht pro Anmeldung

**Feature Branch**: `013-registration-mail-history`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Wird es später eine Möglichkeit geben zu sehen, wer welche Mails schon gesendet bekommen hat? Admins öffnen eine Anmeldung und sehen einen Abschnitt „Mails“ mit allen Mails an diese Person (Bestätigung, Zahlungslinks, Zahlungserinnerungen und die Infomails aus Feature 012) mit Name, Datum und Status."

**Kontext**: Seit Feature 007 wird jede Mail im Versandprotokoll festgehalten, mit Art, Zeitpunkt und
Status. Im Adminbereich ist davon nur ein Satz sichtbar: wie viele Zahlungserinnerungen eine Person
bekommen hat und wann die letzte war. Fragt eine Mutter „Habt ihr uns die Packliste geschickt?“, kann
das Team das heute nicht nachsehen. Mit Feature 012 kommen vier Infomails dazu, die Frage wird also
häufiger.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-28 getroffen)**:

- Eigenes Feature, getrennt von den Infomails (Feature 012).
- Die Übersicht steht im Dialog der jeweiligen Anmeldung.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Mails einer Person nachsehen (Priority: P1)

Eine Admin öffnet im Adminbereich eine Anmeldung. Im Dialog gibt es einen Abschnitt „Mails“. Dort
steht jede Mail, die an diese Person gegangen ist oder gehen sollte, die neueste zuerst: welche Mail,
wann, und ob sie verschickt wurde oder fehlgeschlagen ist. Bei Zahlungslinks, die ein Admin von Hand
geschickt hat, steht dabei, wer das war.

**Why this priority**: Das ist der ganze Zweck des Features. Damit kann das Team Rückfragen sofort
beantworten und sieht, wo eine Mail nicht angekommen ist.

**Independent Test**: Eine Anmeldung im Testbetrieb anlegen (Bestätigung geht raus), einen Zahlungslink
von Hand senden und den Dialog neu öffnen. Der Abschnitt „Mails“ zeigt zwei Einträge mit Datum und
Uhrzeit, der Zahlungslink mit dem Namen der Admin.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung hat Mails im Versandprotokoll, **When** eine Admin mit Berechtigung für
   Anmeldungen den Dialog öffnet, **Then** sieht sie den Abschnitt „Mails“ mit einem Eintrag pro
   Versandversuch, neueste zuerst, jeweils mit deutschem Namen der Mail, Datum und Uhrzeit nach
   deutscher Zeit und Status.
2. **Given** eine Mail wurde verschickt, **When** der Eintrag erscheint, **Then** lautet der Status
   „Verschickt“.
3. **Given** ein Versand ist fehlgeschlagen oder abgebrochen, **When** der Eintrag erscheint, **Then**
   lautet der Status „Fehlgeschlagen“ und ist farblich als Problem erkennbar, nicht nur über die Farbe.
4. **Given** ein Versand läuft gerade, **When** der Eintrag erscheint, **Then** lautet der Status
   „Wird gesendet“.
5. **Given** eine Mail wurde erst fehlgeschlagen und später verschickt, **When** der Abschnitt
   erscheint, **Then** stehen beide Versuche da, so dass der Verlauf erkennbar ist.
6. **Given** ein Admin hat einen Zahlungslink geschickt, **When** der Eintrag erscheint, **Then** steht
   dabei „von {Name}“; automatische Mails zeigen „automatisch“, Bestätigungen „bei Anmeldung“.
7. **Given** eine Anmeldung hat noch keine Mail bekommen, **When** der Dialog öffnet, **Then** steht im
   Abschnitt „Noch keine Mails verschickt“.

---

### User Story 2 · Nur für Berechtigte, ohne Inhalte (Priority: P1)

Die Übersicht zeigt nur, dass eine Mail rausging, nicht ihren Inhalt oder die Adresse, an die sie
ging. Sehen darf sie nur, wer Anmeldungen ansehen darf.

**Why this priority**: Die Anmeldungen betreffen oft Minderjährige; das Versandprotokoll speichert
bewusst keine Inhalte, und das bleibt so.

**Independent Test**: Als Admin ohne Berechtigung für Anmeldungen die Übersicht einer Anmeldung
abrufen: die Anfrage wird abgelehnt. Als berechtigte Admin: die Einträge enthalten weder Mailadresse
noch Mailtext.

**Acceptance Scenarios**:

1. **Given** jemand ohne Adminrechte oder ohne Berechtigung für Anmeldungen, **When** er die
   Übersicht einer Anmeldung abruft, **Then** wird das abgelehnt und nichts angezeigt.
2. **Given** eine berechtigte Admin, **When** die Übersicht erscheint, **Then** enthält sie keine
   Mailadresse, keinen Betreff und keinen Mailtext.
3. **Given** eine unbekannte Referenznummer, **When** die Übersicht abgerufen wird, **Then** erscheint
   eine deutsche Fehlermeldung, und der Rest des Dialogs funktioniert weiter.

---

### Edge Cases

- **Laden schlägt fehl**: der Abschnitt zeigt „Mails konnten nicht geladen werden“ mit „Erneut
  versuchen“; der Dialog bleibt bearbeitbar.
- **Neue Anmeldung anlegen**: im Modus „Anlegen“ gibt es den Abschnitt nicht.
- **Gelöschte oder stornierte Anmeldung**: die Übersicht bleibt sichtbar, damit das Team nachvollziehen
  kann, was vor der Stornierung rausging.
- **Unbekannte Mailart** (zum Beispiel aus einem späteren Feature): erscheint als „Mail“ statt eines
  leeren oder technischen Namens.
- **Admin gelöscht**: hat ein inzwischen gelöschter Admin einen Zahlungslink geschickt, steht „von
  einem Admin“.
- **Sehr viele Einträge**: die Liste zeigt höchstens 50 Einträge, neueste zuerst; mehr gibt es in der
  Praxis nicht (etwa 10 pro Person und Jahr).
- **Gerade eben verschickt**: wer im Dialog „Zahlungslink senden“ klickt, sieht den neuen Eintrag ohne
  den Dialog neu zu öffnen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Dialog einer bestehenden Anmeldung MUST einen Abschnitt „Mails“ mit allen
  Versandversuchen dieser Anmeldung zeigen, neueste zuerst, höchstens 50.
- **FR-002**: Jeder Eintrag MUST den deutschen Namen der Mail zeigen: Anmeldebestätigung, Zahlungslink,
  Erinnerung 1, Erinnerung 2, Erinnerung 3, Vorfreude, Packliste, Anreise, Danke; unbekannte Arten
  heißen „Mail“.
- **FR-003**: Jeder Eintrag MUST Datum und Uhrzeit nach deutscher Zeit zeigen, bei verschickten Mails den
  Zeitpunkt des erfolgreichen Versands, sonst den des Versuchs.
- **FR-004**: Jeder Eintrag MUST einen Status zeigen: „Verschickt“, „Fehlgeschlagen“ (auch für
  abgebrochene Versuche) oder „Wird gesendet“; Fehler sind zusätzlich zur Farbe durch Text oder Symbol
  erkennbar.
- **FR-005**: Jeder Eintrag MUST den Auslöser zeigen: „bei Anmeldung“, „automatisch“ oder „von {Name}“ bei
  Admins, „von einem Admin“, wenn der Name nicht mehr bekannt ist.
- **FR-006**: Ohne Einträge MUST der Abschnitt „Noch keine Mails verschickt“ zeigen.
- **FR-007**: Nur Admins mit Berechtigung für Anmeldungen MUST die Übersicht abrufen können; alle anderen
  werden abgelehnt.
- **FR-008**: Die Übersicht MUST NOT Mailadresse, Betreff oder Inhalt einer Mail zeigen oder übertragen.
- **FR-009**: Die Übersicht MUST erst geladen werden, wenn der Dialog geöffnet wird, damit die Liste der
  Anmeldungen nicht langsamer wird.
- **FR-010**: Nach „Zahlungslink senden“ im selben Dialog MUST die Übersicht den neuen Eintrag zeigen.
- **FR-011**: Ladefehler MUST als deutsche Meldung mit „Erneut versuchen“ erscheinen, ohne den Dialog zu
  blockieren.

### Key Entities

- **Mailversand** (besteht seit Feature 007): pro Versuch Anmeldung, Mailart, Status, Auslöser,
  auslösender Admin, Zeitpunkte. Keine Adresse, kein Inhalt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Admin beantwortet „Habt ihr uns die Mail geschickt?“ in unter 30 Sekunden, ohne
  jemand anderen zu fragen.
- **SC-002**: Der Abschnitt „Mails“ ist innerhalb von einer Sekunde nach dem Öffnen des Dialogs
  gefüllt.
- **SC-003**: Das Öffnen der Anmeldeliste wird durch das Feature nicht messbar langsamer.
- **SC-004**: In keinem Fall erscheinen Mailadresse oder Mailinhalt in der Übersicht.

## Assumptions

- Die Daten kommen aus dem bestehenden Versandprotokoll; es wird nichts Neues gespeichert.
- Infomails (Feature 012) erscheinen automatisch, sobald sie verschickt werden; dieses Feature hängt
  nicht davon ab, dass 012 schon umgesetzt ist.
- Der Finanztab behält seine Zählung der Erinnerungen und bekommt keine eigene Übersicht.
- Kein erneuter Versand aus der Übersicht heraus, keine Filter, kein Export. Für einen neuen
  Zahlungslink gibt es den bestehenden Knopf.
- Ob eine Mail beim Empfänger angekommen oder geöffnet wurde, zeigt die Übersicht nicht; sie zeigt nur,
  ob der Mailanbieter sie angenommen hat.
