# Feature Specification: Öffentliche Camp Anmeldung

**Feature Branch**: `001-registration-form`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Öffentliche Camp Anmeldung über ein einziges, konfigurierbares Formular. Interessierte melden sich auf der Landingpage für das aktuelle Summercamp an; Admins legen jedes Jahr ohne Codeänderung fest, welche Fragen gestellt werden. Größtenteils gebaut, die Spec dokumentiert die Baseline und schließt drei Lücken: Sonderpreise über versteckte Einladungslinks, Anmeldeschluss, gemeinsame Quelle für alle Formulartexte."

**Kontext**: Diese Spec beschreibt ein Feature, das in weiten Teilen bereits existiert. Anforderungen,
die heute schon erfüllt sind, sind mit *(Baseline)* markiert und dienen als Regressionsschutz.
Unmarkierte Anforderungen sind neu oder heute nicht erfüllt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Für das aktuelle Camp anmelden (Priority: P1)

Eine interessierte Person (Teilnehmende oder Elternteil) öffnet die Landingpage, scrollt zum
Anmeldebereich und füllt das Formular aus: zuerst Vorname, Nachname und Mailadresse, danach die
Fragen, die das Team für dieses Camp festgelegt hat. Nach dem Absenden sieht sie eine Bestätigung mit
ihrer Referenznummer und kann direkt eine weitere Person anmelden.

**Why this priority**: Das ist der Kern des Produkts. Ohne funktionierende Anmeldung gibt es keine
Teilnehmenden und keine Einnahmen.

**Independent Test**: Bei offener Anmeldung das Formular vollständig ausfüllen und absenden; die
Referenznummer erscheint und die Anmeldung ist im Adminbereich als offen und unbezahlt sichtbar.

**Acceptance Scenarios**:

1. **Given** die Anmeldung für das aktuelle Camp ist offen, **When** die Person alle Pflichtfelder
   korrekt ausfüllt und absendet, **Then** sieht sie eine Erfolgsmeldung mit einer eindeutigen
   Referenznummer und die Anmeldung ist mit dem Normalpreis als offen und unbezahlt gespeichert.
2. **Given** ein Pflichtfeld ist leer oder eine Mailadresse ungültig, **When** die Person absendet,
   **Then** wird nichts gespeichert und am betroffenen Feld steht eine verständliche Fehlermeldung.
3. **Given** die Erfolgsmeldung wird angezeigt, **When** die Person „Noch jemanden anmelden“ wählt,
   **Then** erscheint ein leeres Formular für die nächste Person.
4. **Given** das Team hat für das Camp Fragen in einer bestimmten Reihenfolge festgelegt, **When**
   die Landingpage geladen wird, **Then** erscheinen genau diese Fragen in genau dieser Reihenfolge
   nach den drei festen Feldern.

---

### User Story 2 · Anmeldung nur im gültigen Zeitraum (Priority: P1)

Die Anmeldung soll nur möglich sein, solange das Camp Anmeldungen annimmt. Vor der Öffnung sieht die
Person einen Countdown, nach dem Anmeldeschluss oder bei geschlossener Anmeldung einen Hinweis mit
Kontaktmöglichkeit.

**Why this priority**: Anmeldungen nach dem Schluss erzeugen Aufwand und enttäuschte Familien; der
Anmeldeschluss existiert als Einstellung, wird aber heute ignoriert.

**Independent Test**: Den Anmeldeschluss eines offenen Camps in die Vergangenheit legen; die
Landingpage zeigt den geschlossenen Zustand und eine direkte Übermittlung wird abgelehnt.

**Acceptance Scenarios**:

1. **Given** die Anmeldung ist geschlossen und ein Öffnungszeitpunkt liegt in der Zukunft, **When**
   die Landingpage geladen wird, **Then** erscheint ein Countdown bis zu diesem Zeitpunkt statt des
   Formulars. *(Baseline)*
2. **Given** die Anmeldung ist geschlossen und kein künftiger Öffnungszeitpunkt existiert, **When**
   die Landingpage geladen wird, **Then** erscheint der Hinweis „geschlossen“ mit Kontaktmöglichkeit.
   *(Baseline)*
3. **Given** die Anmeldung ist offen, aber der Anmeldeschluss ist erreicht, **When** die Landingpage
   geladen wird, **Then** erscheint der geschlossene Zustand statt des Formulars.
4. **Given** der Anmeldeschluss ist erreicht, während die Person das Formular noch offen hat,
   **When** sie absendet, **Then** wird die Anmeldung abgelehnt und sie sieht die Meldung, dass die
   Anmeldung geschlossen ist.
5. **Given** der Countdown läuft und kein Anmeldeschluss ist erreicht, **When** der
   Öffnungszeitpunkt erreicht ist, **Then** ist die Anmeldung automatisch offen, ohne dass ein Admin
   eingreifen muss. Wer die Seite neu lädt, sieht das Formular.
6. **Given** die Gesamtkapazität des Camps ist durch aktive Anmeldungen erreicht, **When** die
   Landingpage geladen wird, **Then** erscheint statt des Formulars der Hinweis, dass das Camp
   ausgebucht ist, mit Kontaktmöglichkeit.
7. **Given** nur noch ein Platz im Camp ist frei und zwei Personen senden gleichzeitig ab, **When**
   beide Übermittlungen eingehen, **Then** wird genau eine angenommen und die andere Person sieht,
   dass das Camp inzwischen ausgebucht ist.

---

### User Story 3 · Mit persönlichem Einladungslink zum Sonderpreis anmelden (Priority: P2)

Das Team verschickt an einzelne Personen oder Gruppen einen persönlichen Link. Wer über diesen Link
auf die Landingpage kommt und sich anmeldet, wird zum vereinbarten Sonderpreis angemeldet. Andere
Besucher erfahren nie, dass es Sonderpreise gibt.

**Why this priority**: Sonderpreise sind ein bestehendes Versprechen an Familien und Gruppen. Heute
erreicht der Link das Formular nicht, Eingeladene zahlen dadurch den Normalpreis.

**Independent Test**: Einen gültigen Einladungslink öffnen, anmelden und prüfen, dass die Anmeldung
mit dem Sonderpreis und der zugehörigen Preisstufe gespeichert ist.

**Acceptance Scenarios**:

1. **Given** ein gültiger, nicht abgelaufener Einladungslink für das aktuelle Camp, **When** die
   Person über diesen Link kommt und sich anmeldet, **Then** wird die Anmeldung mit dem Preis dieser
   Stufe gespeichert.
2. **Given** ein ungültiger, abgelaufener oder zu einem anderen Camp gehörender Link, **When** die
   Person sich anmeldet, **Then** wird sie ohne Fehlermeldung zum Normalpreis angemeldet.
3. **Given** eine Person kam über einen gültigen Link und hat sich angemeldet, **When** sie
   „Noch jemanden anmelden“ wählt, **Then** gilt der Sonderpreis auch für die nächste Anmeldung.
4. **Given** eine Person ohne Link besucht die Landingpage, **When** sie die Seite und das Formular
   betrachtet, **Then** gibt es keinen Hinweis auf Sonderpreise, Preisstufen oder deren Höhe.
5. **Given** eine Person kam über einen gültigen Link, **When** sie das Formular sieht, **Then**
   steht über dem Formular ein Hinweis ohne Betrag, sinngemäß „Du meldest dich über eine persönliche
   Einladung an“. Der Sonderpreis selbst wird nicht angezeigt.
6. **Given** eine Person kam über einen ungültigen oder abgelaufenen Link, **When** sie das Formular
   sieht, **Then** erscheint kein Einladungshinweis.

---

### User Story 4 · Begrenzte Plätze bei einer Auswahloption (Priority: P2)

Für eine Auswahloption (zum Beispiel eine Unterkunftsart oder ein Workshop) kann das Team ein
Platzlimit festlegen. Die Person sieht im Formular, wie viele Plätze noch frei sind; ausgebuchte
Optionen sind nicht wählbar.

**Why this priority**: Verhindert Überbuchung bei knappen Optionen und erspart dem Team das manuelle
Nachfassen.

**Independent Test**: Für eine Option ein Limit von 1 setzen, eine Anmeldung mit dieser Option
absenden, Seite neu laden: Die Option ist als ausgebucht markiert und nicht wählbar.

**Acceptance Scenarios**:

1. **Given** eine Option mit Platzlimit und freien Plätzen, **When** das Formular angezeigt wird,
   **Then** steht unter der Auswahl die Zahl der freien und der gesamten Plätze. *(Baseline)*
2. **Given** eine Option ist ausgebucht, **When** das Formular angezeigt wird, **Then** ist sie als
   „ausgebucht“ markiert und nicht wählbar. *(Baseline)*
3. **Given** eine Option wird ausgebucht, während die Person das Formular offen hat, **When** sie mit
   dieser Option absendet, **Then** wird nichts gespeichert und am Feld steht, dass keine Plätze mehr
   frei sind. *(Baseline)*

---

### User Story 5 · Einheitliche, deutsche und regelkonforme Texte (Priority: P3)

Alle Texte, die die Person im Anmeldebereich sieht (Beschriftungen, Hinweise, Fehlermeldungen,
Erfolgsmeldung), sind deutsch, an jeder Stelle gleich formuliert und folgen den Schreibregeln des
Projekts.

**Why this priority**: Heute stehen Meldungen doppelt im System und können auseinanderlaufen;
außerdem enthalten einige Texte Striche, die die Schreibregeln verbieten. Wichtig für Qualität, aber
die Anmeldung funktioniert auch ohne.

**Independent Test**: Jede Fehlermeldung einmal im Browser und einmal durch direkte Übermittlung
auslösen und vergleichen; alle Texte gegen die Schreibregeln prüfen.

**Acceptance Scenarios**:

1. **Given** dieselbe ungültige Eingabe, **When** sie einmal im Browser und einmal erst beim Server
   abgelehnt wird, **Then** ist die Fehlermeldung wortgleich.
2. **Given** ein beliebiger Text im Anmeldebereich, **When** er geprüft wird, **Then** enthält er
   keinen Gedankenstrich, keinen langen Strich und keinen Bindestrich in Wörtern (zum Beispiel
   „Mailadresse“ statt der Schreibweise mit Strich).

---

### Edge Cases

- Es ist kein aktuelles Camp festgelegt: Der Anmeldebereich zeigt den geschlossenen Zustand, eine
  direkte Übermittlung wird abgelehnt. *(Baseline)*
- Das Camp hat keine eigenen Fragen: Das Formular besteht nur aus Vorname, Nachname und Mail.
  *(Baseline)*
- Eine eigene Frage nutzt denselben Schlüssel wie ein festes Feld: Das feste Feld gewinnt, die Frage
  erscheint nicht doppelt. *(Baseline)*
- Die Verbindung bricht beim Absenden ab: Die Person sieht eine allgemeine Fehlermeldung, ihre
  Eingaben bleiben erhalten und sie kann erneut absenden. *(Baseline)*
- Jemand sendet in kurzer Zeit sehr viele Anmeldungen mit derselben Mail oder von derselben
  Verbindung: Weitere Versuche werden mit der Bitte abgelehnt, kurz zu warten. *(Baseline)*
- Jemand übermittelt Daten direkt, ohne das Formular zu benutzen: Es gelten exakt dieselben Prüfungen
  wie im Formular; Werte für unbekannte Fragen werden ignoriert.
- Doppelter Klick auf „Absenden“: Es entsteht genau eine Anmeldung. *(Baseline)*
- Ein Einladungslink wird nach dem Ende seiner Gültigkeit geöffnet: Anmeldung zum Normalpreis ohne
  Hinweis (siehe User Story 3).
- Dieselbe Person meldet sich zweimal an: Beide Anmeldungen werden angenommen; das Team bereinigt
  Dubletten im Adminbereich.

## Requirements *(mandatory)*

### Functional Requirements

**Anmeldebereich und Zustände**

- **FR-001**: Das System MUST den Anmeldebereich in genau einem von drei Zuständen anzeigen: offen
  (Formular), Countdown (vor der Öffnung) oder geschlossen (Hinweis mit Kontaktmöglichkeit).
  *(Baseline)*
- **FR-002**: Das System MUST den Zustand ausschließlich aus den Einstellungen des aktuellen Camps
  ableiten. *(Baseline)*
- **FR-003**: Das System MUST den geschlossenen Zustand zeigen, sobald der Anmeldeschluss des Camps
  erreicht ist, auch wenn die Anmeldung als offen markiert ist.
- **FR-004**: Das System MUST die Anmeldung automatisch als offen behandeln, sobald der
  Öffnungszeitpunkt erreicht ist und weder der Anmeldeschluss noch die Gesamtkapazität erreicht ist.
  Ein Admin kann die Anmeldung weiterhin jederzeit manuell öffnen oder schließen.

**Formular**

- **FR-005**: Das Formular MUST immer zuerst Vorname, Nachname und Mailadresse als Pflichtfelder
  zeigen. *(Baseline)*
- **FR-006**: Das Formular MUST danach alle für das aktuelle Camp festgelegten Fragen in der
  festgelegten Reihenfolge zeigen. *(Baseline)*
- **FR-007**: Das Formular MUST die Fragetypen Text, langer Text, Mail, Telefon, Zahl, Datum, Auswahl
  und Checkbox unterstützen, jeweils mit den Eigenschaften Pflicht oder optional, Platzhalter und
  Hilfetext. *(Baseline)*
- **FR-008**: Es MUST genau ein Anmeldeformular geben; jede Anpassung der Fragen erfolgt über die
  Camp Einstellungen, nicht über Änderungen am Produkt. *(Baseline)*

**Prüfung und Speicherung**

- **FR-009**: Das System MUST jede Eingabe sofort beim Absenden im Formular prüfen und Fehler direkt
  am Feld anzeigen. *(Baseline)*
- **FR-010**: Das System MUST jede Übermittlung unabhängig vom Formular erneut verbindlich gegen die
  aktuell gültigen Fragen und Regeln prüfen. *(Baseline)*
- **FR-011**: Das System MUST Übermittlungen ablehnen, wenn das Camp keine Anmeldungen annimmt
  (einschließlich Anmeldeschluss). Teilweise erfüllt: Der Anmeldeschluss wird heute nicht geprüft.
- **FR-012**: Das System MUST jede erfolgreiche Anmeldung mit einer eindeutigen Referenznummer, dem
  zu zahlenden Betrag, dem Status „offen“ und dem Zahlungsstatus „unbezahlt“ speichern. *(Baseline)*
- **FR-013**: Das System MUST NOT Anmeldungen wegen fehlender Zahlung automatisch stornieren.
  *(Baseline)*
- **FR-014**: Das System MUST nach erfolgreicher Anmeldung die Referenznummer anzeigen und eine
  weitere Anmeldung direkt ermöglichen. *(Baseline)*
- **FR-015**: Das System MUST jede neue Anmeldung im Aktivitätsprotokoll vermerken. *(Baseline)*

**Platzlimits**

- **FR-016**: Das System MUST für eine Auswahloption mit Platzlimit die freien Plätze anzeigen und
  ausgebuchte Optionen sperren. *(Baseline)*
- **FR-017**: Das System MUST das Platzlimit beim Speichern verbindlich prüfen und eine Anmeldung mit
  ausgebuchter Option ablehnen. *(Baseline)*

**Sonderpreise**

- **FR-018**: Das System MUST einen persönlichen Einladungscode aus dem aufgerufenen Link
  übernehmen und bei der Anmeldung mitgeben.
- **FR-019**: Das System MUST den Sonderpreis nur anwenden, wenn der Code zu einer Preisstufe des
  aktuellen Camps gehört und innerhalb ihres Gültigkeitszeitraums liegt; sonst gilt still der
  Normalpreis. *(Baseline auf Serverseite)*
- **FR-020**: Das System MUST den Einladungscode für weitere Anmeldungen in derselben Sitzung
  beibehalten.
- **FR-021**: Das System MUST NOT Sonderpreise, Preisstufen oder deren Existenz Personen ohne
  gültigen Link anzeigen.
- **FR-021a**: Das System MUST Personen mit gültigem Link einen Einladungshinweis ohne Betrag zeigen;
  der Sonderpreis selbst wird im Anmeldebereich nie angezeigt.

**Missbrauchsschutz**

- **FR-022**: Das System MUST mehr als 5 Übermittlungen pro Mailadresse oder Verbindung innerhalb von
  10 Minuten freundlich ablehnen. *(Baseline)*

**Texte und Zugänglichkeit**

- **FR-023**: Alle sichtbaren Texte im Anmeldebereich MUST deutsch sein und aus einer gemeinsamen
  Quelle stammen, sodass Formular und Serverprüfung wortgleiche Meldungen liefern.
- **FR-024**: Alle sichtbaren Texte MUST den Schreibregeln des Projekts folgen (keine Gedankenstriche,
  keine langen Striche, keine Bindestriche in Wörtern).
- **FR-025**: Jedes Feld MUST eine sichtbare Beschriftung haben; Fehlermeldungen MUST mit ihrem Feld
  verknüpft und für Screenreader angekündigt werden. *(Baseline)*
- **FR-026**: Der Anmeldebereich MUST auf Bildschirmen ab 320 Pixel Breite ohne horizontales Scrollen
  vollständig bedienbar sein.

**Kapazität**

- **FR-027**: Ist für das Camp eine Gesamtkapazität festgelegt, MUST das System keine öffentlichen
  Anmeldungen mehr annehmen, sobald die Zahl der aktiven Anmeldungen diese Kapazität erreicht. Das
  gilt auch für Personen mit Einladungslink.
- **FR-028**: Das System MUST bei erreichter Kapazität statt des Formulars einen eigenen Hinweis
  „ausgebucht“ mit Kontaktmöglichkeit zeigen, unterscheidbar vom Hinweis „geschlossen“.
- **FR-029**: Das System MUST die Kapazität beim Speichern verbindlich prüfen, sodass auch bei
  gleichzeitigen Übermittlungen nie mehr aktive Anmeldungen entstehen als Plätze vorhanden sind.
- **FR-030**: Als aktive Anmeldung zählt jede Anmeldung des Camps, die weder gelöscht noch storniert
  ist, unabhängig vom Zahlungsstatus.
- **FR-031**: Ist keine Gesamtkapazität festgelegt, gilt keine Begrenzung.

### Key Entities

- **Camp**: Das jährliche Summercamp. Relevant: Name, ob die Anmeldung offen ist, Öffnungszeitpunkt,
  Anmeldeschluss, Normalpreis, Gesamtkapazität.
- **Aktuelles Camp**: Die eine globale Festlegung, welches Camp auf der Landingpage erscheint.
- **Frage (Formularfeld)**: Gehört zu einem Camp. Schlüssel, Beschriftung, Typ, Pflicht, Reihenfolge,
  Auswahloptionen, Platzhalter, Hilfetext, optional Platzlimit für eine Option.
- **Preisstufe**: Gehört zu einem Camp. Preis, persönlicher Einladungscode, Gültigkeitszeitraum,
  verborgen oder nicht.
- **Anmeldung**: Gehört zu einem Camp und optional zu einer Preisstufe. Referenznummer, Vorname,
  Nachname, Mail, Antworten auf die Fragen, Status, Zahlungsstatus, zu zahlender Betrag.
- **Übermittlungsversuch**: Mail, Verbindung, Zeitpunkt; dient nur dem Missbrauchsschutz.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Person kann sich bei einem Camp mit bis zu 10 eigenen Fragen in unter 3 Minuten
  anmelden, auch auf dem Handy.
- **SC-002**: 100 % der Anmeldungen über einen gültigen Einladungslink werden mit dem Sonderpreis
  gespeichert; 0 % der Besuchenden ohne Link sehen einen Hinweis auf Sonderpreise.
- **SC-003**: Nach dem Anmeldeschluss wird keine einzige neue Anmeldung angenommen.
- **SC-004**: Keine Auswahloption mit Platzlimit wird überbucht, auch wenn mehrere Personen
  gleichzeitig die letzten Plätze wählen.
- **SC-004a**: Die Zahl der aktiven Anmeldungen überschreitet nie die festgelegte Gesamtkapazität
  des Camps, auch nicht bei gleichzeitigen Übermittlungen.
- **SC-005**: Für jede Fehlerart gibt es genau eine Formulierung, die im Formular und bei der
  Serverprüfung identisch ist.
- **SC-006**: Das Team kann für ein neues Camp Fragen festlegen und sie erscheinen auf der
  Landingpage, ohne dass am Produkt etwas geändert oder neu veröffentlicht werden muss.

## Assumptions

- Zielgruppe sind deutschsprachige Teilnehmende und Eltern; eine Anmeldung umfasst genau eine Person.
- Bezahlung, Bezahlseite, Bestätigungsmail und Zahlungserinnerungen sind eigene Features und nicht
  Teil dieser Spec; nach der Anmeldung meldet sich das Team zur Bezahlung.
- Die Verwaltung der Fragen, Preisstufen und Anmeldungen im Adminbereich existiert bereits und ist
  nicht Teil dieser Spec.
- Der Einladungscode steht im Link selbst; wie der Link aufgebaut ist, entscheidet der Plan.
- Dubletten (dieselbe Person mehrfach angemeldet) werden nicht automatisch verhindert, sondern im
  Adminbereich bereinigt.
- SC-004 schließt auch exakt gleichzeitige Übermittlungen ein. Heute ist das nicht garantiert, weil
  freie Plätze zuerst gezählt und erst danach gespeichert werden; der Plan muss diese Lücke schließen.
- Admins können im Adminbereich auch bei erreichter Kapazität noch Anmeldungen manuell anlegen
  (zum Beispiel für Mitarbeitende); die Kapazitätsgrenze gilt nur für die öffentliche Anmeldung.
- Wird ein Platz frei (Löschung oder Stornierung), öffnet sich die öffentliche Anmeldung
  automatisch wieder, sofern der Zeitraum noch gültig ist. Eine Warteliste gibt es nicht.
- Bedingte Fragen (eine Frage erscheint nur abhängig von einer anderen Antwort) sind nicht Teil
  dieser Spec.
