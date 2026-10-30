# Feature Specification: Impressum und Datenschutzerklärung

**Feature Branch**: `024-landing-structure` (kein eigener Branch angelegt)

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Impressum und Datenschutzerklärung hinzufügen. Zwei öffentliche Seiten /impressum und /datenschutz mit deutschen Rechtstexten. Betreiber ist die Gemeinde FCG Blankenheim als eingetragener Verein; Betreiberdaten (Vereinsname, Anschrift, vertretungsberechtigter Vorstand, Registergericht, Registernummer, Mail, Telefon) stehen zentral an einer Stelle und sind bis zum Nachreichen als deutlich markierte Lücken sichtbar. Die Datenschutzerklärung beschreibt die tatsächlich genutzten Dienste und Datenflüsse: Hosting, Datenbank, Anmeldung und Konto der Admins, Zahlungsabwicklung, Mailversand, Anmeldedaten der Teilnehmenden inklusive Minderjähriger, Teilnehmerseite, Nachrichten, Schulbefreiung, Busticket, Speicherdauer, Rechte der Betroffenen, Beschwerderecht. Texte entwirft das Team mit Claude, der Verein ergänzt. Verlinkt im Footer aller öffentlichen Seiten (Landingpage, Packliste, Bezahlen, Teilnehmerseite, Demnächst Seite). Beide Seiten sind auch hinter dem Prelaunch Gate erreichbar. Nicht im Umfang: Hinweis im Anmeldeformular, Links in Mails, Cookie Banner."

**Kontext**: Die Website richtet sich an die Öffentlichkeit, nimmt Anmeldungen mit
personenbezogenen Daten (auch von Minderjährigen) entgegen und wickelt Zahlungen ab. Dafür braucht
sie ein Impressum und eine Datenschutzerklärung. Beides fehlt heute; die alte Version zeigte nur
die Wörter ohne Link.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-10-30 getroffen)**:

- Claude entwirft beide Texte passend zu den tatsächlich genutzten Diensten, der Verein ergänzt und
  prüft sie.
- Verantwortlich ist die Gemeinde FCG Blankenheim als eingetragener Verein.
- Verlinkt wird im Footer aller öffentlichen Seiten. Formularhinweis, Mailfußzeile und Cookie Banner
  sind nicht Teil dieses Features.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Impressum finden und lesen (Priority: P1)

Eine Mutter möchte wissen, wer hinter dem Camp steht. Sie scrollt auf der Landingpage nach unten,
klickt im Footer auf „Impressum“ und sieht Name, Anschrift, Vorstand, Registereintrag und
Kontaktwege des Vereins.

**Why this priority**: Eine Anbieterkennzeichnung ist für eine öffentliche Website mit Anmeldung und
Bezahlung Pflicht und schafft Vertrauen.

**Independent Test**: Landingpage öffnen, im Footer „Impressum“ anklicken, die Seite öffnet sich mit
allen Pflichtangaben und einem Weg zurück zur Startseite.

**Acceptance Scenarios**:

1. **Given** eine beliebige öffentliche Seite, **When** im Footer „Impressum“ angeklickt wird,
   **Then** öffnet sich das Impressum.
2. **Given** das Impressum ist offen, **When** es gelesen wird, **Then** enthält es Vereinsname,
   Anschrift, vertretungsberechtigten Vorstand, Registergericht und Registernummer, Mail und
   Telefon sowie die inhaltlich verantwortliche Person.
3. **Given** eine Betreiberangabe ist noch nicht nachgereicht, **When** das Impressum angezeigt wird,
   **Then** steht an ihrer Stelle eine deutlich markierte Lücke statt einer erfundenen Angabe.

---

### User Story 2 · Datenschutzerklärung verstehen (Priority: P1)

Ein Vater meldet seine 15 jährige Tochter an und will vorher wissen, was mit ihren Daten passiert.
Er öffnet „Datenschutz“ und findet in klaren Abschnitten, welche Daten erhoben werden, wofür, an
welche Dienstleister sie gehen, wie lange sie gespeichert bleiben und welche Rechte er hat.

**Why this priority**: Die Anmeldung verarbeitet Daten von Minderjährigen, Gesundheits und
Adressangaben sowie Zahlungen; ohne Datenschutzerklärung ist der Betrieb nicht zulässig.

**Independent Test**: „Datenschutz“ öffnen und prüfen, dass jeder in FR-005 genannte Abschnitt
vorhanden ist und jeder tatsächlich genutzte Dienstleister mit Zweck genannt wird.

**Acceptance Scenarios**:

1. **Given** eine beliebige öffentliche Seite, **When** im Footer „Datenschutz“ angeklickt wird,
   **Then** öffnet sich die Datenschutzerklärung.
2. **Given** die Datenschutzerklärung ist offen, **When** sie gelesen wird, **Then** nennt sie den
   Verantwortlichen mit denselben Angaben wie das Impressum.
3. **Given** die Datenschutzerklärung ist offen, **When** ein Dienstleister der Website genannt
   wird, **Then** stehen dabei Zweck, Art der Daten und der Hinweis auf eine Übermittlung in
   Drittländer, wo zutreffend.
4. **Given** die Datenschutzerklärung ist offen, **When** nach Rechten gesucht wird, **Then** sind
   Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Widerruf
   einer Einwilligung und das Beschwerderecht bei einer Aufsichtsbehörde beschrieben, mit einem
   Kontaktweg.
5. **Given** die Datenschutzerklärung ist lang, **When** sie geöffnet wird, **Then** gibt es oben
   eine Übersicht der Abschnitte mit Sprunglinks.

---

### User Story 3 · Erreichbar auch vor dem Livegang (Priority: P2)

Solange die Coming Soon Sperre aktiv ist, öffnet eine Besucherin ohne Adminkonto die Demnächst
Seite. Auch dort findet sie Impressum und Datenschutz und kann beide lesen.

**Why this priority**: Die Pflichtangaben gelten auch für eine Vorschaltseite auf der echten Domain.

**Independent Test**: Bei aktiver Sperre in einem privaten Fenster die Startseite öffnen, auf
„Impressum“ und „Datenschutz“ klicken; beide Seiten zeigen den echten Text, nicht die Demnächst
Seite.

**Acceptance Scenarios**:

1. **Given** die Sperre ist aktiv und niemand ist angemeldet, **When** die Demnächst Seite angezeigt
   wird, **Then** enthält sie Links zu Impressum und Datenschutz.
2. **Given** die Sperre ist aktiv und niemand ist angemeldet, **When** Impressum oder Datenschutz
   direkt aufgerufen werden, **Then** erscheint der echte Inhalt.

---

### User Story 4 · Angaben an einer Stelle nachtragen (Priority: P3)

Der Vorstand schickt Anschrift und Registernummer. Das Team trägt sie an genau einer Stelle ein,
und beide Seiten zeigen sie danach vollständig, ohne markierte Lücken.

**Why this priority**: Verhindert, dass Impressum und Datenschutz unterschiedliche Angaben zeigen.

**Independent Test**: Eine Angabe an der zentralen Stelle ändern; sie erscheint danach gleich im
Impressum und im Abschnitt „Verantwortlicher“ der Datenschutzerklärung.

**Acceptance Scenarios**:

1. **Given** alle Betreiberangaben sind eingetragen, **When** beide Seiten angezeigt werden,
   **Then** ist keine Lücke mehr markiert.
2. **Given** eine Angabe wird geändert, **When** beide Seiten neu geladen werden, **Then** zeigen
   beide denselben neuen Wert.

---

### Edge Cases

- Angaben fehlen noch: Lücken sind auf der Seite sofort als Platzhalter erkennbar (zum Beispiel
  hervorgehoben und mit „noch einzutragen“ beschriftet) und lassen sich vor dem Livegang leicht
  finden.
- Es gibt kein aktuelles Camp: Beide Seiten funktionieren trotzdem, sie hängen nicht von Campdaten
  ab.
- Teilnehmerseite: Die Links im Footer verraten nichts über die Anmeldung und führen auf die
  allgemeinen Seiten.
- Druck: Beide Seiten lassen sich lesbar ausdrucken, ohne abgeschnittene Inhalte.
- Suchmaschinen dürfen beide Seiten indexieren, außer während der Sperre, wo die bestehende Regel
  für die ganze Domain gilt.
- Schmale Bildschirme: Lange Wörter, Adressen und Mailadressen brechen sauber um, kein seitliches
  Scrollen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das System MUST eine öffentliche Seite „Impressum“ unter `/impressum` und eine Seite
  „Datenschutz“ unter `/datenschutz` bereitstellen, vollständig auf Deutsch.
- **FR-002**: Die Betreiberangaben (Vereinsname, Anschrift, vertretungsberechtigter Vorstand,
  Registergericht, Registernummer, Mail, Telefon, inhaltlich verantwortliche Person) MUST an genau
  einer zentralen Stelle gepflegt werden und auf beiden Seiten identisch erscheinen.
- **FR-003**: Fehlende Betreiberangaben MUST als deutlich markierte Lücke angezeigt werden; es
  werden keine Angaben erfunden.
- **FR-004**: Das Impressum MUST die Anbieterkennzeichnung eines eingetragenen Vereins enthalten:
  Name, Anschrift, vertretungsberechtigter Vorstand, Registergericht und Registernummer, schnelle
  Kontaktwege (Mail und Telefon), die inhaltlich verantwortliche Person, einen Hinweis zur
  Verbraucherstreitbeilegung sowie Hinweise zur Haftung für Inhalte und Links.
- **FR-005**: Die Datenschutzerklärung MUST mindestens diese Abschnitte enthalten:
  1. Verantwortlicher mit Kontakt.
  2. Überblick, welche Daten wann erhoben werden.
  3. Besuch der Website: Hosting und Server Protokolle, notwendige Cookies, Schriften und Bilder.
  4. Anmeldung zum Camp: erhobene Angaben laut Formular, Zweck, Rechtsgrundlage, besondere Hinweise
     zu Minderjährigen und zu freiwilligen Gesundheitsangaben.
  5. Bezahlung über den Zahlungsdienstleister.
  6. Mails an Teilnehmende (Bestätigung, Zahlungslink, Erinnerungen, Infomails) und den
     Mailversanddienst.
  7. Teilnehmerseite mit geheimem Link, Nachrichten und Änderungswünsche.
  8. Schulbefreiung: Angaben zu Schule und Lehrkraft, Erzeugung des Schreibens, Versand nur an die
     Adresse der Anmeldung.
  9. Busticket: Ticketcode und Einstiegsprotokoll.
  10. Organisation vor Ort (Zimmer und Zeltkreise) nur intern.
  11. Konten des Teams und deren Anmeldung.
  12. Liste aller Dienstleister mit Zweck und Sitz, inklusive Hinweis auf Drittlandübermittlung.
  13. Speicherdauer und Löschung.
  14. Rechte der Betroffenen und Beschwerderecht.
  15. Stand der Erklärung.
- **FR-006**: Die Datenschutzerklärung MUST nur Dienste und Datenflüsse nennen, die die Website
  tatsächlich nutzt, und darf keine Analyse, Werbung oder Tracking behaupten, die es nicht gibt.
- **FR-007**: Die Datenschutzerklärung MUST oben eine Übersicht der Abschnitte mit Sprunglinks
  zeigen.
- **FR-008**: Links „Impressum“ und „Datenschutz“ MUST im Footer der Landingpage, der Packliste,
  der Bezahlseiten, der Teilnehmerseite und der Demnächst Seite erscheinen.
- **FR-009**: Beide Seiten MUST bei aktiver Coming Soon Sperre für alle Besucher mit echtem Inhalt
  erreichbar sein.
- **FR-010**: Beide Seiten MUST einen Weg zurück zur Startseite bieten und dem Erscheinungsbild der
  übrigen öffentlichen Seiten folgen.
- **FR-011**: Alle Texte MUST den Schreibregeln des Projekts folgen (keine Gedankenstriche, keine
  Bindestriche in Wörtern) und stehen zentral an einer Stelle, nicht verstreut.

### Key Entities

- **Betreiberangaben**: Name des Vereins, Anschrift, Vorstand, Registergericht, Registernummer,
  Mail, Telefon, inhaltlich verantwortliche Person. Feste Angaben, keine Datenbank, an einer Stelle
  gepflegt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Von jeder der fünf genannten öffentlichen Seiten erreicht man Impressum und
  Datenschutz mit einem Klick, 10 von 10 Links funktionieren.
- **SC-002**: Bei aktiver Sperre zeigen beide Seiten in einem privaten Fenster ohne Anmeldung den
  echten Inhalt, 2 von 2.
- **SC-003**: Jeder in FR-005 genannte Abschnitt ist in der Datenschutzerklärung vorhanden, 15 von
  15, und jeder tatsächlich genutzte Dienstleister ist genannt.
- **SC-004**: Nach dem Eintragen aller Betreiberangaben zeigt keine der beiden Seiten mehr eine
  markierte Lücke.
- **SC-005**: Beide Seiten sind auf einem Smartphone ohne seitliches Scrollen lesbar.

## Assumptions

- Die Texte sind ein sorgfältiger Entwurf, aber keine Rechtsberatung. Der Verein lässt sie vor dem
  Livegang prüfen; das wird auf keiner Seite erwähnt, aber in der Übergabe deutlich gesagt.
- Rechtsgrundlagen folgen dem üblichen Rahmen: Vertragsdurchführung für Anmeldung, Bezahlung und
  Organisation, berechtigtes Interesse für Server Protokolle und Missbrauchsschutz, Einwilligung
  für freiwillige Angaben, gesetzliche Aufbewahrung für Zahlungsbelege.
- Eine Aufsichtsbehörde wird allgemein genannt (die für den Sitz des Vereins zuständige); bei Sitz
  in Nordrhein Westfalen ist das die Landesbeauftragte für Datenschutz NRW. Das bestätigt der
  Verein.
- Ob ein Datenschutzbeauftragter bestellt ist, ist offen; die Seite nennt ihn nur, wenn er an der
  zentralen Stelle eingetragen ist.
- Speicherfristen werden als Grundsätze beschrieben (zum Beispiel Löschung der Anmeldedaten nach
  Abschluss des Camps und Ablauf von Aufbewahrungspflichten); genaue Fristen bestätigt der Verein.
- Es gibt kein Cookie Banner, weil die Website nur technisch notwendige Cookies setzt; das trifft
  heute zu und muss sich bei neuen Diensten erneut prüfen lassen.
- Die Busticket Ansicht ist Teil der Teilnehmerseite und bekommt dort keinen eigenen Footer.
