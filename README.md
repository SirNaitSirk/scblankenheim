# CampConnect

> Online-Anmeldung und Verwaltungsplattform für das **FCG Blankenheim Summercamp** – ein christliches Sommercamp, das einmal im Jahr stattfindet.

CampConnect ermöglicht Interessenten die Anmeldung zum Camp und gibt dem Orga-Team ein internes Dashboard, um jede Anmeldung, Zahlungen und die Finanzen zu verwalten. Die Plattform ist **wiederverwendbar**: Jedes Jahr lässt sich ein neues Camp anlegen, sein Anmeldeformular frei konfigurieren und als „aktuelles" Camp veröffentlichen.

Dieses Repository ist ein **Rebuild** einer produktiv genutzten v1. Produkt, Datenmodell und die daraus gelernten Lektionen wurden übernommen, der Tech-Stack wurde bewusst modernisiert (Next.js + Clerk statt Vite + Supabase-Auth).

---

## Über dieses Repository (Bewerbungskontext)

Dieses Projekt dient auch als **Referenz meiner Arbeitsweise als Full-Stack-Entwickler**. Es zeigt an einem realen, nicht-trivialen Produkt:

- **Saubere Schichtentrennung** in einer Next.js-App-Router-Architektur (Server Components für Reads, Route Handler für privilegierte Schreibvorgänge, Middleware für Auth).
- **Sicherheit als Grundhaltung**: Autorisierung wird serverseitig erzwungen, Secrets verlassen nie den Browser, privilegierte DB-Writes laufen ausschließlich über den Service-Role-Client im Server-Layer.
- **Typsicherheit durchgängig**: TypeScript, aus dem DB-Schema generierte Typen, Validierung mit Zod.
- **Konfigurationsgetriebenes Produktdesign**: Das Anmeldeformular wird nicht hartkodiert, sondern aus der Datenbank (`camp_form_fields`) generiert – eine einzige Quelle der Wahrheit statt konkurrierender Formularkomponenten.
- **Bewusste Produktentscheidungen aus Erfahrung**: z. B. der tolerante Zahlungs-Fallback (angemeldet-aber-unbezahlt ist ein gültiger Zustand, keine Auto-Stornierung) und versteckte Sonderpreis-Tiers über Einladungslinks.

Der komplette Engineering-Standard und die Architektur-Regeln sind in [`AGENTS.md`](./AGENTS.md) dokumentiert.

---

## Features

**Öffentlich**

- Eine klare Landingpage mit Camp-Infos und Einstieg zur Anmeldung.
- Ein konfigurationsgetriebenes Anmeldeformular (Felder aus `camp_form_fields` des aktuellen Camps).
- Stripe-basierte Bezahlseite inkl. Ergebnis-/Danke-Seite.
- Packzettel-Seite.

**Anmeldung & Zahlung**

- Anmeldung über einen Route Handler → Datensatz in `registrations` (+ `submission_attempts` gegen Missbrauch/Rate-Limiting).
- Stripe-Checkout mit Webhook zum Abgleich des Zahlungsstatus.
- Preis-Tiers mit **versteckten Einladungslinks** – Sonderpreise sind nie öffentlich sichtbar.
- Automatische Zahlungserinnerungen via Vercel Cron (durch `CRON_SECRET` geschützt).
- Toleranter Fallback: angemeldet-aber-unbezahlt bleibt gültig; das Team gleicht Zahlungen manuell ab.

**Admin-Dashboard** (`/admin/*`, durch Clerk geschützt)

- Anmeldungen: Tabelle mit Filtern, Custom-Filtern, Spaltenauswahl, CSV-Export, Inline-Bearbeitung, Anlegen und Löschen.
- Finanzübersicht: aggregierte Zahlungs-/Umsatzansicht.
- Camp-Verwaltung: Camps anlegen, Formularfelder konfigurieren, aktuelles Camp und Preise setzen.
- Benutzer & Rollen: `superadmin` / `admin` mit granularen Berechtigungen.
- Einladungssystem: Admins per E-Mail einladen und Onboarding-Flow.
- Logs: leichtgewichtige Aktivitäts-/Fehleransicht.
- Transaktionale E-Mails (code-definierte Templates: Bestätigung, Zahlungslink, Erinnerung).

Alle nutzerseitigen Texte sind **auf Deutsch**, der Code ist durchgängig **englisch** gehalten.

---

## Tech-Stack

| Bereich           | Technologie                                          |
| ----------------- | ---------------------------------------------------- |
| Framework         | **Next.js** (App Router) + **TypeScript**            |
| Authentifizierung | **Clerk** (Admin-Identität & Sessions)               |
| Datenbank         | **Supabase** (Postgres + Storage – nur Datenlayer)   |
| Styling           | **Tailwind CSS** + **shadcn/ui** (Radix + CVA)       |
| Formulare         | **react-hook-form** + **Zod**                        |
| Client-State      | **TanStack Query**                                    |
| Zahlungen         | **Stripe** (Checkout + Webhook)                      |
| Animation         | **Motion**                                            |
| Hosting & Cron    | **Vercel** + **Vercel Cron**                         |

> Wichtig: **Auth ist Clerk, nicht Supabase Auth.** Supabase wird ausschließlich als Datenlayer verwendet.

---

## Architektur

Die App folgt einer strikten Schichtentrennung (siehe [`AGENTS.md`](./AGENTS.md) für Details):

```
app/            App-Router-Segmente: öffentliche Seiten + geschütztes app/admin/*
app/api/*       Route Handler: privilegierte Server-Ops (Stripe, Service-Role-Writes,
                Admin-Verwaltung, transaktionale Mails, Cron)
middleware.ts   Clerk-Auth: schützt /admin/* und privilegierte API-Routen
components/     UI – admin/, marketing/, ui/ (shadcn-Primitives)
hooks/          geteilter Client-State (z. B. Theme, Spalteneinstellungen)
lib/            Supabase-Clients, generierte DB-Typen, Design-Tokens, Helper
supabase/       Migrations = Source of Truth für das Schema
```

**Kernregeln**

- Der Browser hält **niemals** Service-Role-, Stripe-, Clerk- oder andere Secrets.
- Autorisierung wird **serverseitig** erzwungen (Clerk-Session + Rolle/Permissions aus `profiles`), bevor mit dem Service-Role-Client geschrieben wird.
- RLS bleibt als Defense-in-Depth aktiv, der Server-Layer ist aber das eigentliche Gate.
- Schemaänderungen laufen ausschließlich über Migrations in `supabase/migrations/`, danach werden die DB-Typen neu generiert.

---

## Datenmodell (Auszug)

| Tabelle               | Zweck                                                       |
| --------------------- | ----------------------------------------------------------- |
| `camps`               | Ein Datensatz pro jährlichem Camp                           |
| `camp_settings`       | Globale/pro-Camp-Einstellungen inkl. „aktuelles" Camp       |
| `camp_form_fields`    | Dynamische Formulardefinition pro Camp                      |
| `registrations`       | Anmeldungen (Hauptentität)                                  |
| `submission_attempts` | Throttling/Missbrauchs-Tracking des öffentlichen Formulars  |
| `price_tiers`         | Preis-Tiers inkl. versteckter Tiers über Einladungslinks    |
| `profiles`            | Admin-Profil + granulare Berechtigungen                     |
| `user_roles`          | `superadmin` / `admin`                                      |
| `admin_invitations`   | Ausstehende Admin-Einladungen                               |
| `logs`                | Aktivitäts-/Fehlerlog                                       |

---

## Lokale Entwicklung

**Voraussetzungen:** Node.js 20+, ein Supabase-Projekt, ein Clerk-Projekt und (für Zahlungen) ein Stripe-Account.

```bash
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen in .env.local anlegen (siehe unten)

# Dev-Server starten
npm run dev
```

Die App läuft anschließend unter [http://localhost:3000](http://localhost:3000).

### Skripte

| Befehl          | Beschreibung                    |
| --------------- | ------------------------------- |
| `npm run dev`   | Next.js-Dev-Server              |
| `npm run build` | Produktions-Build               |
| `npm run lint`  | ESLint                          |
| `npm run start` | Produktions-Server (nach Build) |

### Umgebungsvariablen

Nur `NEXT_PUBLIC_*`-Variablen erreichen den Client; alles andere ist server-only und gehört in die Vercel-Env, nicht ins Repo.

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Vercel Cron
CRON_SECRET=
```

---

## Deployment

Gehostet auf **Vercel**. Geplante Jobs (z. B. Zahlungserinnerungen) laufen über **Vercel Cron**, geschützt durch `CRON_SECRET`. Der Stripe-Webhook verifiziert die Stripe-Signatur, die Cron-Route den `CRON_SECRET` – beide sind bewusst nicht Clerk-authentifiziert.

---

## Lizenz

Privates Projekt – kein offizielles Open-Source-Release. Der Code dient als Arbeits- und Bewerbungsreferenz.
