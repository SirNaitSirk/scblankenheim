# Quickstart: Coming Soon Sperre prüfen

Voraussetzung: `.env.local` wie bisher, dazu `COMING_SOON=true`, dann `npm run dev`.

1. Privates Fenster ohne Anmeldung: `/`, `/bezahlen`, `/packzettel`, `/meine-anmeldung/test`,
   `/busticket/beispiel`, `/kalender/<campId>`, `/design-system` öffnen. Erwartet: jedes Mal die
   Coming Soon Seite, Adresse bleibt gleich.
2. Auf der Coming Soon Seite: Campname, Hinweistext, Link „Teamzugang“; Quelltext enthält
   `noindex`.
3. Ohne Anmeldung `curl -i -X POST localhost:3000/api/register` und
   `curl -i -X POST localhost:3000/api/checkout`: Status 503, keine neue Zeile in `registrations`.
4. `curl -i -X POST localhost:3000/api/stripe-webhook`: nicht 503 (Signaturfehler wie bisher).
   `curl -i localhost:3000/api/cron/info-mails`: 401 wie bisher, nicht 503.
5. „Teamzugang“ klicken, als Admin anmelden, Punkte aus Schritt 1 wiederholen: echter Inhalt,
   Testanmeldung lässt sich abschicken.
6. Mit einem Clerk Konto ohne Adminprofil anmelden: Coming Soon Seite.
7. `COMING_SOON` entfernen, Server neu starten: alles wie vorher, `/demnaechst` liefert 404.
8. Handy Breite 320 px: kein horizontales Scrollen.
