# Quickstart: Schnellere erste Antwort der Startseite prüfen

## Voraussetzungen

- Supabase Region im Dashboard bestätigt (Project Settings, General, Region: Stockholm, `eu-north-1`).
- Änderung an `vercel.json` ist auf Produktion deployt.

## 1 · Region prüfen

```bash
curl -sI https://summercamp.fcg-blankenheim.de/ | grep -i x-vercel-id
```

Erwartet: `…::arn1::…` (vorher `…::iad1::…`).

## 2 · Erstes Byte messen (SC001)

```bash
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{time_starttransfer}\n" https://summercamp.fcg-blankenheim.de/; done
```

Den ersten Wert verwerfen (Aufwärmen), Median der übrigen zehn unter 0,3 s. Vorher: rund 1 s.

## 3 · Lighthouse (SC002)

Mobil und Desktop je zweimal, Score mobil ≥ 95, Desktop ≥ 97.

## 4 · Inhalt unverändert

- Startseite öffnen: Termin, Anmeldestatus, Anmeldebutton und Seitentitel mit Campjahr wie vorher.
- Mit abgeschaltetem JavaScript: alle Abschnitte sichtbar.
- Mit gültigem `?einladung=` Link: Sonderpreis im Formular. Danach in anderem Browser ohne Link:
  nur öffentlicher Preis.

## 5 · Übrige Bereiche

- Admin öffnen und eine Anmeldung ansehen: lädt normal.
- Teilnehmerseite und `/bezahlen` öffnen: laden normal.
- Vercel Logs am nächsten Morgen: beide Cron Läufe mit 2xx; Stripe Webhook bei der nächsten Zahlung 2xx.

## Messwerte

| Zeitpunkt | Region (`x-vercel-id`) | Median erstes Byte (10 warme Aufrufe) | Min | Max |
|---|---|---|---|---|
| 2026-11-02, vor der Änderung | `fra1::iad1` | 0,955 s | 0,793 s | 1,306 s |
| 2026-11-02, direkt nach dem Deployment (Instanzen noch kalt) | `fra1::arn1` | 0,430 s | 0,252 s | 1,195 s |
| 2026-11-02, warm (3 × 20 Aufrufe) | `fra1::arn1` | 0,259 bis 0,294 s | 0,237 s | 0,573 s |

Lighthouse nach dem Deployment (je 2 Läufe): mobil 96 und 97 (vorher 95 bis 96), Desktop 100 und 100
(vorher 97). CLS 0.

Weitere Prüfungen am 2026-11-02: Titel „FCG Blankenheim Summercamp 2027“ unverändert, alle Abschnitte im
HTML ohne JavaScript, `cache-control: private, no-store`, ungültiger Einladungscode verhält sich wie
ohne Code. `/bezahlen` 200, `/packzettel` 200, `/datenschutz` 200, `/admin` leitet ohne Anmeldung auf
`/sign-in` weiter, Cron Route ohne Secret 401.
