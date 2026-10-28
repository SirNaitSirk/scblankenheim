# Feature Specification: Finanzen Tab für die Buchhaltung

**Feature Branch**: `009-finance-tab`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Wir haben eine Buchhalterin die sich um alles kümmern wird, was die Anmeldung bezüglich Finanzen angeht. Ich will hier auch wieder ein extra Tab wo eigentlich nur relevante Dinge für die Finanzen drin sind und man schnell Personen bearbeiten kann."

**Kontext**: Zahlungsdaten der Anmeldungen (fälliger Betrag, bezahlter Betrag, Zahlungsstatus,
Mahnungen, Zahlungslink) sind heute nur im großen Anmeldungen Dashboard erreichbar, zusammen mit
allen anderen Angaben der Personen. Der Tab „Preise“ verwaltet die Preisstufen und zeigt nur
Summen. Für die Buchhalterin gibt es keine Arbeitsfläche, die nur das Finanzielle zeigt.

Getroffene Entscheidungen:

1. Ein neuer, eigener Tab „Finanzen“. Der Tab „Preise“ bleibt unverändert für die Preisstufen.
2. Erfasst werden nur bezahlter Betrag und Zahlungsstatus. Kein Zahlungsdatum, keine Zahlungsart,
   keine Notiz pro Person.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Offene Zahlungen auf einen Blick (Priority: P1)

Die Buchhalterin öffnet den Tab „Finanzen“ und sieht für das aktuelle Camp sofort, wie viel Geld
erwartet wird, wie viel eingegangen ist und wie viel noch offen ist. Darunter steht eine Liste aller
aktiven Anmeldungen mit genau den finanziellen Angaben: Name, Referenz, Preisstufe, fälliger
Betrag, bezahlter Betrag, offener Betrag, Zahlungsstatus und Anzahl der gesendeten Mahnungen.
Persönliche Angaben wie Gesundheit, Allergien oder Notfallkontakte sieht sie dort nicht.

**Why this priority**: Ohne Überblick kann sie nicht abgleichen. Diese Ansicht allein ersetzt
bereits die Suche im großen Dashboard.

**Independent Test**: Mit einem Konto, das nur den Tab „Finanzen“ sehen darf, den Tab öffnen und
prüfen, dass Summen und Liste stimmen und keine sensiblen Felder sichtbar sind.

**Acceptance Scenarios**:

1. **Given** das aktuelle Camp hat 40 aktive Anmeldungen, **When** die Buchhalterin den Tab öffnet,
   **Then** sieht sie Gesamtsoll, bereits bezahlt, noch offen sowie die Anzahl unbezahlter,
   teilweise bezahlter und überfälliger Anmeldungen.
2. **Given** eine Anmeldung mit 250 € fällig und 100 € bezahlt, **When** sie die Liste ansieht,
   **Then** zeigt die Zeile 150 € offen und den Status „Teilweise“.
3. **Given** das Zahlungsziel des Camps ist überschritten, **When** sie die Liste ansieht,
   **Then** ist jede Anmeldung, die noch nicht vollständig bezahlt ist, als überfällig erkennbar.
4. **Given** Anmeldungen haben Antworten zu Gesundheit und Notfallkontakt, **When** sie die Liste
   ansieht, **Then** erscheinen diese Angaben weder in der Liste noch im Export.

---

### User Story 2 · Zahlung schnell nachtragen (Priority: P1)

Eine Überweisung ist eingegangen. Die Buchhalterin sucht die Person über Name oder Referenz, trägt
den bezahlten Betrag direkt in der Zeile ein oder setzt den Status, und die Änderung ist gespeichert,
ohne dass sie einen Dialog mit allen Anmeldedaten öffnen muss.

**Why this priority**: Das ist ihre häufigste Tätigkeit. Schnelles Nachtragen ist der eigentliche
Grund für den eigenen Tab.

**Independent Test**: Bei einer unbezahlten Anmeldung den bezahlten Betrag in der Zeile ändern,
Seite neu laden und prüfen, dass Betrag, offener Betrag, Status und Summen stimmen.

**Acceptance Scenarios**:

1. **Given** eine unbezahlte Anmeldung mit 250 € fällig, **When** sie 250 € als bezahlt einträgt,
   **Then** wird der Status auf „Bezahlt“ vorgeschlagen, der offene Betrag zeigt 0 € und die Summen
   oben passen sich an.
2. **Given** eine unbezahlte Anmeldung mit 250 € fällig, **When** sie 100 € einträgt,
   **Then** wird der Status auf „Teilweise“ vorgeschlagen.
3. **Given** sie ändert nur den Status, **When** sie speichert, **Then** bleibt der eingetragene
   Betrag unverändert.
4. **Given** sie gibt einen negativen oder keinen gültigen Betrag ein, **When** sie speichern will,
   **Then** erscheint eine verständliche Fehlermeldung auf Deutsch und nichts wird gespeichert.
5. **Given** das Speichern schlägt fehl, **When** die Meldung erscheint, **Then** zeigt die Zeile
   wieder den zuletzt gespeicherten Wert.
6. **Given** ein Konto darf den Tab sehen, hat aber keine Berechtigung „Finanzen“, **When** es die
   Liste öffnet, **Then** sind die Werte nur lesbar und nicht bearbeitbar.

---

### User Story 3 · Gezielt nacharbeiten (Priority: P2)

Die Buchhalterin filtert die Liste auf „offen“, „teilweise bezahlt“ oder „überfällig“ und sucht nach
Name oder Referenz. Für eine Person kopiert sie den Zahlungslink oder schickt ihn per Mail erneut.

**Why this priority**: Macht das Nachhaken effizient, ist aber erst sinnvoll, wenn Überblick und
Nachtragen funktionieren.

**Independent Test**: Filter „überfällig“ setzen und prüfen, dass nur nicht vollständig bezahlte
Anmeldungen nach dem Zahlungsziel bleiben; bei einer davon den Zahlungslink kopieren.

**Acceptance Scenarios**:

1. **Given** die Liste enthält bezahlte und offene Anmeldungen, **When** sie den Filter „offen“
   wählt, **Then** bleiben nur Anmeldungen mit offenem Betrag größer 0 €.
2. **Given** sie gibt einen Teil eines Nachnamens oder einer Referenz ein, **When** die Suche
   greift, **Then** bleiben nur passende Anmeldungen.
3. **Given** eine Anmeldung mit offenem Betrag, **When** sie „Zahlungslink kopieren“ wählt,
   **Then** liegt der Link in der Zwischenablage und eine Bestätigung erscheint.
4. **Given** eine Anmeldung mit offenem Betrag, **When** sie „Zahlungslink senden“ wählt und
   bestätigt, **Then** erhält die Person die bestehende Mail mit dem Zahlungslink.
5. **Given** eine vollständig bezahlte Anmeldung, **When** sie die Zeile ansieht, **Then** werden
   keine Zahlungslink Aktionen angeboten.

---

### User Story 4 · Export für die Buchhaltung (Priority: P3)

Die Buchhalterin lädt die aktuell gefilterte Liste als CSV herunter, um sie in ihrer
Buchhaltungssoftware oder Tabelle weiterzuverarbeiten.

**Why this priority**: Nützlich für Abschluss und Abgleich, aber nicht für die tägliche Arbeit nötig.

**Independent Test**: Filter setzen, exportieren und prüfen, dass die Datei genau die sichtbaren
Zeilen mit den Finanzspalten enthält.

**Acceptance Scenarios**:

1. **Given** der Filter „überfällig“ ist aktiv, **When** sie exportiert, **Then** enthält die
   Datei nur die gefilterten Zeilen.
2. **Given** sie öffnet die Datei in einer Tabellenkalkulation, **When** sie die Beträge ansieht,
   **Then** sind Umlaute korrekt und Beträge als Zahlen nutzbar.

### Edge Cases

- Kein aktuelles Camp gesetzt: der Tab zeigt einen leeren Zustand mit Hinweis, statt einen Fehler.
- Keine aktiven Anmeldungen: Summen zeigen 0 €, die Liste einen freundlichen leeren Zustand.
- Kein Zahlungsziel beim Camp hinterlegt: nichts gilt als überfällig, der Filter „überfällig“ ist
  leer und die Kopfzeile zeigt kein Zahlungsziel.
- Bezahlter Betrag höher als fällig (Überzahlung): wird gespeichert, der offene Betrag zeigt den
  negativen Wert als Guthaben deutlich markiert.
- Status „In Bearbeitung“ (Zahlung bei Stripe läuft noch) oder „Erstattet“: bleiben sichtbar und
  setzbar, zählen aber nicht als überfällig solange „In Bearbeitung“.
- Stornierte oder gelöschte Anmeldungen erscheinen nicht in Liste und Summen.
- Anmeldung ohne Preisstufe: Preisstufe zeigt „Keine“, Beträge bleiben bearbeitbar.
- Zwei Personen bearbeiten gleichzeitig dieselbe Zeile: die zuletzt gespeicherte Änderung gilt.
- Eine Stripe Zahlung trifft ein, während die Seite offen ist: nach dem nächsten Laden zeigt die
  Zeile den neuen Stand.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Adminbereich MUST einen eigenen Tab „Finanzen“ haben, getrennt vom Tab „Preise“.
  Der Tab „Preise“ bleibt in Funktion und Inhalt unverändert.
- **FR-002**: Der Tab MUST sich in der Benutzerverwaltung wie jeder andere Tab einzeln freigeben
  lassen. Konten ohne Freigabe sehen ihn nicht in der Navigation und können ihn nicht aufrufen.
- **FR-003**: Ändern von Zahlungsdaten im Tab MUST die Berechtigung „Finanzen“ voraussetzen, auch
  serverseitig. Ohne diese Berechtigung ist der Tab nur lesbar.
- **FR-004**: Der Tab MUST sich auf das aktuelle Camp beziehen und nur aktive Anmeldungen zeigen.
- **FR-005**: Die Kopfzeile MUST zeigen: Gesamtsoll, bereits bezahlt, noch offen, Quote bezahlt,
  Anzahl unbezahlt, Anzahl teilweise bezahlt, Anzahl überfällig sowie das Zahlungsziel des Camps.
- **FR-006**: Die Liste MUST pro Anmeldung zeigen: Name, Referenz, Preisstufe, fälliger Betrag,
  bezahlter Betrag, offener Betrag, Zahlungsstatus, Anzahl gesendeter Mahnungen und eine
  Markierung „überfällig“.
- **FR-007**: Liste und Export MUST NOT Gesundheitsangaben, Notfallkontakte, Adressen oder andere
  Antworten des Anmeldeformulars enthalten. Erlaubt sind nur die in FR-006 genannten Angaben sowie
  die Mailadresse für den Versand des Zahlungslinks.
- **FR-008**: Eine Anmeldung MUST als überfällig gelten, wenn ein Zahlungsziel gesetzt ist, dieses
  vor dem heutigen Tag liegt, der offene Betrag größer 0 € ist und der Status nicht „In
  Bearbeitung“ oder „Erstattet“ ist.
- **FR-009**: Bezahlter Betrag und Zahlungsstatus MUST direkt in der Zeile bearbeitbar sein, ohne
  den Dialog mit allen Anmeldedaten.
- **FR-010**: Beim Ändern des bezahlten Betrags MUST der Status passend vorgeschlagen werden
  (0 € unbezahlt, kleiner als fällig teilweise, ab fällig bezahlt). Die Buchhalterin kann den
  Vorschlag vor dem Speichern überschreiben.
- **FR-011**: Beträge MUST als ganze Euro größer oder gleich 0 geprüft werden; ungültige Eingaben
  werden mit deutscher Fehlermeldung abgelehnt.
- **FR-012**: Nach dem Speichern MUST die Zeile und die Kopfzeile den neuen Stand zeigen; bei einem
  Fehler MUST die Zeile auf den letzten gespeicherten Wert zurückfallen und eine Meldung zeigen.
- **FR-013**: Jede Änderung von Betrag oder Status MUST im Aktivitätslog mit Person, alter und
  neuer Wert sowie handelndem Konto erfasst werden.
- **FR-014**: Die Liste MUST filterbar sein nach „Alle“, „Offen“, „Teilweise bezahlt“ und
  „Überfällig“ und durchsuchbar nach Vorname, Nachname und Referenz.
- **FR-015**: Für Anmeldungen mit offenem Betrag MUST es die Aktionen „Zahlungslink kopieren“ und
  „Zahlungslink senden“ geben, mit denselben Regeln wie im Anmeldungen Dashboard. Senden verlangt
  eine Bestätigung. Beides setzt die Berechtigung „Finanzen“ voraus.
- **FR-016**: Die aktuell gefilterte Liste MUST als CSV exportierbar sein, mit den Spalten aus
  FR-006 und korrekt dargestellten Umlauten.
- **FR-017**: Alle sichtbaren Texte MUST deutsch sein; Beträge und Datumsangaben im deutschen Format.
- **FR-018**: Der Tab MUST auf Tablet und Handy bedienbar sein, inklusive Nachtragen eines Betrags.
- **FR-019**: Der Tab MUST Lade, Leer und Fehlerzustände haben, passend zum restlichen Adminbereich.

### Key Entities

- **Anmeldung (Finanzsicht)**: eine bestehende Anmeldung, reduziert auf Name, Referenz,
  Preisstufe, fälligen Betrag, bezahlten Betrag, Zahlungsstatus und Mahnungsanzahl. Der offene
  Betrag und „überfällig“ werden abgeleitet, nicht gespeichert.
- **Camp**: liefert das Zahlungsziel, gegen das „überfällig“ geprüft wird.
- **Finanzübersicht**: abgeleitete Summen über alle aktiven Anmeldungen des aktuellen Camps.
- **Aktivitätslog**: bestehender Log, in dem Zahlungsänderungen festgehalten werden.

Es entsteht kein neues gespeichertes Datenfeld.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Die Buchhalterin trägt eine eingegangene Zahlung für eine bekannte Person in unter
  30 Sekunden ein, gemessen vom Öffnen des Tabs bis zur gespeicherten Änderung.
- **SC-002**: Die Antwort auf „Wie viel ist noch offen?“ ist ohne Klick sofort beim Öffnen des Tabs
  sichtbar.
- **SC-003**: Ein Konto, das nur den Tab „Finanzen“ freigegeben hat, kann keine Gesundheitsangaben,
  Notfallkontakte oder sonstigen Formularantworten sehen, weder in der Oberfläche noch im Export.
- **SC-004**: Ein Konto ohne Berechtigung „Finanzen“ kann keinen Betrag und keinen Status ändern,
  auch nicht durch direkte Anfragen am Interface vorbei.
- **SC-005**: Summen im Tab „Finanzen“ stimmen in jedem Fall mit den Summen im Tab „Preise“ und im
  Dashboard überein.
- **SC-006**: Die Liste bleibt bei 300 Anmeldungen flüssig filterbar, Ergebnisse erscheinen beim
  Tippen ohne spürbare Verzögerung.

## Assumptions

- Die Buchhalterin bekommt ein normales Admin Konto, das über die bestehende Benutzerverwaltung mit
  Tab „Finanzen“ und Berechtigung „Finanzen“ ausgestattet wird. Ob sie zusätzlich „Preise“ oder das
  Dashboard sieht, entscheidet der Superadmin pro Konto.
- Die Berechtigung „Finanzen“ regelt wie bisher auch Schreibaktionen im Tab „Preise“. Wer nur
  Zahlungen pflegen soll, bekommt den Tab „Preise“ nicht freigegeben.
- Das Zahlungsziel gilt pro Camp, nicht pro Person. Es wird deshalb einmal in der Kopfzeile gezeigt
  statt als Spalte.
- Der fällige Betrag wird im Tab nicht geändert, sondern ergibt sich wie bisher aus der Preisstufe
  bzw. aus dem Anmeldungen Dashboard.
- Zahlungslink, Mailversand und Mahnungszählung kommen aus den bestehenden Funktionen
  (specs/006-stripe-payment, specs/007-transactional-emails) und werden nur wiederverwendet.
- Erstattungen werden über den Status „Erstattet“ und den Betrag abgebildet; eine eigene
  Erstattungsbuchung ist nicht Teil dieser Funktion.
- Die Finanzübersicht ist laut AGENTS.md Abschnitt 4 im Scope; eine Änderung der Constitution ist
  nicht nötig.
