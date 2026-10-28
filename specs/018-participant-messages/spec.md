# Feature Specification: Nachricht ans Team und Änderung anfragen

**Feature Branch**: `018-participant-messages`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Auf der Teilnehmerseite schreibt die Person eine Nachricht oder schlägt eine Korrektur ihrer Angaben vor. Beides landet im Verlauf der Anmeldung und geht per Mail ans Team. Einen Änderungsvorschlag übernimmt ein Admin mit einem Klick. Kein Chat, Antworten laufen normal per Mail."

**Kontext**: Seit Feature 017 sehen Angemeldete ihren Stand auf einer privaten Seite. Wollen sie
etwas fragen oder stimmt eine Angabe nicht, müssen sie eine Mail an die richtige Adresse finden und
ihre Referenz dazuschreiben. Das Team sucht dann die Anmeldung und trägt Korrekturen von Hand ein.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-28 getroffen)**:

- Kein Chat und keine Antworten in der App. Das Team antwortet per Mail.
- Nachricht und Änderungswunsch kommen in ein gemeinsames Feature, weil sie denselben Weg zum Team
  nutzen.
- Ein Admin übernimmt einen Änderungswunsch mit einem Klick. Die Person ändert nie selbst.

**Voraussetzung für die Planung**: AGENTS.md Abschnitt 4 wird vor der Umsetzung ergänzt
(Verfassung, Prinzip III).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Nachricht ans Team schreiben (Priority: P1)

Ein Vater öffnet die Teilnehmerseite seiner Tochter und fragt, ob sie einen Tag später anreisen
kann. Er schreibt die Frage in das Feld „Nachricht ans Team“ und sendet sie ab. Die Seite bestätigt
den Versand. Das Team bekommt eine Mail mit Name, Referenz und der Frage und antwortet direkt mit
„Antworten“ an den Vater.

**Why this priority**: Das ist der häufigste Anlass und spart das Suchen nach Adresse und Referenz.

**Independent Test**: Auf der Teilnehmerseite eine Nachricht senden. Beim Team kommt eine Mail an,
die Antwortadresse ist die Mail der Anmeldung. Im Anmeldedialog steht die Nachricht im Bereich
„Nachrichten“.

**Acceptance Scenarios**:

1. **Given** eine aktive oder stornierte Anmeldung, **When** die Person eine Nachricht mit Text
   sendet, **Then** ist die Nachricht gespeichert und die Seite zeigt „Nachricht gesendet“.
2. **Given** eine gespeicherte Nachricht und eine hinterlegte Teamadresse, **When** sie gesendet
   wird, **Then** bekommt das Team eine Mail mit Vor und Nachname, Referenz, Camp, Nachrichtentext
   und Hinweis auf den Admin Bereich. Antworten auf diese Mail gehen an die Mailadresse der
   Anmeldung.
3. **Given** ein leeres Feld oder mehr als 2000 Zeichen, **When** die Person sendet, **Then** wird
   nichts gespeichert und ein Hinweis erklärt den Grund.
4. **Given** keine Teamadresse oder das Tageskontingent für Mails ist erreicht, **When** eine
   Nachricht eingeht, **Then** wird sie trotzdem gespeichert und ist im Admin Bereich sichtbar.
5. **Given** die Person hat schon Nachrichten gesendet, **When** sie die Seite öffnet, **Then** sieht
   sie ihre eigenen Nachrichten mit Datum und Status „offen“ oder „erledigt“.

---

### User Story 2 · Änderung einer Angabe anfragen (Priority: P1)

Eine Mutter sieht, dass die Allergie ihres Sohnes falsch eingetragen ist. Sie wählt bei „Änderung
anfragen“ das Feld „Allergien“, trägt den richtigen Wert ein und sendet. Ein Admin sieht im
Anmeldedialog „Allergien: Nüsse → Nüsse und Erdbeeren“ und klickt „Übernehmen“. Danach zeigt die
Teilnehmerseite den neuen Wert.

**Why this priority**: Falsche Angaben sind der zweithäufigste Anlass. Mit einem Klick spart das Team
das Abtippen und Fehler beim Übertragen.

**Independent Test**: Auf der Teilnehmerseite eine Änderung für ein Feld anfragen, im Dialog
übernehmen, Teilnehmerseite neu laden: der neue Wert steht da.

**Acceptance Scenarios**:

1. **Given** die Teilnehmerseite, **When** die Person „Änderung anfragen“ öffnet, **Then** kann sie
   eines ihrer Felder wählen: Vorname, Nachname, Mail, Geschlecht und jede Frage des Formulars ihres
   Camps.
2. **Given** ein gewähltes Feld, **When** die Person den neuen Wert eingibt, **Then** passt das
   Eingabefeld zum Feldtyp (Auswahlliste bei Auswahlfeldern, Ja oder Nein bei Kontrollkästchen,
   Datum bei Datumsfeldern) und der Wert wird wie im Anmeldeformular geprüft.
3. **Given** ein gültiger Wunsch, **When** er gesendet wird, **Then** wird er mit altem und neuem
   Wert gespeichert, optional mit einer kurzen Begründung, und das Team bekommt eine Mail wie bei
   einer Nachricht.
4. **Given** ein offener Änderungswunsch, **When** ein Admin mit Berechtigung für Anmeldungen
   „Übernehmen“ klickt, **Then** wird der neue Wert in die Anmeldung geschrieben, der Wunsch ist
   erledigt und im Aktivitätslog steht, wer welches Feld geändert hat.
5. **Given** der Wert in der Anmeldung hat sich seit dem Wunsch geändert, **When** ein Admin
   übernehmen will, **Then** sieht er den aktuellen Wert und muss bestätigen, dass er ihn
   überschreibt.
6. **Given** ein offener Änderungswunsch, **When** ein Admin „Ablehnen“ wählt, **Then** bleibt die
   Anmeldung unverändert und der Wunsch ist erledigt.
7. **Given** das Feld existiert im Formular nicht mehr oder sein neuer Wert ist nach aktuellen Regeln
   ungültig, **When** ein Admin übernehmen will, **Then** wird das abgelehnt und erklärt.

---

### User Story 3 · Offene Anliegen im Admin Bereich erkennen und erledigen (Priority: P1)

Das Team sieht in der Anmeldungstabelle, bei welchen Anmeldungen ein offenes Anliegen liegt, und
erledigt Nachrichten nach der Antwort per Mail.

**Why this priority**: Ohne sichtbare Markierung gehen Anliegen unter, wenn die Teammail übersehen
wird.

**Independent Test**: Nach einer Nachricht zeigt die Zeile der Anmeldung eine Markierung. Im Dialog
„Als erledigt markieren“ klicken: die Markierung verschwindet.

**Acceptance Scenarios**:

1. **Given** offene Nachrichten oder Änderungswünsche, **When** ein Admin die Anmeldungstabelle
   öffnet, **Then** trägt die Zeile eine Markierung mit der Anzahl offener Anliegen.
2. **Given** der Anmeldedialog, **When** er geöffnet wird, **Then** zeigt der Bereich „Nachrichten“
   alle Anliegen dieser Anmeldung, neueste zuerst, mit Datum, Art, Text und Status.
3. **Given** eine offene Nachricht, **When** ein Admin „Als erledigt markieren“ klickt, **Then** ist
   sie erledigt, mit Admin und Zeitpunkt.
4. **Given** ein Admin ohne Berechtigung für Anmeldungen, **When** er Anliegen sehen oder erledigen
   will, **Then** wird das abgelehnt.

---

### Edge Cases

- Viele Nachrichten in kurzer Zeit: pro Anmeldung höchstens 5 Anliegen am Tag, pro Gerät höchstens
  10 in 10 Minuten. Darüber hinaus erscheint ein freundlicher Hinweis.
- Doppelter Klick auf Senden speichert nur ein Anliegen.
- Ein Änderungswunsch mit gleichem Wert wie gespeichert wird nicht angenommen („Der Wert ist schon so
  eingetragen.“).
- Gelöschte Anmeldung: die Teilnehmerseite zeigt den neutralen Hinweis aus 017, Senden ist nicht
  möglich. Anliegen werden mit der Anmeldung gelöscht.
- Erneuerter Link (017): alte Seiten können nicht mehr senden.
- Text mit HTML oder Links wird als reiner Text gespeichert und angezeigt, in der Teammail sicher
  maskiert.
- Ein Änderungswunsch für die Mailadresse wird wie jeder andere behandelt. Nach dem Übernehmen gehen
  neue Mails an die neue Adresse.
- Mehrere offene Wünsche für dasselbe Feld: jeder wird einzeln übernommen oder abgelehnt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Teilnehmerseite MUSS ein Formular „Nachricht ans Team“ mit einem Textfeld (1 bis
  2000 Zeichen) bieten.
- **FR-002**: Die Teilnehmerseite MUSS ein Formular „Änderung anfragen“ bieten: Feldwahl aus den
  eigenen Feldern, neuer Wert passend zum Feldtyp, optionale Begründung (bis 500 Zeichen).
- **FR-003**: Neue Werte MÜSSEN mit denselben Regeln geprüft werden wie im Anmeldeformular.
- **FR-004**: Jedes Anliegen MUSS mit Anmeldung, Art, Text, bei Änderungen mit Feld, Feldbezeichnung,
  altem und neuem Wert, Status und Zeitpunkt gespeichert werden.
- **FR-005**: Senden MUSS nur mit gültigem Link der Teilnehmerseite möglich sein und auf dem Server
  geprüft werden.
- **FR-006**: Das System MUSS pro Anmeldung höchstens 5 Anliegen pro Tag und pro Gerät höchstens 10
  Sendeversuche in 10 Minuten annehmen.
- **FR-007**: Zu jedem Anliegen MUSS eine Mail an die Teamadresse des Camps gehen, falls eine
  hinterlegt ist und das Tageskontingent es erlaubt. Antworten auf diese Mail gehen an die
  Mailadresse der Anmeldung. Die Mail zählt zum Tageskontingent.
- **FR-008**: Die Teilnehmerseite MUSS die eigenen Anliegen mit Datum, Art, Text und Status zeigen.
- **FR-009**: Die Anmeldungstabelle MUSS Anmeldungen mit offenen Anliegen markieren, mit Anzahl.
- **FR-010**: Der Anmeldedialog MUSS einen Bereich „Nachrichten“ mit allen Anliegen der Anmeldung
  zeigen.
- **FR-011**: Admins mit Berechtigung für Anmeldungen MÜSSEN Nachrichten als erledigt markieren und
  Änderungswünsche übernehmen oder ablehnen können.
- **FR-012**: Übernehmen MUSS den neuen Wert erneut prüfen, bei geändertem aktuellem Wert eine
  Bestätigung verlangen und im Aktivitätslog vermerkt werden.
- **FR-013**: Alle Texte MÜSSEN als reiner Text behandelt werden. Teammail und Anzeige maskieren
  sie.
- **FR-014**: Es DARF keine Antwortfunktion und keinen Chat in der App geben.
- **FR-015**: Alle Texte MÜSSEN auf Deutsch sein und auf dem Handy gut bedienbar.

### Key Entities

- **Anliegen**: Nachricht oder Änderungswunsch einer Anmeldung. Hat Art, Text, optional Feld mit
  altem und neuem Wert, Status (offen, erledigt), bei erledigten Anliegen Ergebnis (erledigt,
  übernommen, abgelehnt), Admin und Zeitpunkt.
- **Teamadresse**: die Antwortadresse aus den Mail Einstellungen des Camps (Feature 016), sonst die
  allgemeine Antwortadresse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Person sendet eine Nachricht von der Teilnehmerseite in unter einer Minute.
- **SC-002**: Ein Admin übernimmt einen Änderungswunsch in unter 15 Sekunden ohne Abtippen.
- **SC-003**: Kein Anliegen geht verloren: jedes gespeicherte Anliegen ist im Admin Bereich sichtbar,
  auch wenn die Teammail nicht verschickt werden konnte.
- **SC-004**: Rückfragen per Telefon zu Anreise und falschen Angaben gehen spürbar zurück
  (Einschätzung des Teams nach dem Camp).

## Assumptions

- Die Teamadresse ist die Antwortadresse aus den Mail Einstellungen des Camps, sonst
  `EMAIL_REPLY_TO`. Ohne beide wird keine Mail verschickt, das Anliegen bleibt im Admin Bereich.
- Die Person bekommt keine eigene Bestätigungsmail. Die Seite bestätigt den Versand, das schont das
  Tageskontingent.
- Preis, Preisstufe, Zahlungsstand und Status können nicht per Änderungswunsch angefragt werden, nur
  die Angaben aus dem Formular.
- Erledigte Anliegen bleiben gespeichert, solange die Anmeldung besteht.
- Keine Benachrichtigung im Admin Bereich in Echtzeit. Die Markierung erscheint beim nächsten Laden.
