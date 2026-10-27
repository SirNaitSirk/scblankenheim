# Feature Specification: Mails und Zahlungserinnerungen

**Feature Branch**: `007-transactional-emails`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Transactional emails and automatic payment reminders. After a public registration the attendee receives a German confirmation email with their reference, camp, amount due and a pay later link to /bezahlen?ref=<reference> (or a "bereits bezahlt"/free notice). Code defined templates only (no editor, no email_templates table): registration confirmation, payment link email, payment reminder. An email provider must be chosen (none exists yet). Automatic payment reminders for unpaid registrations of the current camp run via a scheduled cron route protected by CRON_SECRET; reminders never cancel anything (tolerant payment). camps.payment_due_date can drive reminder timing. Optionally admins can send or copy a payment link for a registration from the admin dashboard. Every send is logged; failures never break registration or payment."

**Kontext**: Seit Feature 006 können Teilnehmende online bezahlen, direkt nach der Anmeldung oder
später über die Seite „Bezahlen“ mit ihrer Referenznummer. Bisher bekommt aber niemand eine Mail:
Wer die Bezahlseite schließt, hat die Referenznummer nur, wenn er sie sich notiert hat, und Admins
müssen offene Zahlungen von Hand hinterhertelefonieren. Dieses Feature schließt die Lücke mit drei
festen Mails (Anmeldebestätigung, Zahlungslink, Zahlungserinnerung), automatischen Erinnerungen und
zwei Knöpfen im Adminbereich.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-27 getroffen)**:

- Mailanbieter: ein Dienst für Transaktionsmails mit Versand aus der EU (Resend).
- Erinnerungsrhythmus: höchstens 3 Erinnerungen. Die 1. sieben Tage nach der Anmeldung, die 2. sieben
  Tage vor dem Zahlungsziel des Camps, die 3. am Tag nach dem Zahlungsziel.
- Empfänger: Anmeldungen des aktuellen Camps mit Zahlungsstatus „Offen“ oder „Teilweise“.
- Adminbereich: pro Anmeldung „Zahlungslink senden“ und „Link kopieren“.
- Adminbereich: ein Tab „Mail“, in dem sich alle Vorlagen ansehen lassen, ohne sie bearbeiten zu
  können (Ergänzung vom 2026-10-27).

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Bestätigung nach der Anmeldung (Priority: P1)

Eine Person meldet sich an. Kurz danach findet sie eine Mail des Camps in ihrem Postfach: Die
Anmeldung ist eingegangen, dort stehen Name, Camp, Zeitraum, Referenznummer und der zu zahlende
Betrag. Ist die Zahlung noch offen, enthält die Mail einen Knopf „Jetzt bezahlen“, der direkt zur
Bezahlseite mit ihrer Referenznummer führt. Ist die Anmeldung kostenlos, steht dort, dass nichts zu
zahlen ist.

**Why this priority**: Ohne Bestätigung weiß niemand sicher, ob die Anmeldung angekommen ist, und wer
die Bezahlung abbricht, verliert den Weg zurück. Die Mail ist der Anker für alles Weitere.

**Independent Test**: Im Testbetrieb anmelden und die Bezahlseite schließen. Innerhalb einer Minute
liegt die Bestätigung im Postfach, der Knopf öffnet die Bezahlseite mit der richtigen Referenznummer,
und dort lässt sich bezahlen.

**Acceptance Scenarios**:

1. **Given** die Anmeldung ist offen, **When** eine Person das Formular erfolgreich abschickt, **Then**
   bekommt sie an die angegebene Mailadresse eine deutsche Bestätigung mit Vorname, Camp, Zeitraum,
   Referenznummer und zu zahlendem Betrag.
2. **Given** der Betrag ist größer als 0 €, **When** die Bestätigung erstellt wird, **Then** enthält
   sie einen Knopf und einen lesbaren Link zur Bezahlseite mit ihrer Referenznummer sowie, falls
   gesetzt, das Zahlungsziel des Camps.
3. **Given** der Betrag ist 0 €, **When** die Bestätigung erstellt wird, **Then** steht dort, dass
   nichts zu zahlen ist, und es gibt keinen Bezahlknopf.
4. **Given** die Person kam über einen Einladungslink mit Sonderpreis, **When** die Bestätigung
   erstellt wird, **Then** nennt die Mail nur ihren eigenen Betrag, nie den Namen der Preisstufe oder
   andere Preise.
5. **Given** der Mailversand schlägt fehl, **When** die Anmeldung gespeichert wurde, **Then** bleibt
   die Anmeldung bestehen, die Person kommt wie gewohnt zur Bezahlseite, und der Fehler erscheint im
   Aktivitätsprotokoll.

---

### User Story 2 · Automatische Zahlungserinnerungen (Priority: P1)

Hat jemand nach einer Woche noch nicht bezahlt, bekommt er eine freundliche Erinnerung mit dem
offenen Betrag und dem Bezahlknopf. Kurz vor dem Zahlungsziel kommt eine zweite, am Tag danach eine
letzte. Sobald bezahlt ist, kommt keine Erinnerung mehr. Niemand wird storniert.

**Why this priority**: Das Nachhalten offener Zahlungen ist heute der größte manuelle Aufwand im Team.
Erinnerungen holen die meisten offenen Beträge ohne Zutun eines Admins herein.

**Independent Test**: Eine offene Anmeldung mit Anmeldedatum vor acht Tagen anlegen, den
Erinnerungslauf auslösen: genau eine Erinnerung geht raus. Den Lauf sofort wiederholen: keine weitere
Mail. Anmeldung auf bezahlt setzen, Zahlungsziel in sieben Tagen, Lauf auslösen: keine Mail.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung des aktuellen Camps ist seit mindestens 7 Tagen „Offen“ und hat noch keine
   Erinnerung bekommen, **When** der tägliche Erinnerungslauf startet, **Then** bekommt sie die
   1. Erinnerung mit offenem Betrag, Referenznummer, Bezahlknopf und, falls gesetzt, Zahlungsziel.
2. **Given** das Zahlungsziel des Camps ist in 7 Tagen oder weniger und liegt noch nicht in der
   Vergangenheit, **When** der Lauf startet, **Then** bekommt jede passende offene Anmeldung, die die
   2. Erinnerung noch nicht hatte, die 2. Erinnerung.
3. **Given** das Zahlungsziel ist überschritten, **When** der Lauf startet, **Then** bekommt jede
   passende offene Anmeldung, die die 3. Erinnerung noch nicht hatte, die 3. Erinnerung. Ihr Ton
   bleibt freundlich, sie droht keine Stornierung an und nennt einen Ansprechpartner.
4. **Given** eine Anmeldung ist „Teilweise“ bezahlt, **When** sie erinnert wird, **Then** nennt die
   Erinnerung den noch offenen Restbetrag, nicht den vollen Betrag.
5. **Given** eine Anmeldung ist bezahlt, in Bearbeitung, erstattet, gelöscht, storniert, kostenlos,
   ohne Mailadresse oder gehört nicht zum aktuellen Camp, **When** der Lauf startet, **Then** bekommt
   sie keine Erinnerung.
6. **Given** der Campbeginn ist erreicht, **When** der Lauf startet, **Then** werden keine
   Erinnerungen mehr verschickt.
7. **Given** der Lauf wurde an einem Tag schon ausgeführt oder läuft doppelt, **When** er erneut
   startet, **Then** bekommt keine Anmeldung dieselbe Erinnerung zweimal.
8. **Given** jemand ohne gültige Berechtigung ruft den Erinnerungslauf auf, **When** die Anfrage
   eingeht, **Then** wird sie abgelehnt und verschickt nichts.
9. **Given** der Lauf ist durch, **When** ein Admin das Aktivitätsprotokoll öffnet, **Then** sieht er
   pro Lauf, wie viele Erinnerungen verschickt wurden und wie viele fehlgeschlagen sind.

---

### User Story 3 · Zahlungslink aus dem Adminbereich (Priority: P2)

Ein Admin sieht in der Anmeldetabelle eine offene Anmeldung, etwa nach einem Anruf der Eltern. Mit
„Zahlungslink senden“ geht sofort eine Mail mit dem Bezahlknopf an die hinterlegte Adresse. Mit
„Link kopieren“ landet der Link in der Zwischenablage, um ihn per Messenger zu schicken.

**Why this priority**: Nützlich für Einzelfälle und Rückfragen. Die automatischen Mails decken den
Normalfall schon ab, deshalb nach den P1 Stories.

**Independent Test**: Als Admin bei einer offenen Anmeldung „Zahlungslink senden“ klicken: Mail kommt
an, Hinweis „Zahlungslink gesendet“ erscheint, das Protokoll zeigt den Versand mit Admin. „Link
kopieren“ klicken und den Link in einem privaten Fenster öffnen: die Bezahlseite der Anmeldung
erscheint.

**Acceptance Scenarios**:

1. **Given** eine Anmeldung ist „Offen“ oder „Teilweise“ und hat eine Mailadresse, **When** ein Admin
   mit Berechtigung für Anmeldungen „Zahlungslink senden“ wählt, **Then** geht die Zahlungslinkmail
   an diese Adresse, und eine deutsche Erfolgsmeldung erscheint.
2. **Given** dieselbe Anmeldung, **When** der Admin „Link kopieren“ wählt, **Then** liegt der
   vollständige Link zur Bezahlseite mit der Referenznummer in der Zwischenablage, und eine kurze
   Bestätigung erscheint.
3. **Given** eine Anmeldung ist bezahlt, in Bearbeitung, erstattet, storniert oder kostenlos, **When**
   ein Admin die Zeile ansieht, **Then** ist „Zahlungslink senden“ nicht verfügbar.
4. **Given** die Anmeldung hat keine Mailadresse, **When** der Admin die Zeile ansieht, **Then** ist
   nur „Link kopieren“ verfügbar, mit dem Hinweis, dass keine Mailadresse hinterlegt ist.
5. **Given** der Versand schlägt fehl, **When** der Admin sendet, **Then** erscheint eine verständliche
   Fehlermeldung, und nichts an der Anmeldung ändert sich.
6. **Given** jemand ohne Adminrechte oder ohne Berechtigung für Anmeldungen, **When** er den Versand
   auslöst, **Then** wird die Anfrage abgelehnt.
7. **Given** ein Admin klickt mehrmals schnell hintereinander, **When** die Anfragen eingehen, **Then**
   geht höchstens eine Mail pro Minute an dieselbe Anmeldung.

---

### User Story 4 · Mailvorlagen im Adminbereich ansehen (Priority: P3)

Ein Admin möchte wissen, was Teilnehmende eigentlich bekommen. Im Adminbereich gibt es einen Tab
„Mail“. Dort sieht er alle Mails nebeneinander auswählbar: Anmeldebestätigung (mit Betrag und
kostenlos), Zahlungslink und die drei Erinnerungen. Zu jeder Mail stehen Betreff, wann sie verschickt
wird, und eine Vorschau, so wie sie im Postfach aussieht, gefüllt mit Beispieldaten und den echten
Angaben des aktuellen Camps. Ändern lässt sich nichts.

**Why this priority**: Hilft dem Team, Rückfragen zu beantworten und Texte zu prüfen. Der Versand
funktioniert auch ohne diese Ansicht.

**Independent Test**: Als Admin mit Zugriff auf den Tab „Mail“ öffnen, jede Vorlage auswählen: Betreff,
Versandzeitpunkt und Vorschau erscheinen, es gibt keine Eingabefelder und keinen Speicherknopf. Ein
Admin ohne Zugriff auf den Tab wird zur Übersicht umgeleitet.

**Acceptance Scenarios**:

1. **Given** ein Admin darf den Tab „Mail“ sehen, **When** er ihn öffnet, **Then** sieht er eine Liste
   der sechs Mails (Anmeldebestätigung, Anmeldebestätigung kostenlos, Zahlungslink, Erinnerung 1, 2
   und 3) mit je einem Satz, wann sie verschickt wird.
2. **Given** eine Mail ist ausgewählt, **When** die Vorschau erscheint, **Then** zeigt sie Betreff und
   genau den Inhalt, den die Vorlage beim Versand erzeugt, mit Beispielperson, Beispielreferenz und
   Name, Zeitraum, Standardpreis und Zahlungsziel des aktuellen Camps.
3. **Given** eine Mail ist ausgewählt, **When** der Admin auf „Textfassung“ umschaltet, **Then** sieht
   er die reine Textversion derselben Mail.
4. **Given** das aktuelle Camp hat kein Zahlungsziel, **When** die Vorschau erscheint, **Then** fehlt
   das Datum wie in der echten Mail, und ein Hinweis erklärt, dass ohne Zahlungsziel nur die
   1. Erinnerung verschickt wird.
5. **Given** ein Admin ohne Zugriff auf den Tab, **When** er die Adresse direkt aufruft, **Then** wird
   er zur Übersicht umgeleitet.
6. **Given** die Vorschau, **When** der Admin den Bezahlknopf darin anklickt, **Then** passiert nichts
   außerhalb der Vorschau; es wird keine Zahlung und keine Mail ausgelöst.

---

### Edge Cases

- **Mailanbieter nicht erreichbar oder nicht eingerichtet**: Anmeldung und Bezahlung laufen normal
  weiter. Der Fehler steht im Protokoll. Eine nicht verschickte Erinnerung wird beim nächsten Lauf
  erneut versucht, weil sie erst nach erfolgreichem Versand als verschickt gilt.
- **Bezahlt zwischen Bestätigung und Klick**: Wer nach der Zahlung den Knopf in der Bestätigung
  klickt, sieht auf der Bezahlseite „Bereits bezahlt“ (Verhalten aus Feature 006).
- **Zahlungsziel fehlt**: dann gibt es nur die 1. Erinnerung sieben Tage nach der Anmeldung. Die
  2. und 3. Erinnerung entfallen. Mails ohne Zahlungsziel nennen kein Datum.
- **Späte Anmeldung kurz vor oder nach dem Zahlungsziel**: Erinnerungen, deren Zeitpunkt schon
  vorbei war, als die Anmeldung einging, werden nicht nachgeholt. Pro Lauf bekommt eine Anmeldung
  höchstens eine Erinnerung, die erste frühestens 3 Tage nach der Anmeldung, und zwischen zwei
  Erinnerungen an dieselbe Anmeldung liegen mindestens 3 Tage.
- **Zahlungsziel nachträglich verschoben**: die Regeln gelten immer zum aktuellen Zahlungsziel. Schon
  verschickte Erinnerungen werden nicht wiederholt.
- **Wechsel des aktuellen Camps**: Anmeldungen früherer Camps bekommen keine Erinnerungen mehr.
- **Mailadresse vertippt oder unzustellbar**: lehnt der Anbieter die Adresse sofort ab, steht der
  Fehler im Protokoll. Eine spätere Unzustellbarkeit sieht das Team im Konto des Mailanbieters.
  Admins können die Adresse korrigieren und den Zahlungslink von Hand senden.
- **Manuell auf bezahlt gesetzt** (Bar oder Überweisung): gilt wie bezahlt, keine Erinnerungen mehr.
- **Status wird wieder offen** (zum Beispiel SEPA scheitert): die Anmeldung kann wieder erinnert
  werden, aber nur Erinnerungen, die sie noch nicht bekommen hat.
- **Lauf fällt einen Tag aus**: der nächste Lauf holt fällige Erinnerungen nach, ohne doppelt zu
  senden.
- **Viele Anmeldungen auf einmal**: ein Lauf schafft alle fälligen Erinnerungen eines Camps
  (Größenordnung einige Hundert) oder setzt sauber beim nächsten Lauf fort.

## Requirements *(mandatory)*

### Functional Requirements

**Allgemein**

- **FR-001**: Das System MUSS Mails über einen externen Mailanbieter verschicken. Zugangsdaten DÜRFEN
  NUR auf dem Server liegen.
- **FR-002**: Es MUSS genau drei Mailvorlagen geben: Anmeldebestätigung, Zahlungslink und
  Zahlungserinnerung (mit Varianten für die 1., 2. und 3. Erinnerung). Die Vorlagen sind fest im
  Projekt hinterlegt. Ein Editor im Adminbereich oder gespeicherte Vorlagen gibt es nicht.
- **FR-003**: Alle Mails MÜSSEN vollständig deutsch sein, Beträge in Euro und Daten im deutschen
  Format zeigen, als gut lesbare HTML Mail mit Textfassung verschickt werden und auf dem Handy
  lesbar sein.
- **FR-004**: Jede Mail mit Zahlungsbezug MUSS einen Knopf und einen lesbaren Link zur Bezahlseite mit
  der Referenznummer der Anmeldung enthalten. Der Link MUSS auf die öffentliche Adresse der Website
  zeigen.
- **FR-005**: Mails DÜRFEN nur Angaben der jeweiligen Anmeldung enthalten (Vorname, Camp, Zeitraum,
  Referenznummer, eigener Betrag, Zahlungsziel). Namen von Preisstufen, andere Preise und Angaben
  anderer Anmeldungen DÜRFEN NIE erscheinen.
- **FR-006**: Ein Fehler beim Mailversand DARF Anmeldung, Weiterleitung zur Bezahlung oder Verarbeitung
  von Zahlungen NIE verhindern oder verzögern.
- **FR-007**: Jeder Versand und jeder Fehlschlag MUSS im Aktivitätsprotokoll erscheinen, mit Art der
  Mail und Referenznummer, aber ohne Mailadresse oder Mailinhalt.
- **FR-008**: Absendername, Absenderadresse und Antwortadresse MÜSSEN einstellbar sein, ohne den Code
  zu ändern. Antworten auf eine Mail MÜSSEN beim Team ankommen.

**Anmeldebestätigung**

- **FR-009**: Nach jeder erfolgreichen öffentlichen Anmeldung MUSS das System genau eine Bestätigung an
  die angegebene Mailadresse verschicken.
- **FR-010**: Die Bestätigung MUSS je nach Betrag den Bezahlknopf (Betrag größer 0 €) oder den Hinweis
  „Nichts zu zahlen“ (Betrag 0 €) zeigen.

**Zahlungserinnerungen**

- **FR-011**: Das System MUSS einmal täglich automatisch prüfen, welche Erinnerungen fällig sind, und
  diese verschicken.
- **FR-012**: Erinnert werden NUR Anmeldungen des aktuellen Camps, die nicht gelöscht und nicht
  storniert sind, eine Mailadresse haben, einen Betrag größer 0 € schulden und den Zahlungsstatus
  „Offen“ oder „Teilweise“ haben.
- **FR-013**: Fälligkeit: 1. Erinnerung ab 7 Tagen nach der Anmeldung. 2. Erinnerung ab 7 Tagen vor
  dem Zahlungsziel bis einschließlich Zahlungsziel. 3. Erinnerung ab dem Tag nach dem Zahlungsziel.
  Ohne Zahlungsziel nur die 1. Erinnerung. Ab Campbeginn keine Erinnerungen mehr.
- **FR-014**: Jede Anmeldung DARF jede der drei Erinnerungen höchstens einmal bekommen, pro Lauf
  höchstens eine. Zwischen zwei Erinnerungen an dieselbe Anmeldung und zwischen Anmeldung und erster
  Erinnerung MÜSSEN mindestens 3 Tage liegen. Ist eine frühere Erinnerung beim Anmeldezeitpunkt schon überholt, entfällt sie.
- **FR-015**: Eine Erinnerung gilt erst nach erfolgreicher Übergabe an den Mailanbieter als verschickt.
  Wiederholte oder parallele Läufe DÜRFEN keine doppelten Erinnerungen erzeugen.
- **FR-016**: Der Erinnerungslauf DARF NUR durch den Zeitplan der Plattform oder mit dem geheimen
  Schlüssel des Laufs ausgelöst werden. Andere Aufrufe MÜSSEN abgelehnt werden.
- **FR-017**: Erinnerungen DÜRFEN NIE eine Anmeldung stornieren, ihren Status ändern oder eine
  Stornierung androhen.
- **FR-018**: Jeder Lauf MUSS eine Zusammenfassung ins Protokoll schreiben (verschickt,
  übersprungen, fehlgeschlagen).
- **FR-019**: Im Adminbereich MUSS pro Anmeldung erkennbar sein, wie viele Erinnerungen sie bekommen
  hat und wann die letzte.

**Adminbereich**

- **FR-020**: Admins mit Berechtigung für Anmeldungen MÜSSEN für eine Anmeldung mit Status „Offen“
  oder „Teilweise“ und Mailadresse die Zahlungslinkmail auslösen können.
- **FR-021**: Admins mit Berechtigung für Anmeldungen MÜSSEN für jede Anmeldung mit offenem Betrag den
  Link zur Bezahlseite kopieren können.
- **FR-022**: Der manuelle Versand MUSS die Rechte des Admins auf dem Server prüfen, pro Anmeldung auf
  eine Mail pro Minute begrenzt sein und im Protokoll mit dem auslösenden Admin erscheinen.
- **FR-023**: Ein manuell gesendeter Zahlungslink zählt nicht als automatische Erinnerung und ändert
  den Erinnerungsplan nicht.

**Mailvorschau**

- **FR-024**: Der Adminbereich MUSS einen Tab „Mail“ bieten, der jede Mail aus FR-002 (die
  Bestätigung in den Varianten mit Betrag und kostenlos) als Vorschau mit Betreff, Versandanlass, HTML
  Ansicht und Textfassung zeigt.
- **FR-025**: Die Vorschau MUSS mit denselben Vorlagen erzeugt werden wie der Versand, gefüllt mit
  fester Beispielperson und den Angaben des aktuellen Camps. Echte Anmeldungen DÜRFEN NICHT angezeigt
  werden; versteckte Preise DÜRFEN NICHT erscheinen.
- **FR-026**: Der Tab DARF nichts verändern oder verschicken: keine Bearbeitung, kein Speichern, kein
  Testversand.
- **FR-027**: Der Tab MUSS wie die übrigen Tabs über die Tabfreigabe eines Admins steuerbar sein;
  Superadmins sehen ihn immer.

### Key Entities

- **Mailversand**: ein Versuch, eine Mail einer bestimmten Art (Bestätigung, Zahlungslink,
  1., 2. oder 3. Erinnerung) zu einer Anmeldung zu verschicken. Hat Zeitpunkt, Ergebnis (verschickt
  oder fehlgeschlagen) und Auslöser (Anmeldung, Erinnerungslauf oder Admin). Dient als Nachweis und
  als Sperre gegen doppelte Erinnerungen.
- **Anmeldung**: unverändert. Liefert Mailadresse, Vorname, Referenznummer, Betrag, eingegangenen
  Betrag, Zahlungsstatus und Anmeldezeitpunkt.
- **Camp**: unverändert. Liefert Name, Zeitraum und Zahlungsziel. Das Zahlungsziel steuert die
  2. und 3. Erinnerung.
- **Mailvorlage**: fest im Projekt, keine gespeicherte Entität. Wird im Tab „Mail“ nur gelesen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % der erfolgreichen Anmeldungen mit Mailadresse lösen eine Bestätigung aus; im
  Normalfall liegt sie innerhalb einer Minute im Postfach.
- **SC-002**: 0 Anmeldungen scheitern oder werden langsamer, weil eine Mail nicht verschickt werden
  konnte.
- **SC-003**: Keine Anmeldung bekommt dieselbe Erinnerung zweimal und keine mehr als drei
  automatische Erinnerungen.
- **SC-004**: 0 Erinnerungen an Anmeldungen, die zum Zeitpunkt des Laufs bezahlt, in Bearbeitung,
  erstattet, storniert oder gelöscht sind.
- **SC-005**: Der Anteil der Anmeldungen, die zum Zahlungsziel noch offen sind, sinkt gegenüber dem
  Vorjahr deutlich; Admins müssen nur noch Einzelfälle von Hand nachhalten.
- **SC-006**: Ein Admin verschickt oder kopiert einen Zahlungslink in unter 10 Sekunden aus der
  Anmeldetabelle heraus.
- **SC-007**: Ein Admin findet für jede der Mails in unter 30 Sekunden Betreff, Versandanlass und
  Inhalt, ohne einen Entwickler zu fragen.

## Assumptions

- Mailanbieter ist Resend (Entscheidung vom 2026-10-27), mit verifizierter Absenderdomain der
  Gemeinde. Bis die Domain verifiziert ist, laufen Tests mit der Testadresse des Anbieters.
- Für den täglichen Lauf genügt eine feste Uhrzeit am Morgen (deutsche Zeit). Stundengenaue
  Erinnerungen sind nicht nötig.
- „Tage“ zählen nach Kalendertagen in deutscher Zeit.
- Ansprechpartner und Antwortadresse für Rückfragen kommen aus der Konfiguration, nicht aus jeder
  Mail einzeln.
- Die Bestätigung wird beim Absenden der Anmeldung verschickt, also meist bevor die Zahlung
  abgeschlossen ist. Eine eigene Mail „Zahlung erhalten“ gibt es nicht; der Zahlungsanbieter
  verschickt auf Wunsch seine eigene Quittung.
- Die Zahl der Anmeldungen pro Camp liegt im niedrigen dreistelligen Bereich und passt in die freien
  Kontingente des Anbieters.
- Bestehende Admins bekommen den neuen Tab nicht automatisch; ein Superadmin schaltet ihn in der
  Benutzerverwaltung frei.
- Rechtlich gelten diese Mails als Transaktionsmails zur bestehenden Anmeldung; eine eigene
  Abmeldefunktion ist nicht nötig. Ein Hinweis auf den Absender und Kontakt steht in jeder Mail.

### Out of Scope

- Editor für Mailvorlagen und gespeicherte Vorlagen (Verfassung III). Der Tab „Mail“ zeigt nur an.
- Testversand einer Vorlage aus dem Tab „Mail“.
- Mail „Zahlung erhalten“, Rechnungen und Quittungen als Dokument.
- Newsletter, Rundmails an alle Teilnehmenden und Werbemails.
- Mails an Admins (Einladungen und Passwörter laufen über die Anmeldeplattform der Admins).
- Erinnerungen pro Anmeldung abschalten und frei einstellbarer Erinnerungsrhythmus.
- Automatische Stornierung oder Sperre unbezahlter Anmeldungen (Verfassung VI).
- Auswertung von Öffnungen oder Klicks.
