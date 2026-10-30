# Feature Specification: Coming Soon Sperre vor dem Livegang

**Feature Branch**: `023-coming-soon`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Coming Soon Sperre für Production: Solange die Website noch nicht offiziell live ist, sehen Besucher ohne Berechtigung auf allen öffentlichen Seiten (Landingpage, Bezahlen, Packzettel, Teilnehmerseite, Busticket, Kalender, Designsystem) nur eine schlichte Coming Soon Seite auf Deutsch. Angemeldete Admins (Clerk) sehen die echte Website. Anmeldung, Adminbereich und technische Schnittstellen (Stripe Webhook, Cron, Admin API) funktionieren weiter. Die Sperre wird über einen Umgebungsschalter nur in Production aktiviert; lokal und in Previews ist sie aus. Zum Livegang wird der Schalter entfernt und neu deployt. Öffentliche Formular APIs (Anmeldung, Checkout, Nachrichten, Link anfordern) sind während der Sperre für nicht angemeldete Besucher ebenfalls gesperrt."

**Kontext**: CampConnect läuft bereits auf der echten Domain, ist aber noch in Arbeit. Jeder,
der die Adresse kennt oder zufällig findet, kann heute die Landingpage öffnen und sich sogar
anmelden. Bis zum offiziellen Start soll die Öffentlichkeit nur einen Hinweis sehen, während das
Team die echte Seite weiter prüfen kann.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-30 getroffen)**:

- Die Sperre ist ein Schalter in der Umgebung der Live Website, kein Schalter im Adminbereich.
- Wer im Adminbereich angemeldet ist, sieht die echte Website.
- Alles, was das Team und die technischen Abläufe brauchen, läuft weiter.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Öffentlichkeit sieht nur den Hinweis (Priority: P1)

Jemand findet die Adresse des Camps und öffnet sie. Statt der Landingpage erscheint eine ruhige
Seite mit dem Namen des Camps und dem Hinweis, dass die Anmeldung bald startet. Auch wer eine
tiefere Adresse eintippt, etwa die Bezahlseite oder den Packzettel, landet auf demselben Hinweis.

**Why this priority**: Das ist der eigentliche Zweck: niemand Unbefugtes sieht halbfertige Inhalte
oder meldet sich versehentlich an.

**Independent Test**: In einem privaten Browserfenster ohne Anmeldung die Startseite, die
Bezahlseite, den Packzettel, eine Teilnehmerseite, eine Busticket Adresse, die Kalenderdatei und
das Designsystem öffnen. Jedes Mal erscheint die Coming Soon Seite, nie der echte Inhalt.

**Acceptance Scenarios**:

1. **Given** die Sperre ist aktiv und niemand ist angemeldet, **When** eine öffentliche Seite
   geöffnet wird, **Then** erscheint die Coming Soon Seite und die Adresse in der Leiste bleibt
   unverändert.
2. **Given** die Sperre ist aktiv, **When** die Coming Soon Seite angezeigt wird, **Then** zeigt sie
   den Namen des Camps, einen kurzen deutschen Hinweistext und einen unauffälligen Link
   „Teamzugang“ zur Anmeldung.
3. **Given** die Sperre ist aktiv, **When** eine Suchmaschine die Seite abruft, **Then** wird ihr
   mitgeteilt, die Seite nicht in den Index aufzunehmen.

---

### User Story 2 · Team sieht die echte Website (Priority: P1)

Ein Admin klickt auf „Teamzugang“, meldet sich an und öffnet danach die Startseite. Er sieht die
echte Landingpage mit Formular und kann den kompletten Ablauf bis zur Bezahlung testen.

**Why this priority**: Ohne diesen Zugang könnte das Team die Seite vor dem Start nicht prüfen.

**Independent Test**: Als Admin anmelden, dann Startseite, Bezahlseite und eine Teilnehmerseite
öffnen. Alle zeigen den echten Inhalt, eine Testanmeldung lässt sich abschicken.

**Acceptance Scenarios**:

1. **Given** die Sperre ist aktiv und ein Admin ist angemeldet, **When** er eine öffentliche Seite
   öffnet, **Then** sieht er den echten Inhalt.
2. **Given** die Sperre ist aktiv und ein Admin ist angemeldet, **When** er das Formular abschickt
   oder bezahlt, **Then** funktioniert das wie ohne Sperre.
3. **Given** jemand hat sich nur ein Konto angelegt, ist aber kein Admin von CampConnect, **When** er
   eine öffentliche Seite öffnet, **Then** sieht er die Coming Soon Seite.

---

### User Story 3 · Technik läuft weiter (Priority: P1)

Während der Sperre bestätigt der Zahlungsanbieter eine Testzahlung, der tägliche Mailversand läuft
und das Team scannt im Adminbereich ein Busticket. Nichts davon wird durch die Sperre blockiert.

**Why this priority**: Eine Sperre, die Zahlungsbestätigungen verschluckt, würde Daten verfälschen.

**Independent Test**: Bei aktiver Sperre eine Testzahlung abschließen und prüfen, dass die Anmeldung
als bezahlt markiert wird. Adminbereich und Anmeldeseite öffnen sich normal.

**Acceptance Scenarios**:

1. **Given** die Sperre ist aktiv, **When** der Zahlungsanbieter eine Zahlung meldet, **Then** wird
   sie wie bisher verarbeitet.
2. **Given** die Sperre ist aktiv, **When** die geplanten Abläufe (Zahlungserinnerungen, Infomails)
   starten, **Then** laufen sie wie bisher.
3. **Given** die Sperre ist aktiv, **When** jemand die Anmeldeseite oder den Adminbereich öffnet,
   **Then** verhalten sich beide wie ohne Sperre.
4. **Given** die Sperre ist aktiv, **When** jemand ohne Adminanmeldung eine öffentliche Aktion direkt
   aufruft (Anmeldung, Bezahlung starten, Nachricht senden, Link anfordern), **Then** wird sie
   abgelehnt und es entsteht kein Datensatz und keine Mail.

---

### User Story 4 · Livegang mit einem Handgriff (Priority: P2)

Am Starttag entfernt der Projektverantwortliche den Schalter und veröffentlicht neu. Ab dann sehen
alle Besucher die echte Website, ohne dass Code geändert werden muss.

**Why this priority**: Der Start soll ohne Entwicklungsarbeit und ohne Risiko möglich sein.

**Independent Test**: Schalter entfernen, neu veröffentlichen, im privaten Fenster die Startseite
öffnen. Die echte Landingpage erscheint.

**Acceptance Scenarios**:

1. **Given** der Schalter ist nicht gesetzt, **When** eine öffentliche Seite geöffnet wird, **Then**
   erscheint der echte Inhalt, für alle.
2. **Given** eine lokale Entwicklungsumgebung oder eine Vorschauversion, **When** der Schalter dort
   nicht gesetzt ist, **Then** gibt es keine Sperre.

---

### Edge Cases

- Ein unbekannter oder falsch geschriebener Wert des Schalters gilt als „aus“, nur ein eindeutiger
  Wert schaltet die Sperre ein.
- Bilder, Schriften und andere Dateien, die die Coming Soon Seite selbst braucht, laden weiter.
- Ein Admin, dessen Anmeldung abgelaufen ist, sieht die Coming Soon Seite und kommt über
  „Teamzugang“ wieder hinein.
- Links aus bereits verschickten Testmails (Teilnehmerseite, Bezahlen) führen bei Unbefugten zur
  Coming Soon Seite, bei angemeldeten Admins zum echten Inhalt.
- Die Adminbereiche selbst bleiben wie bisher geschützt; die Sperre ändert dort nichts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUST eine Sperre bieten, die über einen Schalter in der Umgebung der
  Website ein und ausgeschaltet wird, ohne Codeänderung.
- **FR-002**: Ist der Schalter nicht gesetzt oder hat einen anderen Wert als den Einschaltwert, MUST
  sich die Website genau wie heute verhalten.
- **FR-003**: Bei aktiver Sperre MUST jede öffentliche Seite (Landingpage, Bezahlen mit Dankeseite,
  Packzettel, Teilnehmerseite, Busticket Seiten, Kalenderdatei, Designsystem und jede künftige
  öffentliche Seite) für Unbefugte die Coming Soon Seite zeigen.
- **FR-004**: Die Coming Soon Seite MUST auf Deutsch sein, den Namen des Camps zeigen, einen kurzen
  Hinweis auf den baldigen Start enthalten, einen Link „Teamzugang“ zur Anmeldung bieten und
  Suchmaschinen das Indexieren untersagen. Sie zeigt keine Termine, Preise oder Formulare.
- **FR-005**: Befugt MUST nur sein, wer angemeldet ist und ein Adminkonto in CampConnect hat. Ein
  bloßes Benutzerkonto ohne Adminrechte reicht nicht.
- **FR-006**: Befugte MUST alle öffentlichen Seiten und Aktionen wie ohne Sperre nutzen können.
- **FR-007**: Bei aktiver Sperre MUST jede öffentliche Aktion (Anmeldung abschicken, Bezahlung
  starten, Nachricht oder Änderungswunsch senden, Teilnehmerlink anfordern, Schulbefreiung
  eintragen) für Unbefugte abgelehnt werden, ohne Daten zu speichern oder Mails zu senden.
- **FR-008**: Anmeldeseiten, Adminbereich, Admin Aktionen, Zahlungsbestätigungen des
  Zahlungsanbieters und geplante Abläufe MUST von der Sperre unberührt bleiben.
- **FR-009**: Die Sperre MUST nur in der Umgebung wirken, in der der Schalter gesetzt ist; lokale
  Entwicklung und Vorschauversionen bleiben ohne Schalter offen.

### Key Entities

Keine neuen Daten. Der Schalter lebt in der Umgebung der Website, nicht in der Datenbank.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei aktiver Sperre zeigt jede der sieben genannten öffentlichen Adressen in einem
  privaten Fenster ohne Anmeldung die Coming Soon Seite, 7 von 7.
- **SC-002**: Ein angemeldeter Admin erreicht dieselben sieben Adressen mit echtem Inhalt, 7 von 7.
- **SC-003**: Bei aktiver Sperre entsteht durch Unbefugte keine einzige Anmeldung, Nachricht oder
  Mail.
- **SC-004**: Eine Testzahlung bei aktiver Sperre wird innerhalb einer Minute als bezahlt angezeigt,
  wie ohne Sperre.
- **SC-005**: Der Livegang braucht nur das Entfernen des Schalters und eine neue Veröffentlichung,
  in unter fünf Minuten.

## Assumptions

- Der Hosting Anbieter erlaubt, einen Schalter nur für die Live Umgebung zu setzen; der
  Projektverantwortliche setzt ihn dort selbst oder lässt ihn setzen.
- Bis zum Livegang gibt es keine echten Teilnehmer; dass deren Links gesperrt wären, ist hinnehmbar.
- Ein eigener Vorschaulink für Personen ohne Adminkonto (zum Beispiel für die Gemeindeleitung) ist
  nicht Teil dieses Features; wer die Seite sehen soll, bekommt ein Adminkonto.
- Der Name des Camps auf der Coming Soon Seite kommt vom aktuellen Camp; gibt es keins, steht ein
  allgemeiner Name dort.
- Gestaltung folgt dem bestehenden Erscheinungsbild der Landingpage (Farben, Schrift, Logo).
