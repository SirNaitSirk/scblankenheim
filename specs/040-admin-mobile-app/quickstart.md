# Quickstart: Admin am Handy und als Homescreen App

## Checks

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

## Im Browser am Rechner (Handyansicht)

1. `npm run dev`, als Admin anmelden, Entwicklerwerkzeuge auf iPhone Größe stellen.
2. Anmeldungen: Kartenliste statt Tabelle, Suche und Filter wirken, Karte antippen öffnet den
   Dialog. Filter ohne Treffer zeigt den leeren Zustand.
3. Dialog: füllt den Bildschirm, Fußleiste bricht um, Schließen ist groß.
4. Menü öffnen: Seite dahinter scrollt nicht, Designumschalter liegt im Menü, Tab Taste bleibt im
   Menü, Escape schließt und setzt den Fokus auf den Menüknopf.
5. Fenster breiter als 768px: alles wie vorher, Tabelle mit Spaltenziehen, Umschalter oben.
6. Quelltext von `/admin`: Manifest Link, genau ein Apple Icon (das Admin Icon), `viewport-fit=cover`.
   Quelltext von `/`: kein Manifest Link, öffentliches Apple Icon.

## Auf dem iPhone

Voraussetzung: eine erreichbare Umgebung (Vercel Preview oder Produktion), da das iPhone
`localhost` des Rechners nicht sieht.

1. In Safari die Adminseite öffnen, in ein Feld im Finanztab tippen: keine Vergrößerung.
2. Teilen, „Zum Home Bildschirm“: Name „Summercamp Admin“ vorgeschlagen, Admin Icon sichtbar, hinzufügen.
3. Vom Icon starten: keine Safari Leisten, Anmeldung erscheint einmal, danach Übersicht.
4. Kopfleiste liegt unter Uhrzeit und Notch, unten Leiste mit Übersicht, Finanzen, Bus, Menü und
   Abstand zum Homeindikator.
5. Design hell und dunkel wechseln: Statusleiste passt sich an.
6. Neuladen Knopf antippen: Seite lädt neu. Flugmodus an, erneut antippen: Fehlermeldung, Flugmodus
   aus, antippen: Seite kommt wieder.
7. Bus, Scanner starten: Kamera funktioniert. Zimmerplanung, Druckansicht öffnen: funktioniert.
8. App schließen und neu starten: weiterhin angemeldet.
9. Öffentliche Startseite in Safari zum Home Bildschirm: öffentliches Icon, verhält sich wie bisher.

## Anleitung für das Team: Admin auf den Homescreen legen

1. Auf dem iPhone in Safari die Adminseite öffnen.
2. Unten auf Teilen tippen, dann „Zum Home Bildschirm“, dann „Hinzufügen“.
3. Die App „Summercamp Admin“ vom Homescreen starten und einmal anmelden. Die App merkt sich die Anmeldung
   getrennt von Safari, deshalb ist diese erste Anmeldung nötig.
4. Wer schon ein altes Lesezeichen auf dem Homescreen hat: löschen und neu hinzufügen.
5. Zum Aktualisieren den Kreispfeil oben in der Kopfleiste antippen; Herunterziehen gibt es in der
   App nicht.
