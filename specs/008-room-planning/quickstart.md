# Quickstart: Zimmerplanung prüfen

## Voraussetzungen

1. Migration `0009_room_planning.sql` ist auf der Supabase Datenbank eingespielt, DB Typen sind neu
   erzeugt.
2. `npm install` (neue Abhängigkeit `@dnd-kit/core`).
3. `npm run dev`, als Superadmin anmelden, ein aktuelles Camp mit einigen Anmeldungen existiert.

## Checks

```bash
npm run lint
npm test
npm run build
```

## Manuelle Schritte

1. **Tab und leerer Zustand**: `/admin/zimmerplanung` öffnen. Ohne Häuser erscheint der Hinweis mit
   „Haus anlegen“. Ein Admin ohne Freigabe sieht den Tab nicht und wird von der Adresse zum
   Dashboard geleitet.
2. **Häuser und Zimmer**: „Haupthaus“ mit Zimmern 4, 6, 8 Betten und „Gästehaus“ mit 2 Zimmern zu
   je 4 Betten anlegen. Leeren Namen und 0 Betten speichern: Fehlermeldung am Feld.
3. **Geschlecht der Zimmer**: Am Gästehaus „Alle Zimmer weiblich“, im Haupthaus zwei Zimmer
   männlich, eins weiblich. Karten zeigen Farbe und Text.
4. **Geschlecht nachtragen**: Altanmeldungen stehen unter „Geschlecht fehlt“. Eine auf „Weiblich“
   setzen: sie wandert in die weibliche Liste.
5. **Zuordnen per Drag and Drop**: Eine weibliche Person auf ein weibliches Zimmer ziehen. Beim
   Ziehen sind belegte männliche und volle Zimmer sichtbar gesperrt. Loslassen auf einem belegten
   männlichen Zimmer: Hinweis, keine Zuordnung. Seite neu laden: Zuordnung bleibt.
6. **Zuordnen per Klick**: Auf schmaler Breite (375 px) eine Person antippen, „Zimmer wählen“, nur
   passende freie und leere Zimmer werden angeboten. Auswahl ordnet zu.
7. **Leeres Zimmer übernimmt Geschlecht**: Eine männliche Person in ein leeres, nicht festgelegtes
   Zimmer ziehen: Zimmer wird männlich, Hinweis „Zimmer ist jetzt männlich“. Person entfernen, eine
   weibliche Person hineinziehen: Zimmer wird weiblich. In zwei Fenstern gleichzeitig eine weibliche
   und eine männliche Person in dasselbe leere Zimmer ziehen: nur eine Zuordnung gelingt.
8. **Suchen und filtern**: Name eintippen, dann Geschlecht „Weiblich“, Alter 13 bis 14 und ein
   Formularfeld (zum Beispiel Jugendgruppe) als Filter setzen. Nur passende Personen bleiben in der
   Liste, die Trefferzahl stimmt, passende Personen in Zimmern sind hervorgehoben. „Filter
   zurücksetzen“ zeigt wieder alle.
9. **Voll**: Ein 4er Zimmer füllen, fünfte Person darauf ziehen: „Zimmer ist voll“.
10. **Regeln**: Bettenzahl eines vollen 4er Zimmers auf 3 senken: abgelehnt. Geschlecht eines belegten
   Zimmers ändern: abgelehnt. Belegtes Zimmer löschen: Bestätigung nennt die Anzahl, danach sind die
   Personen wieder unverteilt.
11. **Stornieren**: Eine zugeordnete Anmeldung im Dashboard stornieren: Sie verschwindet aus dem
   Zimmer, das Bett ist frei. Wieder aktivieren: Person steht unverteilt in der Liste.
12. **Gleichzeitig**: In zwei Fenstern auf das letzte freie Bett eines Zimmers ziehen: Ein Fenster
    bekommt „Zimmer ist voll“, das Zimmer ist nie überbelegt.
13. **Kennzahlen**: Betten, belegt, frei und unverteilt je Geschlecht stimmen mit der Ansicht überein.
    Mehr weibliche Personen als weibliche Betten: Hinweis erscheint.
14. **Druck**: „Drucken“ öffnet die Druckansicht, je Haus eine Seite mit Zimmern und Namen.
15. **Anmeldeformular**: Öffentliche Anmeldung ohne Geschlecht abschicken: Fehlermeldung. Mit
    Geschlecht: Person erscheint in der Zimmerplanung in der richtigen Liste.
16. **Tastatur**: Mit Tab eine Person fokussieren, Enter öffnet „Zimmer wählen“, Pfeiltasten und
    Enter ordnen zu.
