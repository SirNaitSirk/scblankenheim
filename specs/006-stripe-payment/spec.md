# Feature Specification: Online bezahlen mit Stripe (Kern)

**Feature Branch**: `006-stripe-payment`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Stripe payment (core). After a successful public registration the attendee is redirected straight to a Stripe hosted checkout for the exact amount_due resolved at registration (base price or hidden price tier). Payment methods: card, Apple Pay, Google Pay, PayPal, SEPA Direct Debit, Klarna. Always one full payment, no deposits or installments. If the attendee cancels or leaves, they stay registered as unpaid (tolerant fallback, never auto cancel) and can pay later via /bezahlen?ref=<reference> which starts a new checkout for that registration; already paid registrations show a notice instead. /bezahlen/danke shows the result (paid, processing for delayed methods like SEPA, or still open). A signature verified stripe-webhook route is the only source of truth for payment status: completed and async succeeded → paid with amount_paid; async failed → stays unpaid; refunds made in the Stripe dashboard update status and amount_paid; events are idempotent. Admin registrations view shows the Stripe derived status (incl. processing) and admins can still set status manually. Out of scope for this feature: emails, payment reminders via cron, admin payment link button, in app refunds."

**Kontext**: Die Anmeldung legt heute schon den zu zahlenden Betrag fest (Standardpreis des Camps oder
Preis einer versteckten Preisstufe über Einladungslink) und speichert ihn an der Anmeldung. Bezahlt
wird bisher aber nicht online: Admins tragen den Zahlungsstatus von Hand ein. Die Landingpage verspricht
bereits „Sicher bezahlen, direkt bei der Anmeldung“ mit Karte, Apple Pay, Google Pay und PayPal. Dieses
Feature löst das Versprechen ein. Mails und automatische Erinnerungen folgen als eigenes Feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 · Direkt nach der Anmeldung bezahlen (Priority: P1)

Eine Person füllt das Anmeldeformular aus und schickt es ab. Statt nur einer Erfolgsmeldung geht es
direkt weiter zur sicheren Bezahlseite des Zahlungsanbieters. Dort steht der Betrag, der bei der
Anmeldung festgelegt wurde, und sie wählt eine Zahlungsart: Karte, Apple Pay, Google Pay, PayPal,
SEPA Lastschrift oder Klarna. Nach erfolgreicher Zahlung landet sie auf einer Dankeseite des Camps,
und die Anmeldung gilt als bezahlt.

**Why this priority**: Das ist der Kern der Anfrage. Ohne diesen Weg gibt es keine Onlinezahlung, und
Admins müssen weiter jede Zahlung von Hand abgleichen.

**Independent Test**: Im Testmodus anmelden, mit einer Testkarte bezahlen. Die Dankeseite zeigt
„Bezahlt“, und im Adminbereich steht die Anmeldung als bezahlt mit dem vollen Betrag.

**Acceptance Scenarios**:

1. **Given** die Anmeldung ist offen, **When** eine Person das Formular erfolgreich abschickt, **Then**
   wird sie ohne weiteren Klick zur Bezahlseite weitergeleitet, und dort steht genau der für sie
   festgelegte Betrag in Euro sowie der Name des Camps.
2. **Given** eine Person kam über einen Einladungslink mit Sonderpreis, **When** sie zur Bezahlseite
   kommt, **Then** steht dort der Sonderpreis, und der Betrag lässt sich auf der Seite nicht ändern.
3. **Given** die Person bezahlt erfolgreich mit Karte, Apple Pay, Google Pay, PayPal oder Klarna,
   **When** sie zurückkommt, **Then** zeigt die Dankeseite „Bezahlt“ mit Referenznummer, und die
   Anmeldung ist innerhalb kurzer Zeit im Adminbereich als bezahlt mit dem vollen Betrag vermerkt.
4. **Given** die Person zahlt per SEPA Lastschrift, **When** sie zurückkommt, **Then** zeigt die
   Dankeseite „Zahlung in Bearbeitung“ mit dem Hinweis, dass die Bestätigung einige Tage dauern kann,
   und im Adminbereich steht die Anmeldung als „In Bearbeitung“.
5. **Given** die Weiterleitung zur Bezahlseite schlägt fehl (zum Beispiel weil der Zahlungsanbieter
   kurz nicht erreichbar ist), **When** die Anmeldung trotzdem gespeichert wurde, **Then** sieht die
   Person die Erfolgsmeldung mit Referenznummer und einen Hinweis, wie sie später bezahlen kann. Die
   Anmeldung bleibt bestehen.

---

### User Story 2 · Später bezahlen (Priority: P1)

Jemand bricht die Bezahlung ab, schließt das Fenster oder die Zahlung schlägt fehl. Die Anmeldung bleibt
trotzdem gültig und steht als „Offen“. Über die Bezahlseite des Camps mit der eigenen Referenznummer
kann die Person jederzeit später bezahlen.

**Why this priority**: Die tolerante Rückfallebene ist ein Grundsatz des Projekts. Niemand verliert
seinen Platz, nur weil die Zahlung nicht sofort klappt.

**Independent Test**: Anmelden, auf der Bezahlseite abbrechen. Die Anmeldung steht im Adminbereich als
offen. Die Seite „Bezahlen“ mit der Referenznummer öffnen, bezahlen, Status wird „Bezahlt“.

**Acceptance Scenarios**:

1. **Given** eine Person bricht auf der Bezahlseite ab, **When** sie zurückkommt, **Then** sieht sie
   einen Hinweis, dass ihre Anmeldung gespeichert ist und die Zahlung noch offen ist, mit einem Knopf
   „Jetzt bezahlen“ und ihrer Referenznummer.
2. **Given** eine offene Anmeldung, **When** die Person die Bezahlseite des Camps mit ihrer
   Referenznummer öffnet, **Then** sieht sie Vorname, Camp und Betrag und kann über „Jetzt bezahlen“
   eine neue Zahlung starten.
3. **Given** eine bereits bezahlte Anmeldung, **When** die Bezahlseite mit dieser Referenznummer
   geöffnet wird, **Then** erscheint der Hinweis „Bereits bezahlt“, und es lässt sich keine weitere
   Zahlung starten.
4. **Given** eine Zahlung ist in Bearbeitung (SEPA), **When** die Bezahlseite geöffnet wird, **Then**
   erscheint „Zahlung in Bearbeitung“, und es lässt sich keine weitere Zahlung starten.
5. **Given** eine unbekannte, gelöschte oder falsch geschriebene Referenznummer, **When** die
   Bezahlseite geöffnet wird, **Then** erscheint eine neutrale Meldung, dass keine offene Anmeldung
   gefunden wurde, ohne zu verraten, ob die Nummer existiert.
6. **Given** eine Anmeldung bleibt unbezahlt, **When** Zeit vergeht oder das Zahlungsziel überschritten
   ist, **Then** wird sie nicht automatisch storniert.

---

### User Story 3 · Admins sehen den echten Zahlungsstand (Priority: P2)

Admins sehen in der Anmeldetabelle und in der Zahlungsübersicht, welche Anmeldungen online bezahlt,
in Bearbeitung, offen, teilweise oder vollständig erstattet sind, ohne etwas abzutippen. Sie können den
Status bei Bedarf weiterhin von Hand setzen, etwa bei Barzahlung oder Überweisung.

**Why this priority**: Der Nutzen der Onlinezahlung für das Team liegt im wegfallenden Abgleich. Die
Kernzahlung funktioniert aber auch ohne neue Ansicht, weil der bestehende Status schon angezeigt wird.

**Independent Test**: Je eine Anmeldung bezahlt, per SEPA in Bearbeitung und im Zahlungsanbieter
erstattet. Alle drei zeigen in der Tabelle den passenden Status, und die Zahlungsübersicht rechnet
die Beträge richtig.

**Acceptance Scenarios**:

1. **Given** eine Zahlung wird vom Zahlungsanbieter bestätigt, **When** ein Admin die Tabelle öffnet,
   **Then** steht die Anmeldung auf „Bezahlt“ mit dem gezahlten Betrag.
2. **Given** eine SEPA Zahlung ist eingereicht, aber noch nicht bestätigt, **When** ein Admin filtert,
   **Then** kann er nach „In Bearbeitung“ filtern, und diese Anmeldungen zählen nicht als eingegangen.
3. **Given** eine SEPA Zahlung scheitert endgültig, **When** der Zahlungsanbieter das meldet, **Then**
   steht die Anmeldung wieder auf „Offen“, und der eingegangene Betrag bleibt 0.
4. **Given** ein Admin erstattet im Dashboard des Zahlungsanbieters den vollen Betrag, **When** die
   Meldung eingeht, **Then** steht die Anmeldung auf „Erstattet“ mit eingegangenem Betrag 0. Bei einer
   Teilerstattung steht sie auf „Teilweise“ mit dem verbleibenden Betrag.
5. **Given** ein Admin setzt den Status einer Anmeldung von Hand, **When** er speichert, **Then** gilt
   der manuelle Wert, bis eine spätere Meldung des Zahlungsanbieters zu dieser Anmeldung eingeht.

---

### Edge Cases

- **Betrag 0 €** (zum Beispiel eine kostenlose Preisstufe): keine Weiterleitung zur Bezahlseite, die
  Anmeldung gilt sofort als bezahlt, und die Person sieht die normale Erfolgsmeldung.
- **Zwei offene Zahlungsvorgänge**: Startet jemand eine neue Zahlung, wird ein noch offener früherer
  Vorgang derselben Anmeldung ungültig. Geht trotzdem eine doppelte Zahlung ein, wird der volle
  eingegangene Betrag vermerkt, und die Anmeldung ist im Adminbereich als überzahlt erkennbar, damit
  ein Admin im Dashboard des Zahlungsanbieters erstatten kann.
- **Meldungen kommen doppelt oder in falscher Reihenfolge**: dieselbe Meldung zweimal ändert nichts
  mehr. Eine ältere Meldung überschreibt keinen neueren Stand.
- **Gefälschte Meldung**: Meldungen ohne gültige Signatur des Zahlungsanbieters werden abgelehnt und
  ändern nichts.
- **Dankeseite ohne bestätigte Zahlung**: Wer die Dankeseite direkt aufruft oder zurückkommt, bevor die
  Bestätigung eingegangen ist, sieht den tatsächlich gespeicherten Stand („Offen“ oder „In Bearbeitung“),
  nie ein „Bezahlt“, das nicht bestätigt ist.
- **Anmeldung wurde gelöscht oder Preis nachträglich geändert**: gelöschte Anmeldungen lassen sich
  nicht bezahlen. Ändert ein Admin den zu zahlenden Betrag, gilt bei der nächsten Zahlung der neue
  Betrag.
- **Zahlungsart nicht verfügbar** (zum Beispiel Klarna für einen Betrag oder ein Land nicht angeboten):
  die Bezahlseite zeigt die übrigen Arten, die Zahlung bleibt möglich.
- **Raten von Referenznummern**: die öffentliche Bezahlseite zeigt nur Vorname, Camp und Betrag, nie
  Nachname, Mail oder Formularangaben, und häufige Abrufe werden gebremst.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Nach erfolgreicher öffentlicher Anmeldung MUSS das System die Person direkt zu einem
  sicheren, vom Zahlungsanbieter gehosteten Bezahlvorgang über den bei der Anmeldung festgelegten
  Betrag weiterleiten.
- **FR-002**: Der Betrag MUSS allein auf dem Server aus der gespeicherten Anmeldung bestimmt werden.
  Kein Wert aus dem Browser darf den Betrag beeinflussen.
- **FR-003**: Der Bezahlvorgang MUSS Karte, Apple Pay, Google Pay, PayPal, SEPA Lastschrift und Klarna
  anbieten, soweit der Zahlungsanbieter sie für Betrag und Land zulässt.
- **FR-004**: Es MUSS immer der volle Betrag in einer Zahlung fällig sein. Anzahlungen oder eigene
  Raten des Camps gibt es nicht.
- **FR-005**: Abbruch, Fehlschlag oder Verlassen des Bezahlvorgangs DÜRFEN die Anmeldung NICHT
  stornieren. Unbezahlte Anmeldungen werden nie automatisch storniert.
- **FR-006**: Das System MUSS eine öffentliche Seite „Bezahlen“ bieten, die über die Referenznummer
  eine offene Anmeldung findet und einen neuen Bezahlvorgang dafür startet.
- **FR-007**: Für bezahlte oder in Bearbeitung befindliche Anmeldungen DARF KEIN neuer Bezahlvorgang
  starten. Stattdessen erscheint ein passender Hinweis.
- **FR-008**: Das System MUSS eine Dankeseite bieten, die den gespeicherten Stand der Anmeldung zeigt:
  „Bezahlt“, „Zahlung in Bearbeitung“ oder „Noch offen“ mit Knopf „Jetzt bezahlen“.
- **FR-009**: Der Zahlungsstatus DARF NUR durch signaturgeprüfte Meldungen des Zahlungsanbieters oder
  durch einen Admin geändert werden, nie durch das bloße Aufrufen der Dankeseite.
- **FR-010**: Das System MUSS diese Meldungen verarbeiten: erfolgreiche Zahlung (bezahlt, Betrag
  vermerkt), verzögerte Zahlung eingereicht (in Bearbeitung), verzögerte Zahlung erfolgreich (bezahlt),
  verzögerte Zahlung gescheitert (offen), Erstattung voll oder teilweise (erstattet oder teilweise,
  Betrag angepasst).
- **FR-011**: Die Verarbeitung MUSS idempotent sein: eine wiederholte Meldung ändert nichts, eine
  ältere Meldung überschreibt keinen neueren Stand.
- **FR-012**: Der Zahlungsstatus MUSS die Werte Offen, In Bearbeitung, Teilweise, Bezahlt und Erstattet
  kennen. Anzeige, Filter und Zahlungsübersicht im Adminbereich MÜSSEN alle Werte abbilden. Nur
  tatsächlich eingegangene Beträge zählen als eingegangen.
- **FR-013**: Admins MÜSSEN den Status weiterhin von Hand setzen können, etwa bei Bar oder Überweisung.
- **FR-014**: Startet eine Person einen neuen Bezahlvorgang, MUSS ein noch offener früherer Vorgang
  derselben Anmeldung ungültig werden.
- **FR-015**: Die öffentliche Bezahlseite DARF nur Vorname, Camp und Betrag zeigen und MUSS häufige
  Abrufe derselben Quelle bremsen.
- **FR-016**: Bei Betrag 0 € MUSS die Anmeldung ohne Bezahlvorgang als bezahlt gelten.
- **FR-017**: Jede Statusänderung durch den Zahlungsanbieter und jede abgelehnte Meldung MUSS im
  Aktivitätsprotokoll erscheinen.
- **FR-018**: Alle sichtbaren Texte (Bezahlseite, Dankeseite, Hinweise, Fehlermeldungen, Statuswerte)
  MÜSSEN auf Deutsch sein. Der Bezahlvorgang des Anbieters MUSS auf Deutsch und in Euro angezeigt werden.
- **FR-019**: Die gespeicherte Mailadresse der Anmeldung SOLL im Bezahlvorgang vorausgefüllt sein.

### Key Entities

- **Anmeldung**: bekommt keinen neuen Zweck, nur zusätzliche Zahlungsangaben: zu zahlender Betrag
  (gibt es schon), eingegangener Betrag (gibt es schon), Zahlungsstatus (erweitert um „In Bearbeitung“
  und „Erstattet“), Verweis auf den letzten Bezahlvorgang beim Anbieter und Zeitpunkt der letzten
  Statusänderung durch den Anbieter.
- **Bezahlvorgang**: ein Versuch, eine Anmeldung zu bezahlen. Gehört zu genau einer Anmeldung, lebt beim
  Zahlungsanbieter, kann offen, abgeschlossen oder abgelaufen sein. Eine Anmeldung kann mehrere Vorgänge
  nacheinander haben.
- **Anbietermeldung**: eine signierte Nachricht des Zahlungsanbieters über eine Zustandsänderung. Wird
  einmalig verarbeitet und so vermerkt, dass Wiederholungen erkannt werden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eine Person schafft Anmeldung und Bezahlung zusammen in unter 5 Minuten, ohne die Seite
  selbst wechseln oder einen Link suchen zu müssen.
- **SC-002**: 100 % der bestätigten Onlinezahlungen erscheinen ohne Zutun eines Admins als bezahlt mit
  korrektem Betrag, in der Regel innerhalb einer Minute.
- **SC-003**: 0 Anmeldungen gehen durch eine abgebrochene oder gescheiterte Zahlung verloren.
- **SC-004**: 0 Fälle, in denen eine Seite „Bezahlt“ zeigt, ohne dass die Zahlung bestätigt ist.
- **SC-005**: Wiederholt oder doppelt eingehende Meldungen führen in 100 % der Fälle zu keinem
  doppelt gezählten Betrag.
- **SC-006**: Der manuelle Abgleich von Onlinezahlungen durch Admins entfällt vollständig. Von Hand
  gepflegt werden nur noch Bar und Überweisungszahlungen.

## Assumptions

- Als Zahlungsanbieter dient Stripe mit seinem gehosteten Bezahlvorgang, wie in der Projektverfassung
  festgelegt. PayPal, SEPA Lastschrift und Klarna werden im Dashboard des Anbieters freigeschaltet.
- Beträge sind ganze Euro, wie bisher gespeichert.
- Die Referenznummer der Anmeldung dient als Schlüssel für „Später bezahlen“. Ein eigenes Konto für
  Teilnehmende gibt es nicht.
- Für die Bezahlseite reicht die Referenznummer. Wer sie kennt, darf für diese Anmeldung bezahlen.
  Deshalb zeigt die Seite nur minimale Angaben.
- Erstattungen werden ausschließlich im Dashboard des Zahlungsanbieters ausgelöst.
- Eine manuelle Statusänderung durch einen Admin wird von einer späteren Anbietermeldung zur selben
  Anmeldung überschrieben, weil die Meldung den jüngeren, verlässlichen Stand trägt.
- Testbetrieb läuft mit Testschlüsseln des Anbieters, Livebetrieb erst nach ausdrücklicher Freigabe.

### Out of Scope

- Bestätigungs und Zahlungslink Mails (erfordern zuerst einen Mailanbieter).
- Automatische Zahlungserinnerungen.
- Knopf im Adminbereich zum Erzeugen oder Versenden eines Zahlungslinks.
- Erstattungen aus dem Adminbereich heraus.
- Anzahlungen, Ratenzahlung durch das Camp, Gutscheine oder Rabattcodes.
- Rechnungen oder Quittungen als Dokument (der Anbieter verschickt auf Wunsch eine eigene Quittung).
