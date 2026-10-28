# Feature Specification: Persönliche Teilnehmerseite

**Feature Branch**: `017-participant-page`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Persönliche Teilnehmerseite (Kundenansicht) für angemeldete Personen. Jede Anmeldung bekommt einen privaten, nicht erratbaren Link (zufälliger Token, kein Konto, kein Passwort), der in der Bestätigungsmail und in Zahlungsmails steht. Auf der Seite sieht die Person: ihre Anmeldedaten, den Anmeldestatus (aktiv oder storniert), den Zahlungsstand mit bezahltem und offenem Betrag sowie einen Button zum Bezahlen (bestehender Stripe Flow über /bezahlen), Camp Infos (Zeitraum, Ort), Packzettel und, sobald zugewiesen, Zimmer und Zeltkreis. Nur lesend, keine Bearbeitung durch die Person. Unbekannte oder ungültige Links zeigen einen neutralen Hinweis ohne Daten. Admins können den Link im Anmeldedialog kopieren. Ziel: weniger Rückfragen an das Team, Angemeldete sehen jederzeit ihren Stand."

**Kontext**: Nach der Anmeldung bekommen Angemeldete heute nur Mails: Bestätigung, Zahlungslink,
Erinnerungen und Infomails. Wer später wissen will, ob die Zahlung angekommen ist oder welche Daten
hinterlegt sind, muss beim Team nachfragen. Die Seite
`/bezahlen` findet eine Anmeldung zwar über ihre Referenz, zeigt aber nur den Betrag zum Bezahlen.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-28 getroffen)**:

- Es gibt eine persönliche Seite pro Anmeldung, erreichbar nur über einen privaten Link.
- Kein Konto, kein Passwort, kein Login für Angemeldete.
- Die Seite ist nur lesend. Änderungen laufen weiter über das Team.
- Zimmer und Zeltkreise werden auf der Seite nicht angezeigt. Die Einteilung bleibt intern.

**Voraussetzung für die Planung**: Die Teilnehmerseite steht noch nicht im Umfang von AGENTS.md
Abschnitt 4. Laut Verfassung (Prinzip III) wird AGENTS.md vor der Umsetzung um diesen Punkt ergänzt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Eigenen Stand jederzeit nachsehen (Priority: P1)

Eine Mutter hat ihren Sohn angemeldet. Zwei Wochen später fragt sie sich, ob die Überweisung
angekommen ist. Sie öffnet den Link aus der Bestätigungsmail und sieht auf einen Blick: Anmeldung
aktiv, 120 € bezahlt, 60 € offen. Darunter stehen die hinterlegten Anmeldedaten und die Eckdaten
des Camps.

**Why this priority**: Das ist der Kern des Features und der häufigste Grund für Rückfragen.

**Independent Test**: Eine Anmeldung anlegen, den Link aus der Bestätigungsmail öffnen. Die Seite
zeigt Status, Zahlungsstand, Anmeldedaten und Camp Infos. Im Admin Bereich den bezahlten Betrag
ändern und die Seite neu laden: der neue Stand ist sichtbar.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung mit Teilzahlung, **When** die Person ihren Link öffnet,
   **Then** sieht sie den Status „aktiv“, den Gesamtbetrag, den bezahlten und den offenen Betrag.
2. **Given** eine Anmeldung, **When** die Person ihren Link öffnet, **Then** sieht sie die Werte,
   die sie im Anmeldeformular angegeben hat, mit den Feldbezeichnungen aus dem Formular.
3. **Given** ein Camp mit Zeitraum und Ort, **When** die Person ihren Link öffnet, **Then** sieht
   sie Name, Zeitraum und Ort des Camps.
4. **Given** ein Admin ändert Zahlungsstand oder Daten, **When** die Person die Seite neu lädt,
   **Then** sieht sie den aktuellen Stand.
5. **Given** eine stornierte Anmeldung, **When** die Person ihren Link öffnet, **Then** sieht sie
   den Status „storniert“ und keinen Button zum Bezahlen.

---

### User Story 2 · Offenen Betrag direkt bezahlen (Priority: P1)

Der Vater sieht auf der Seite, dass noch 60 € offen sind, und tippt auf „Jetzt bezahlen“. Er landet
im bekannten Bezahlablauf, zahlt und sieht danach auf der Seite den Betrag als bezahlt.

**Why this priority**: Ohne Bezahlbutton müsste die Person den Zahlungslink in alten Mails suchen.
Das Bezahlen über die Seite schließt die Lücke zwischen „sehe offenen Betrag“ und „erledige es“.

**Independent Test**: Eine Anmeldung mit offenem Betrag öffnen, auf „Jetzt bezahlen“ tippen, im
Testmodus zahlen. Nach Abschluss zeigt die Seite den Betrag als bezahlt.

**Acceptance Scenarios**:

1. **Given** eine aktive Anmeldung mit offenem Betrag, **When** die Person auf „Jetzt bezahlen“
   tippt, **Then** startet der bestehende Bezahlablauf für genau diese Anmeldung und den offenen
   Betrag.
2. **Given** eine vollständig bezahlte Anmeldung, **When** die Person die Seite öffnet, **Then**
   gibt es keinen Bezahlbutton, stattdessen den Hinweis „Alles bezahlt“.
3. **Given** eine Zahlung ist abgeschlossen, **When** der Zahlungseingang bestätigt ist, **Then**
   zeigt die Seite den neuen Stand.
4. **Given** eine kostenlose Anmeldung (Betrag 0 €), **When** die Person die Seite öffnet, **Then**
   gibt es keinen Bezahlbutton und keinen offenen Betrag.

---

### User Story 3 · Link aus Mails und vom Team bekommen (Priority: P1)

Jede Mail an eine Anmeldung enthält den persönlichen Link. Ruft eine Familie an, weil sie die Mail
nicht mehr findet, öffnet ein Admin die Anmeldung, kopiert den Link und schickt ihn ihr.

**Why this priority**: Ohne Zustellweg nützt die Seite niemandem.

**Independent Test**: Bestätigungsmail, Zahlungslink, Erinnerung und eine Infomail in der Mail
Vorschau ansehen: jede enthält den persönlichen Link. Im Anmeldedialog „Link kopieren“ nutzen und den
kopierten Link öffnen: es erscheint die Seite dieser Anmeldung.

**Acceptance Scenarios**:

1. **Given** eine neue Anmeldung, **When** die Bestätigungsmail verschickt wird, **Then** enthält
   sie den persönlichen Link.
2. **Given** Zahlungslink, Zahlungserinnerung oder Infomail, **When** sie verschickt wird,
   **Then** enthält sie den persönlichen Link der Empfängeranmeldung.
3. **Given** ein Admin mit Zugriff auf Anmeldungen, **When** er im Anmeldedialog „Link kopieren“
   wählt, **Then** liegt der persönliche Link in der Zwischenablage.
4. **Given** Anmeldungen, die vor diesem Feature entstanden sind, **When** das Feature live geht,
   **Then** haben auch sie einen persönlichen Link.

---

### User Story 4 · Packzettel griffbereit (Priority: P3)

Auf der Seite gibt es einen Verweis auf den Packzettel des Camps, damit niemand die Infomail suchen
muss.

**Why this priority**: Nützlich, aber der Packzettel ist schon öffentlich erreichbar.

**Independent Test**: Seite öffnen, auf „Packzettel ansehen“ tippen: der Packzettel des Camps
öffnet sich.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung, **When** die Person auf „Packzettel ansehen“ tippt, **Then** öffnet
   sich der Packzettel.

---

### User Story 5 · Unbekannte oder ungültige Links (Priority: P1)

Jemand tippt einen Link falsch ab oder probiert zufällige Adressen aus. Die Seite zeigt einen
neutralen Hinweis und keinerlei Daten.

**Why this priority**: Die Seite enthält persönliche Daten. Schutz ist Pflicht, nicht Kür.

**Independent Test**: Einen veränderten, einen erfundenen und einen erneuerten alten Link öffnen.
Alle drei zeigen denselben neutralen Hinweis.

**Acceptance Scenarios**:

1. **Given** ein Link, der zu keiner Anmeldung gehört, **When** er geöffnet wird, **Then** erscheint
   ein neutraler Hinweis mit dem Rat, sich beim Team zu melden, und keine Daten.
2. **Given** eine gelöschte Anmeldung, **When** ihr alter Link geöffnet wird, **Then** erscheint
   derselbe neutrale Hinweis.
3. **Given** viele falsche Aufrufe in kurzer Zeit von derselben Stelle, **When** weitere folgen,
   **Then** werden sie gebremst.
4. **Given** die Seite, **When** Suchmaschinen sie finden, **Then** wird sie nicht indexiert.

---

### User Story 6 · Link erneuern (Priority: P2)

Eine Familie hat den Link versehentlich in eine Gruppe weitergeleitet. Ein Admin erneuert den Link
im Anmeldedialog. Der alte Link zeigt ab sofort den neutralen Hinweis, der neue funktioniert.

**Why this priority**: Selten nötig, aber ohne diese Möglichkeit wäre ein geteilter Link nicht mehr
zurückzuholen.

**Independent Test**: Link kopieren, im Dialog erneuern, alten und neuen Link öffnen.

**Acceptance Scenarios**:

1. **Given** ein Admin mit Zugriff auf Anmeldungen, **When** er „Link erneuern“ bestätigt,
   **Then** ist der alte Link sofort ungültig und ein neuer Link verfügbar.
2. **Given** ein erneuerter Link, **When** später Mails rausgehen, **Then** enthalten sie den neuen
   Link.
3. **Given** ein Admin ohne Zugriff auf Anmeldungen, **When** er den Link erneuern oder kopieren
   will, **Then** wird das abgelehnt.

---

### Edge Cases

- Anmeldung ohne Camp Zeitraum oder Ort: die fehlenden Angaben werden weggelassen, die Seite bleibt
  vollständig nutzbar.
- Formularfelder, die nach der Anmeldung im Camp geändert oder entfernt wurden: die Seite zeigt die
  gespeicherten Werte mit der aktuellen Feldbezeichnung, Werte ohne passendes Feld werden nicht
  angezeigt.
- Leere optionale Felder werden nicht angezeigt.
- Überzahlung (bezahlt mehr als fällig): offen wird als 0 € angezeigt, kein Bezahlbutton.
- Stornierte Anmeldung mit Teilzahlung: Status „storniert“, bezahlter Betrag sichtbar, kein
  Bezahlbutton, Hinweis, sich wegen einer Erstattung beim Team zu melden.
- Camp ist vorbei: die Seite bleibt erreichbar und zeigt den letzten Stand (siehe Annahmen zur
  Gültigkeit).
- Der Bezahlablauf schlägt fehl oder wird abgebrochen: die Seite zeigt weiter den offenen Betrag.
- Ein besonderer Preis (versteckte Preisstufe) wurde genutzt: die Seite zeigt nur den eigenen
  Betrag, nie den Namen der Preisstufe oder andere Preise.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Jede Anmeldung MUSS genau einen persönlichen Link haben, der praktisch nicht erraten
  werden kann und unabhängig von der Anmeldereferenz ist.
- **FR-002**: Bestehende Anmeldungen MÜSSEN beim Livegang ebenfalls einen persönlichen Link
  bekommen.
- **FR-003**: Die Seite MUSS ohne Konto, Passwort oder Login erreichbar sein, nur über den Link.
- **FR-004**: Die Seite MUSS den Anmeldestatus (aktiv oder storniert) zeigen.
- **FR-005**: Die Seite MUSS Gesamtbetrag, bezahlten Betrag und offenen Betrag in Euro zeigen.
- **FR-006**: Bei aktiver Anmeldung mit offenem Betrag MUSS die Seite einen Button „Jetzt bezahlen“
  zeigen, der den bestehenden Bezahlablauf für diese Anmeldung startet. In allen anderen Fällen
  DARF kein Bezahlbutton erscheinen.
- **FR-007**: Die Seite MUSS die von der Person angegebenen Formularwerte mit ihren Feldbezeichnungen
  zeigen. Interne Angaben des Teams (Notizen, Mailverlauf, Pausen, Preisstufe) DÜRFEN NICHT erscheinen.
- **FR-008**: Die Seite MUSS Name, Zeitraum und Ort des Camps zeigen, soweit vorhanden.
- **FR-009**: Die Seite MUSS einen Verweis auf den Packzettel enthalten.
- **FR-010**: Die Seite DARF NICHT bearbeitbar sein. Sie enthält einen Hinweis, wie Änderungen beim
  Team angefragt werden.
- **FR-011**: Unbekannte, veränderte, erneuerte oder gelöschte Links MÜSSEN denselben neutralen
  Hinweis ohne Daten zeigen. Die Antwort DARF nicht verraten, ob es eine Anmeldung gibt.
- **FR-012**: Wiederholte falsche Aufrufe MÜSSEN gebremst werden.
- **FR-013**: Die Seite DARF NICHT von Suchmaschinen indexiert werden und DARF den Link nicht an
  fremde Seiten weitergeben.
- **FR-014**: Bestätigungsmail, Zahlungslink, Zahlungserinnerungen und Infomails MÜSSEN den
  persönlichen Link der Empfängeranmeldung enthalten. Die Mail Vorschau zeigt ihn mit Beispieldaten.
- **FR-015**: Admins mit Zugriff auf Anmeldungen MÜSSEN im Anmeldedialog den persönlichen Link
  kopieren können.
- **FR-016**: Admins mit Zugriff auf Anmeldungen MÜSSEN den Link nach Bestätigung erneuern können.
  Der alte Link wird dabei sofort ungültig.
- **FR-017**: Kopieren und Erneuern DÜRFEN nur nach Prüfung der Berechtigung auf dem Server
  möglich sein. Erneuern wird im Aktivitätslog vermerkt.
- **FR-018**: Die Seite MUSS auf dem Handy gut lesbar sein und alle Texte auf Deutsch zeigen.
- **FR-019**: Besondere Preise und Preisstufen DÜRFEN auf der Seite nicht genannt werden, nur der
  eigene Betrag.

### Key Entities

- **Anmeldung**: bestehende Anmeldung. Bekommt zusätzlich einen persönlichen Zugangsschlüssel, der
  erneuert werden kann.
- **Teilnehmerseite**: nur lesende Ansicht einer Anmeldung, zusammengesetzt aus Anmeldung, Camp
  und Zahlungsstand. Speichert selbst nichts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine angemeldete Person sieht ihren Zahlungsstand innerhalb von 10 Sekunden nach dem
  Öffnen der Mail, ohne etwas eintippen zu müssen.
- **SC-002**: 100 % der Mails an Anmeldungen enthalten einen funktionierenden persönlichen Link.
- **SC-003**: Kein einziger erfundener, veränderter oder erneuerter Link zeigt persönliche Daten.
- **SC-004**: Rückfragen zum Zahlungsstand und zu den hinterlegten Daten gehen im ersten Camp mit diesem
  Feature spürbar zurück (Einschätzung der Kassiererin und der Campleitung nach dem Camp).
- **SC-005**: Ein Admin findet und kopiert den Link einer Anmeldung in unter 30 Sekunden.
- **SC-006**: Die Seite ist auf einem Handy ohne Zoomen vollständig lesbar und bedienbar.

## Assumptions

- Der Link bleibt gültig, bis ein Admin ihn erneuert oder die Anmeldung gelöscht wird. Ein
  automatisches Ablaufen nach dem Camp gibt es in dieser Version nicht.
- Wer den Link hat, darf die Seite sehen. Das entspricht dem heutigen Umgang mit Mails an die
  Familie. Die Erneuerung ist der Weg, einen geteilten Link zurückzuholen.
- „Zugriff auf Anmeldungen“ meint die bestehende Berechtigung für den Anmeldetab.
- Der Bezahlablauf, die Zahlungsabstimmung und die Packzettelseite bestehen schon und werden nur
  verlinkt, nicht verändert.
- Die Seite zeigt den Stand beim Laden. Eine automatische Aktualisierung ohne Neuladen ist nicht nötig.
- Die Mailtexte bleiben im Code. Der Link wird als fester Bestandteil der bestehenden Vorlagen ergänzt.
- Selbst ändern, stornieren, Dokumente hochladen, Zimmer, Zeltkreise und ein Chat mit dem Team sind
  nicht Teil dieses Features.
