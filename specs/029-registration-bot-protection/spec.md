# Feature Specification: Botschutz für das Anmeldeformular

**Feature Branch**: `026-hero-video` (kein eigener Branch angelegt)

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Bot protection for the public registration form. Problem: the form only has a per email OR per ip throttle (5 attempts per 10 minutes). A bot with rotating IPs and emails can submit unlimited fake registrations; each one is active, counts toward camp capacity, sends a confirmation mail to an arbitrary address and creates registration rows and Stripe checkout sessions. Goal: block automated submissions without hurting real people and without any third party service. Scope: (1) honeypot field, silently rejected; (2) minimum fill time via a server signed render timestamp, too old forms get a friendly reload hint; (3) global ceiling of registrations per hour for the current camp with an admin log entry. Admin added registrations unaffected. Out of scope: captcha, Turnstile, Vercel BotID, email verification, changes to the existing per ip throttle."

**Kontext**: Das öffentliche Anmeldeformular ist heute nur durch eine Drosselung geschützt: höchstens
fünf Versuche pro Mailadresse oder pro IP in zehn Minuten. Ein Bot mit wechselnden Adressen kommt
daran vorbei. Jede Fake Anmeldung zählt als aktiv zur Kapazität des Camps, verschickt eine
Bestätigungsmail an eine fremde Adresse und belegt das Tagesbudget von 100 Mails. Im schlimmsten Fall
zeigt das Formular echten Familien „ausgebucht“, obwohl kein echter Platz vergeben ist.

**Produktentscheidungen (vom Projektverantwortlichen am 2026-11-02 getroffen)**:

- Schutz ohne Drittanbieter: kein Captcha, kein Turnstile, keine Bot Erkennung eines Hosters. Die
  Datenschutzerklärung bleibt unverändert.
- Drei Schichten: verstecktes Fallenfeld, Mindestausfüllzeit, Obergrenze pro Stunde.
- Die bestehende Drosselung pro Mail und IP bleibt wie sie ist.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Echte Familien melden sich wie bisher an (Priority: P1)

Eine Mutter füllt das Anmeldeformular für ihren Sohn in Ruhe aus, auch mit Passwortmanager oder
automatischem Ausfüllen des Browsers, und schickt es ab. Sie merkt vom Botschutz nichts: keine
zusätzliche Aufgabe, kein Rätsel, kein zusätzliches Feld.

**Why this priority**: Der Schutz darf keine einzige echte Anmeldung kosten. Das Camp lebt von diesen
Anmeldungen.

**Independent Test**: Formular normal ausfüllen und absenden; die Anmeldung wird gespeichert, die
Bestätigungsmail kommt an, der Weg zur Zahlung öffnet sich wie bisher.

**Acceptance Scenarios**:

1. **Given** ein Mensch füllt das Formular in normaler Geschwindigkeit aus, **When** er absendet,
   **Then** wird die Anmeldung gespeichert und verhält sich genau wie heute.
2. **Given** der Browser füllt bekannte Felder automatisch aus, **When** abgesendet wird, **Then**
   bleibt das Fallenfeld leer und die Anmeldung geht durch.
3. **Given** jemand nutzt einen Screenreader oder die Tastatur, **When** er durch das Formular geht,
   **Then** erreicht er das Fallenfeld nicht und hört es nicht vorgelesen.

---

### User Story 2 · Einfache Bots werden still abgewiesen (Priority: P1)

Ein Skript füllt jedes Feld aus, das es im Formular findet, und schickt das Formular sofort ab. Es
bekommt eine Antwort, die nach Erfolg aussieht, aber es entsteht keine Anmeldung, keine Mail und keine
Zahlungssitzung.

**Why this priority**: Das ist der häufigste Angriff und kostet ohne Schutz Kapazität und Mailbudget.

**Independent Test**: Eine Anfrage mit ausgefülltem Fallenfeld oder ohne gültigen Zeitstempel senden;
die Antwort sieht erfolgreich aus, in der Anmeldeliste und im Mailverlauf erscheint nichts.

**Acceptance Scenarios**:

1. **Given** das Fallenfeld ist ausgefüllt, **When** abgesendet wird, **Then** antwortet das System
   wie bei einer erfolgreichen kostenlosen Anmeldung, speichert aber nichts und verschickt keine Mail.
2. **Given** das Formular wird schneller als die Mindestausfüllzeit abgeschickt, **When** die Anfrage
   ankommt, **Then** wird sie genauso still abgewiesen.
3. **Given** der Zeitstempel fehlt oder ist verändert, **When** die Anfrage ankommt, **Then** wird sie
   genauso still abgewiesen.
4. **Given** ein Bot wurde abgewiesen, **When** ein Admin die Protokolle ansieht, **Then** findet er
   einen Eintrag mit Grund und Zeitpunkt, aber ohne die eingegebenen Formulardaten.

---

### User Story 3 · Veraltetes Formular wird freundlich erklärt (Priority: P2)

Ein Vater öffnet das Formular am Morgen, wird abgelenkt und schickt es erst am nächsten Tag ab. Statt
einer stillen Ablehnung sieht er einen deutschen Hinweis, dass das Formular zu lange offen war und er
die Seite neu laden soll. Seine Eingaben bleiben im Formular stehen, solange er nicht neu lädt.

**Why this priority**: Ein Mensch mit altem Formular darf nicht glauben, er sei angemeldet.

**Independent Test**: Formular öffnen, die Gültigkeitsdauer verstreichen lassen, absenden; der
Hinweis erscheint, nach dem Neuladen geht die Anmeldung durch.

**Acceptance Scenarios**:

1. **Given** das Formular ist länger offen als die Gültigkeitsdauer, **When** abgesendet wird,
   **Then** erscheint der Hinweis „Das Formular war zu lange geöffnet. Bitte lade die Seite neu und
   sende es noch einmal ab.“ und es wird nichts gespeichert.
2. **Given** der Hinweis wurde angezeigt, **When** die Seite neu geladen und erneut abgesendet wird,
   **Then** geht die Anmeldung normal durch.

---

### User Story 4 · Obergrenze stoppt Massenangriffe (Priority: P2)

Ein besserer Bot wartet die Mindestzeit ab und lässt das Fallenfeld leer. Er nutzt wechselnde
Adressen. Nach einer festen Zahl von Anmeldungen innerhalb einer Stunde für das aktuelle Camp nimmt
das Formular für den Rest dieser Stunde keine weiteren an. Wer dann absendet, sieht einen
freundlichen Hinweis, es später noch einmal zu versuchen. Die Admins sehen im Protokoll, dass die
Grenze erreicht wurde.

**Why this priority**: Begrenzt den Schaden eines gezielten Angriffs auf eine überschaubare Zahl von
Einträgen, die Admins von Hand löschen können.

**Independent Test**: Die Obergrenze in einer Testumgebung erreichen; die nächste Anmeldung zeigt den
Hinweis, das Protokoll enthält genau einen Eintrag für diese Stunde.

**Acceptance Scenarios**:

1. **Given** in der laufenden Stunde wurde die Obergrenze erreicht, **When** jemand absendet,
   **Then** erscheint „Gerade gehen sehr viele Anmeldungen ein. Bitte versuche es in einer Stunde
   noch einmal.“ und es wird nichts gespeichert.
2. **Given** die Grenze wurde erreicht, **When** weitere Anfragen abgewiesen werden, **Then** entsteht
   pro Stunde höchstens ein Protokolleintrag mit Warnstufe, nicht einer pro Anfrage.
3. **Given** ein Admin legt im Dashboard eine Anmeldung von Hand an, **When** die Grenze erreicht ist,
   **Then** wird seine Anmeldung trotzdem gespeichert und zählt nicht zur Grenze.

---

### Edge Cases

- Das Formular wird geöffnet, bevor die Anmeldung öffnet, und nach dem Öffnen abgeschickt: Der
  Zeitstempel bleibt gültig, solange die Gültigkeitsdauer nicht überschritten ist.
- Jemand nutzt eine versteckte Preisstufe über einen Einladungslink: Für ihn gelten dieselben Regeln.
- Viele echte Familien melden sich direkt bei Anmeldestart an: Die Obergrenze liegt deutlich über dem
  zu erwartenden Ansturm (siehe Annahmen) und wird nur bei einem Angriff erreicht.
- Ein Mensch drückt zweimal schnell auf „Absenden“: Das Formular verhindert den Doppelklick wie heute;
  die Mindestzeit misst ab dem Laden des Formulars, nicht zwischen den Klicks.
- Die Uhr im Browser geht falsch: Der Zeitstempel kommt vom Server, die Uhr des Geräts spielt keine
  Rolle.
- Ein Bot wird still abgewiesen: Die Antwort verrät weder den Grund noch, welche Schicht ihn erkannt
  hat.
- Die Prüfung der Obergrenze schlägt technisch fehl: Die Anmeldung wird nicht blockiert (tolerant wie
  der übrige Anmeldeweg), der Fehler wird protokolliert.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das Anmeldeformular MUSS ein Fallenfeld enthalten, das für Menschen unsichtbar ist,
  von Screenreadern nicht vorgelesen wird, per Tastatur nicht erreichbar ist und vom Browser nicht
  automatisch ausgefüllt wird.
- **FR-002**: Eine Anfrage mit ausgefülltem Fallenfeld MUSS abgewiesen werden, ohne Anmeldung,
  Mail oder Zahlungssitzung anzulegen, und MUSS eine Antwort bekommen, die von einer erfolgreichen
  Anmeldung nicht zu unterscheiden ist.
- **FR-003**: Beim Ausliefern des Formulars MUSS der Server einen Zeitpunkt mitgeben, den nur der
  Server erzeugen und prüfen kann.
- **FR-004**: Eine Anfrage, deren Zeitpunkt fehlt, verändert ist oder weniger als die
  Mindestausfüllzeit zurückliegt, MUSS wie in FR-002 still abgewiesen werden.
- **FR-005**: Eine Anfrage, deren Zeitpunkt gültig, aber älter als die Gültigkeitsdauer ist, MUSS
  mit einem deutschen Hinweis zum Neuladen abgewiesen werden; die Eingaben im Formular bleiben dabei
  erhalten.
- **FR-006**: Pro aktuellem Camp DÜRFEN innerhalb einer gleitenden Stunde höchstens so viele
  öffentliche Anmeldeversuche mit gültigen Angaben angenommen werden, wie die Obergrenze erlaubt;
  darüber hinaus MUSS die Anfrage mit einem deutschen Hinweis abgewiesen werden. Gezählt werden
  Versuche, nicht nur gespeicherte Anmeldungen, damit die Grenze bei einem Angriff eher früher
  greift.
- **FR-007**: Wird die Obergrenze erreicht, MUSS höchstens ein Protokolleintrag mit Warnstufe pro
  Stunde entstehen, der im Admin Protokoll sichtbar ist.
- **FR-008**: Jede still abgewiesene Anfrage MUSS mit Grund (Fallenfeld, zu schnell, Zeitpunkt
  ungültig) und Zeitpunkt nachvollziehbar sein, ohne Formularinhalte zu speichern; gespeichert werden
  höchstens die Angaben, die die bestehende Drosselung schon heute festhält.
- **FR-009**: Von Admins im Dashboard angelegte Anmeldungen DÜRFEN von keiner der drei Schichten
  betroffen sein und zählen nicht zur Obergrenze.
- **FR-010**: Die Prüfungen MÜSSEN vor dem Speichern, vor dem Mailversand und vor dem Anlegen einer
  Zahlungssitzung greifen.
- **FR-011**: Die bestehende Drosselung pro Mail und IP MUSS unverändert weiterlaufen.
- **FR-012**: Mindestausfüllzeit, Gültigkeitsdauer und Obergrenze MÜSSEN an einer zentralen Stelle
  festgelegt sein.
- **FR-013**: Alle neuen sichtbaren Texte MÜSSEN deutsch sein und an der zentralen Stelle für die
  Texte des Anmeldeformulars stehen.
- **FR-014**: Es DARF kein Drittanbieter eingebunden und die Datenschutzerklärung nicht geändert
  werden.

### Key Entities

- **Formularzeitpunkt**: Vom Server ausgestellter, fälschungssicherer Nachweis, wann das Formular
  ausgeliefert wurde. Wird nicht gespeichert, nur bei der Anfrage geprüft.
- **Abgewiesener Versuch**: Eintrag mit Art des Versuchs, Grund, Zeitpunkt und den Angaben, die die
  bestehende Drosselung ohnehin führt. Wird mit den übrigen Drosselungsdaten nach 7 Tagen gelöscht.
- **Obergrenzenwarnung**: Ein Protokolleintrag pro Stunde, in der die Obergrenze erreicht wurde.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % der Anfragen mit ausgefülltem Fallenfeld oder ohne gültigen Formularzeitpunkt
  erzeugen keine Anmeldung, keine Mail und keine Zahlungssitzung.
- **SC-002**: Eine normal ausgefüllte Anmeldung braucht keinen zusätzlichen Schritt und dauert für den
  Menschen nicht länger als heute.
- **SC-003**: Ein Angriff mit wechselnden Adressen kann pro Stunde höchstens so viele Anmeldungen
  anlegen, wie die Obergrenze erlaubt.
- **SC-004**: Admins erkennen einen erreichten Grenzwert innerhalb derselben Stunde im Protokoll.
- **SC-005**: Kein abgewiesener Bot erhält eine Antwort, die den Grund der Abweisung erkennen lässt.

## Assumptions

- Mindestausfüllzeit 3 Sekunden: Das Formular hat mehrere Schritte, ein Mensch braucht deutlich
  länger.
- Gültigkeitsdauer des Formularzeitpunkts 24 Stunden.
- Obergrenze 60 öffentliche Anmeldungen pro Stunde und Camp. Das liegt über dem zu erwartenden
  Ansturm bei Anmeldestart und begrenzt einen Angriff trotzdem auf eine Zahl, die Admins von Hand
  aufräumen können. Der Wert ist zentral anpassbar.
- Das Formular braucht schon heute JavaScript zum Absenden; daran ändert sich nichts.
- Die Daten abgewiesener Versuche werden mit der bestehenden 7 Tage Löschung der Drosselungsdaten
  entfernt (specs/025-legal-pages), deshalb bleibt die Datenschutzerklärung gültig.
- Dieses Feature liegt im Umfang von AGENTS.md, Abschnitt 4: Missbrauchsschutz der Anmeldung über
  `submission_attempts`.
- Nicht im Umfang: Captcha, Turnstile, Bot Erkennung des Hosters, Bestätigung der Mailadresse vor der
  Anmeldung, Änderungen an der bestehenden Drosselung, Aufräumen bereits vorhandener Fake Anmeldungen.
