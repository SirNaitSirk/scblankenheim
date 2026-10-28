# Feature Specification: Mail Einstellungen pro Camp

**Feature Branch**: `016-mail-settings`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Mail Einstellungen im Admin Bereich. Admins sollen das Mailverhalten pro Camp einstellen können, ohne Code zu ändern. Umfang: (1) Zahlungserinnerungen pro Camp an oder aus. (2) Zahlungserinnerungen für einzelne Anmeldungen pausieren, umschaltbar im Anmeldedialog und im Finanztab. (3) Zeitpunkte pro Camp für die Infomails und den Takt der Zahlungserinnerungen, heutige Werte bleiben Vorgabe, Grenzen gegen Fehleingaben. (4) Absendername und Antwortadresse pro Camp, Absenderadresse bleibt fest. (5) Kurze Textbausteine pro Camp für Bestätigung, Zahlungslink und Erinnerungen, kein Vorlageneditor. (7) Testversand jeder Vorlage an die eigene Adresse, mit Tageskontingent und Sperrzeit. Nicht im Umfang: Benachrichtigungen an das Team, einstellbares Tageskontingent, editierbare Vorlagen."

**Kontext**: Seit den Features 007 und 012 verschickt CampConnect Bestätigungen, Zahlungslinks,
Zahlungserinnerungen und vier Infomails. Pro Camp lassen sich bisher nur die Infomails ein und
ausschalten und ihre Inhalte pflegen. Alles andere steht fest im Code: wann die Mails rausgehen,
wie oft erinnert wird, unter welchem Namen die Mails ankommen und wohin Antworten gehen. Für jede
Änderung muss heute jemand den Code anfassen. Außerdem gibt es keinen Weg, einzelne Personen von
Erinnerungen auszunehmen, etwa bei abgesprochener Ratenzahlung.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-28 getroffen)**:

- Umfang sind die Punkte Erinnerungen an oder aus, Pause pro Anmeldung, Zeitpunkte, Absender,
  Textbausteine und Testversand.
- Benachrichtigungen an das Team bei neuen Anmeldungen oder Zahlungen gehören nicht dazu.
- Der Testversand wird bewusst eingeführt und hebt die Festlegung „kein Testversand“ aus Feature
  007 auf.
- Die Mailtexte bleiben im Code. Admins pflegen nur einzelne kurze Felder, keinen ganzen Text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Erinnerungen für einzelne Anmeldungen pausieren (Priority: P1)

Eine Familie hat mit der Kassiererin Ratenzahlung vereinbart. Die Kassiererin öffnet die Anmeldung
im Finanztab oder im Anmeldedialog und schaltet „Zahlungserinnerungen pausieren“ ein. Ab dann bekommt
diese Anmeldung keine automatischen Zahlungserinnerungen mehr, bis die Pause wieder aufgehoben wird.

**Why this priority**: Das ist die häufigste Situation im Alltag. Ohne Pause bekommen Familien mit
einer Absprache trotzdem Erinnerungen, und das wirkt unfreundlich.

**Independent Test**: Eine offene Anmeldung, für die heute eine Erinnerung fällig wäre, pausieren
und den täglichen Lauf auslösen. Die Anmeldung bekommt keine Erinnerung. Pause aufheben, Lauf erneut
auslösen: die fällige Erinnerung geht raus.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung mit offenem Betrag und Berechtigung für Finanzen oder Anmeldungen,
   **When** ein Admin die Pause einschaltet, **Then** ist die Pause gespeichert und in Finanztabelle
   und Anmeldedialog sichtbar markiert.
2. **Given** eine pausierte Anmeldung, **When** der tägliche Lauf startet, **Then** bekommt sie keine
   Zahlungserinnerung.
3. **Given** eine Pause wird aufgehoben, **When** der nächste Lauf startet, **Then** gelten die
   normalen Regeln: die gerade offene Stufe wird geschickt, verpasste Stufen nicht nachgeholt.
4. **Given** eine pausierte Anmeldung, **When** ein Admin von Hand einen Zahlungslink schickt,
   **Then** geht der Zahlungslink trotzdem raus.
5. **Given** ein Admin ohne Berechtigung für Finanzen oder Anmeldungen, **When** er die Pause ändern
   will, **Then** wird das abgelehnt.

---

### User Story 2 · Zahlungserinnerungen pro Camp an oder aus (Priority: P1)

Die Campleitung möchte in einem Jahr gar keine automatischen Erinnerungen, weil das Team die
Zahlungen persönlich nachhält. In den Mail Einstellungen des Camps schaltet sie die
Zahlungserinnerungen aus.

**Why this priority**: Einfacher Schalter mit großer Wirkung, analog zu den Infomails.

**Independent Test**: Zahlungserinnerungen für das aktuelle Camp ausschalten, Lauf mit einer
fälligen Anmeldung auslösen: es geht nichts raus. Wieder einschalten: die Erinnerung geht raus.

**Acceptance Scenarios**:

1. **Given** die Zahlungserinnerungen des Camps sind aus, **When** der tägliche Lauf startet,
   **Then** bekommt keine Anmeldung dieses Camps eine Zahlungserinnerung.
2. **Given** bestehende Camps, **When** dieses Feature eingeführt wird, **Then** sind ihre
   Zahlungserinnerungen eingeschaltet, damit sich das heutige Verhalten nicht ändert.
3. **Given** ein neues Camp wird angelegt, **When** es gespeichert wird, **Then** sind die
   Zahlungserinnerungen eingeschaltet.
4. **Given** die Erinnerungen sind aus, **When** ein Admin den Tab „Mail“ öffnet, **Then** zeigt er
   bei den Erinnerungsvorlagen deutlich, dass sie für dieses Camp ausgeschaltet sind.

---

### User Story 3 · Zeitpunkte und Takt pro Camp festlegen (Priority: P2)

Das Camp findet dieses Jahr früher statt, und die Leitung will den Packzettel schon vier Wochen
vorher verschicken. In den Mail Einstellungen stellt sie die Tage für Vorfreude, Packzettel,
Anreise und Danke ein, dazu den Takt der Zahlungserinnerungen.

**Why this priority**: Wichtig für Flexibilität, aber die heutigen Werte passen in den meisten Jahren.

**Independent Test**: Packzettel auf 28 Tage vor Start stellen, Campstart auf in 28 Tagen setzen,
Lauf auslösen: die Packzettelmail geht raus. Die Vorschau im Tab „Mail“ nennt 28 Tage.

**Acceptance Scenarios**:

1. **Given** für ein Camp sind keine eigenen Zeitpunkte gesetzt, **When** Mails berechnet werden,
   **Then** gelten die heutigen Werte: Vorfreude 56, Packzettel 21, Anreise 5 Tage vor Start, Danke
   5 Tage nach Ende, erste Erinnerung 7 Tage nach Anmeldung, zweite 7 Tage vor Fälligkeit,
   Mindestabstand 3 Tage.
2. **Given** ein Admin mit Berechtigung für Camps speichert eigene Werte, **When** der nächste Lauf
   startet, **Then** gelten die neuen Werte für dieses Camp.
3. **Given** ein Wert liegt außerhalb der erlaubten Grenzen oder die Reihenfolge Vorfreude vor
   Packzettel vor Anreise stimmt nicht, **When** der Admin speichert, **Then** wird nichts
   gespeichert, und ein deutscher Hinweis nennt das Feld und die erlaubte Spanne.
4. **Given** geänderte Zeitpunkte, **When** der Admin den Tab „Mail“ öffnet, **Then** nennen die
   Versandzeitpunkte der Vorlagen die neuen Werte.
5. **Given** ein Admin setzt eigene Werte zurück, **When** er speichert, **Then** gelten wieder die
   Vorgaben.

---

### User Story 4 · Absendername und Antwortadresse (Priority: P2)

Mails sollen als „Summercamp Blankenheim 2027“ ankommen, und Antworten sollen direkt bei der
Campleitung landen. Ein Admin trägt Absendername und Antwortadresse beim Camp ein.

**Why this priority**: Wirkt professionell und entlastet das allgemeine Postfach, ist aber kein Muss.

**Independent Test**: Absendername und Antwortadresse eintragen, einen Testversand auslösen. Die
Mail zeigt den neuen Namen, die Absenderadresse ist unverändert, „Antworten“ geht an die
eingetragene Adresse.

**Acceptance Scenarios**:

1. **Given** Absendername und Antwortadresse sind beim Camp gesetzt, **When** eine Mail zu diesem
   Camp verschickt wird, **Then** trägt sie diesen Namen und diese Antwortadresse, die
   Absenderadresse bleibt die feste Adresse der Gemeinde.
2. **Given** eines der Felder ist leer, **When** eine Mail verschickt wird, **Then** gilt dafür die
   bisherige Vorgabe.
3. **Given** die Antwortadresse ist keine gültige Mailadresse oder der Name ist zu lang oder enthält
   unzulässige Zeichen, **When** der Admin speichert, **Then** wird nichts gespeichert und ein
   deutscher Hinweis erklärt den Fehler.

---

### User Story 5 · Kurze Textbausteine pro Camp (Priority: P2)

Die Leitung möchte in Bestätigung, Zahlungslink und Erinnerungen einen persönlichen Begrüßungssatz,
eine eigene Grußformel und eine Ansprechperson mit Telefonnummer. Sie trägt diese vier Felder beim
Camp ein. Der übrige Mailtext bleibt gleich.

**Why this priority**: Macht die Mails persönlicher, ändert aber nichts am Ablauf.

**Independent Test**: Die vier Felder füllen, im Tab „Mail“ die Bestätigung öffnen: Begrüßungssatz,
Grußformel und Ansprechperson stehen an der vorgesehenen Stelle. Felder leeren: die Mail sieht aus
wie heute.

**Acceptance Scenarios**:

1. **Given** Begrüßungssatz, Grußformel, Name und Telefonnummer der Ansprechperson sind gesetzt,
   **When** eine Bestätigung, ein Zahlungslink oder eine Erinnerung verschickt wird, **Then**
   erscheinen sie an festen Stellen in der Mail und in der Textfassung.
2. **Given** ein Feld ist leer, **When** die Mail erstellt wird, **Then** gilt der heutige Text an
   dieser Stelle, ohne leere Zeilen oder Platzhalter.
3. **Given** ein Admin trägt Zeichen ein, die als Formatierung oder Code wirken könnten, **When** die
   Mail erstellt wird, **Then** erscheinen sie als reiner Text.
4. **Given** ein Feld überschreitet die erlaubte Länge, **When** gespeichert wird, **Then** wird
   nichts gespeichert und ein Hinweis nennt die Grenze.

---

### User Story 6 · Testversand an die eigene Adresse (Priority: P3)

Bevor ein neues Camp startet, möchte ein Admin sehen, wie die Mails im eigenen Postfach ankommen.
Im Tab „Mail“ wählt er eine Vorlage und klickt „Test an mich senden“. Die Mail kommt mit
Beispieldaten und den Einstellungen des aktuellen Camps an seine eigene Adresse.

**Why this priority**: Gibt Sicherheit vor dem ersten echten Versand, aber die Vorschau deckt das
Wichtigste schon ab.

**Independent Test**: Als Admin mit Berechtigung für Camps eine Infomail auswählen und den Test
senden. Die Mail kommt an die eigene Adresse, der Betreff ist als Test erkennbar. Ein zweiter Klick
innerhalb einer Minute wird abgelehnt.

**Acceptance Scenarios**:

1. **Given** ein Admin mit Berechtigung für Camps, **When** er „Test an mich senden“ klickt,
   **Then** geht die gewählte Vorlage an die Mailadresse seines Adminkontos, der Betreff beginnt mit
   „Test:“ und eine Bestätigung erscheint.
2. **Given** die Testmail, **When** sie erstellt wird, **Then** enthält sie Beispieldaten statt einer
   echten Person, und Links zur Bezahlung lösen keine echte Zahlung aus.
3. **Given** der Admin hat in der letzten Minute schon einen Test geschickt, **When** er erneut
   klickt, **Then** wird das mit einem deutschen Hinweis abgelehnt.
4. **Given** das Tageskontingent ist bis auf die Reserve für Bestätigungen aufgebraucht, **When** ein
   Test angefordert wird, **Then** wird er abgelehnt, und der Hinweis nennt den Grund.
5. **Given** ein Testversand, **When** er stattfindet, **Then** zählt er zum Tageskontingent, steht
   im Protokoll und erscheint in keinem Mailverlauf einer Anmeldung.
6. **Given** ein Admin ohne Berechtigung für Camps, **When** er einen Test senden will, **Then** ist
   der Knopf nicht verfügbar und eine direkte Anfrage wird abgelehnt.

---

### Edge Cases

- **Pause bei bezahlter Anmeldung**: Die Pause bleibt gespeichert, wirkt aber erst, falls wieder ein
  Betrag offen ist.
- **Pause und Infomails**: Die Pause betrifft nur Zahlungserinnerungen. Die Anreisemail enthält bei
  offenem Betrag weiter den freundlichen Zahlungshinweis.
- **Zeitpunkte nachträglich geändert**: Schon verschickte Mails werden nicht wiederholt. Rückt eine
  Stufe dadurch in die Vergangenheit, gelten die Regeln für verpasste Stufen aus Feature 012.
- **Zeitpunkt so verschoben, dass die Stufe heute fällig wird**: Der nächste Lauf verschickt sie im
  Rahmen des Tageskontingents.
- **Altes Camp nach Wechsel des aktuellen Camps**: Dankmails des alten Camps nutzen dessen eigene
  Einstellungen.
- **Antwortadresse fällt weg**: Wird das Feld geleert, gilt sofort wieder die Vorgabe.
- **Mailadresse des Adminkontos fehlt**: Der Testversand ist nicht möglich, ein Hinweis erklärt das.
- **Versand eines Tests schlägt fehl**: Der Admin sieht eine deutsche Fehlermeldung, der Fehler steht
  im Protokoll.
- **Zwei Admins ändern gleichzeitig**: Es gilt die zuletzt gespeicherte Fassung.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Admins mit Berechtigung für Camps MUST die Zahlungserinnerungen pro Camp ein und
  ausschalten können. Bestehende und neue Camps starten eingeschaltet.
- **FR-002**: Das System MUST bei ausgeschalteten Zahlungserinnerungen keine automatische
  Erinnerung für Anmeldungen dieses Camps verschicken.
- **FR-003**: Admins mit Berechtigung für Finanzen oder Anmeldungen MUST die Zahlungserinnerungen
  einer einzelnen Anmeldung pausieren und fortsetzen können, im Anmeldedialog und im Finanztab.
- **FR-004**: Das System MUST pausierten Anmeldungen keine automatischen Zahlungserinnerungen
  schicken. Von Hand ausgelöste Zahlungslinks und Infomails sind davon nicht betroffen.
- **FR-005**: Pausierte Anmeldungen MUST in Finanztabelle und Anmeldedialog erkennbar markiert sein,
  und im Finanztab MUST nach ihnen gefiltert werden können.
- **FR-006**: Admins mit Berechtigung für Camps MUST pro Camp diese Zeitpunkte einstellen können,
  jeweils in ganzen Tagen und innerhalb dieser Grenzen: Vorfreude 14 bis 120 Tage vor Start,
  Packzettel 7 bis 60 Tage vor Start, Anreise 1 bis 21 Tage vor Start, Danke 1 bis 29 Tage nach
  Ende, erste Erinnerung 3 bis 60 Tage nach Anmeldung, zweite Erinnerung 1 bis 30 Tage vor
  Fälligkeit, Mindestabstand 1 bis 14 Tage.
- **FR-007**: Das System MUST verlangen, dass Vorfreude früher liegt als Packzettel und Packzettel
  früher als Anreise.
- **FR-008**: Ist ein Zeitpunkt nicht eingestellt, MUST der heutige Vorgabewert gelten. Admins MUST
  eigene Werte auf die Vorgabe zurücksetzen können.
- **FR-009**: Admins mit Berechtigung für Camps MUST pro Camp einen Absendernamen (höchstens 60
  Zeichen, nur Buchstaben, Ziffern, Leerzeichen und einfache Satzzeichen) und eine Antwortadresse
  (gültige Mailadresse) eintragen können. Die Absenderadresse ist nicht änderbar.
- **FR-010**: Jede Mail zu einem Camp MUST dessen Absendernamen und Antwortadresse nutzen, und ohne
  Eintrag die bisherige Vorgabe.
- **FR-011**: Admins mit Berechtigung für Camps MUST pro Camp vier Textbausteine pflegen können:
  Begrüßungssatz (höchstens 300 Zeichen), Grußformel (höchstens 200 Zeichen), Name der
  Ansprechperson (höchstens 80 Zeichen) und Telefonnummer der Ansprechperson (höchstens 40 Zeichen).
- **FR-012**: Bestätigung, Zahlungslink und Zahlungserinnerungen MUST die Textbausteine an festen
  Stellen zeigen, in Mail und Textfassung, und bei leeren Feldern den heutigen Text. Eingaben MUST
  immer als reiner Text erscheinen.
- **FR-013**: Das System MUST keinen Editor für ganze Mailtexte anbieten.
- **FR-014**: Der Tab „Mail“ MUST Vorschau und Versandzeitpunkte mit den Einstellungen des aktuellen
  Camps zeigen, einschließlich Absendername, Antwortadresse, Textbausteinen und dem Status der
  Zahlungserinnerungen.
- **FR-015**: Admins mit Berechtigung für Camps MUST jede Vorlage aus dem Tab „Mail“ als Test an die
  Mailadresse ihres eigenen Adminkontos schicken können. Eine andere Empfängeradresse ist nicht
  wählbar.
- **FR-016**: Testmails MUST mit „Test:“ im Betreff beginnen, Beispieldaten und die Einstellungen
  des aktuellen Camps nutzen und keine echte Zahlung auslösen können.
- **FR-017**: Das System MUST pro Admin höchstens einen Testversand pro Minute zulassen und Tests
  ablehnen, sobald das Tageskontingent ohne die Reserve für Bestätigungen aufgebraucht ist.
- **FR-018**: Testversände MUST zum Tageskontingent zählen, im Protokoll stehen und in keinem
  Mailverlauf einer Anmeldung erscheinen.
- **FR-019**: Alle Änderungen an Mail Einstellungen und Pausen MUST im Protokoll mit Admin und
  Zeitpunkt stehen.
- **FR-020**: Jede Änderung MUST serverseitig auf Berechtigung und gültige Werte geprüft werden.
  Alle Texte, Hinweise und Fehlermeldungen MUST auf Deutsch sein.

### Key Entities

- **Mail Einstellungen eines Camps**: pro Camp Schalter für Zahlungserinnerungen, die sieben
  Zeitpunkte (jeweils leer für Vorgabe), Absendername, Antwortadresse und die vier Textbausteine.
  Ergänzt die bestehenden Campinfos für Infomails.
- **Erinnerungspause**: pro Anmeldung ein Kennzeichen, ob automatische Zahlungserinnerungen
  pausiert sind, mit Zeitpunkt der letzten Änderung.
- **Testversand**: Eintrag im Protokoll mit Admin, Vorlage, Zeitpunkt und Ergebnis, ohne Bezug zu
  einer Anmeldung.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Admin kann alle Mail Einstellungen eines Camps in unter 5 Minuten eintragen,
  ohne dass jemand Code ändert.
- **SC-002**: Keine pausierte Anmeldung und keine Anmeldung eines Camps mit ausgeschalteten
  Erinnerungen bekommt eine automatische Zahlungserinnerung.
- **SC-003**: Nach Einführung verhalten sich alle bestehenden Camps ohne eigene Einstellungen exakt
  wie vorher: gleiche Zeitpunkte, gleicher Absender, gleiche Texte.
- **SC-004**: Ein Testversand kommt innerhalb einer Minute im Postfach des Admins an.
- **SC-005**: An keinem Tag übersteigt die Gesamtzahl verschickter Mails einschließlich Tests das
  Tageskontingent, und Bestätigungen werden durch Tests nie verdrängt.
- **SC-006**: Ungültige Eingaben werden in 100 Prozent der Fälle vor dem Speichern mit einem
  verständlichen deutschen Hinweis abgefangen.

## Assumptions

- Die Einstellungen liegen in den bestehenden Mail Einstellungen beim Camp, dort wo heute die
  Infomails gepflegt werden. Der Tab „Mail“ zeigt sie und bietet den Testversand.
- Wer Camps bearbeiten darf, darf auch die Mail Einstellungen ändern. Wer Finanzen oder Anmeldungen
  bearbeiten darf, darf Pausen setzen.
- Die Pause hat keinen Grund und kein Ablaufdatum. Wer eine Notiz braucht, nutzt die bestehenden
  Notizen der Anmeldung.
- Die Grenzen in FR-006 sind so gewählt, dass die heutigen Werte bequem darin liegen und die Dankmail
  innerhalb des bestehenden Fensters von 30 Tagen bleibt.
- Die Absenderadresse muss beim Mailanbieter verifiziert sein und bleibt deshalb fest.
- Die Infomails behalten ihre eigenen Inhalte aus Feature 012. Die neuen Textbausteine gelten nur
  für Bestätigung, Zahlungslink und Erinnerungen, Absendername und Antwortadresse gelten für alle
  Mails.
- Dieses Feature braucht eine Anpassung von AGENTS.md (Abschnitt 4, Mail Tab „kein Testversand“) und
  des Vermerks in Feature 007, bevor es umgesetzt wird.
- Benachrichtigungen an das Team, ein einstellbares Tageskontingent und editierbare Vorlagen sind
  nicht Teil dieses Features.
