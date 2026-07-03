# architecture.md - FitZone

_Stand: 2026-07-03_

Dieses Dokument ist die technische Wahrheit des Projekts. Es wird aktualisiert, sobald Stack, Datenmodell, Modulgrenzen oder technische Konventionen entschieden werden.

## 1. Architekturstatus

Initialer Code-Stack ist festgelegt und im Repository angelegt.

- Framework: Next.js 16 mit App Router und TypeScript.
- Runtime: Node.js `>=20.19.0`, passend zu Next.js 16 und Prisma 7.
- Datenbank: SQLite fuer lokale Entwicklung und MVP-Start.
- ORM: Prisma 7 mit `@prisma/adapter-better-sqlite3`.
- Prisma Client: generiert nach `src/generated/prisma`.
- Datenbank-URL: `DATABASE_URL`, Default lokal `file:./dev.db`.

Die Stack-Entscheidung ist in `docs/decisions.md` dokumentiert.

## 2. Domänenmodule

| Modul | Verantwortung |
|-------|----------------|
| Identity & Roles | Auth, Rollen `Member`/`Admin`, Zugriffsschutz |
| Members & Memberships | Mitglieder, Tarife, Vertragsende, Status |
| Courses | Kursarten, Raeume, Termine, Trainerqualifikation |
| Bookings | Kursbuchungen, Monatslimits, Storno, Warteliste |
| Penalties | Late-Cancellation-Gebuehren, No-Show-Sperren |
| Personal Training | freie Slots, Buchung, Premium-Inklusivslot, Billing-Status |
| Video Library | Videos, Kategorien, Tarifzugriff |
| Notifications | Nachruecker, Trainermeldungen, Vertragswarnungen |
| Admin Dashboard | Warnlisten, offene Posten, Sperren, operative Steuerung |

## 3. Relationales Datenmodell

Quelle: `docs/spec.md`.

Das initiale Prisma-Schema liegt in `prisma/schema.prisma`. Es bildet die Kernentitaeten aus der Spezifikation ab und verwendet UUID-Primary-Keys, Foreign Keys, Unique Constraints und Indizes fuer Buchungen, Wartelisten und Zeitabfragen.

### Kernentitaeten

- `Member`
- `MembershipTier`
- `Course`
- `CourseType`
- `Trainer`
- `TrainerQualification`
- `Room`
- `Booking`
- `Waitlist`
- `PersonalTrainingBooking`
- `Video`

### Noch zu pruefende Ergaenzungen

- `AccountCharge` oder `BillingItem` fuer Stornogebuehren und PT-Posten.
- `BookingRestriction` oder Felder am `Member` fuer No-Show-Sperren.
- `Notification`/`NotificationDelivery` fuer In-App/E-Mail-Nachrichten und Auditierbarkeit.
- `CheckIn` fuer spaeteren QR-Check-In.
- Audit-Felder (`updated_at`, `deleted_at`, `created_by`) fuer Admin-Aktionen.

## 4. Harte technische Leitplanken

- Buchungen und Wartelisten muessen transaktionssicher sein.
- Kurskapazitaeten duerfen nicht ueberbucht werden.
- Trainerqualifikationen werden serverseitig erzwungen, nicht nur im Dropdown gefiltert.
- Buchungsfenster und Stornofristen brauchen eindeutige Zeitzonenregeln.
- Geldwerte nie als Float-Rechenbasis verwenden.
- Geldwerte werden in Prisma als `Decimal` modelliert; Rechenlogik darf nicht ueber JavaScript-Floats laufen.
- Rollen- und Tarifberechtigungen serverseitig pruefen.
- Admin-Aktionen, die Geld, Sperren oder Buchungsstatus aendern, sollen nachvollziehbar sein.

## 4.1 Projektstruktur und Konventionen

- `src/app`: Next.js App Router, deutsche UI-Texte.
- `src/lib/prisma.ts`: Singleton fuer Prisma Client mit SQLite-Adapter.
- `prisma/schema.prisma`: Datenmodell als technische Umsetzung von `docs/spec.md`.
- `prisma.config.ts`: Prisma-CLI-Konfiguration, Migrationen unter `prisma/migrations`.
- `.env.example`: dokumentiert lokale Umgebungsvariablen ohne Secrets.

Prisma-Migrationen werden mit `npm run prisma:migrate` erzeugt. Fuer schnelle lokale Schema-Synchronisation kann `npm run db:push` genutzt werden, solange noch keine stabilen Migrationen benoetigt werden.

## 5. Jobs und asynchrone Prozesse

Mindestens diese Prozesse brauchen geplante oder asynchrone Ausfuehrung:

- Wartelisten-Nachruecker und Notification nach rechtzeitiger Stornierung.
- Taegliche Vertragsende-Pruefung bei 14 und 3 Tagen Restlaufzeit.
- No-Show-Auswertung und 14-Tage-Sperre nach 3 unentschuldigten Fehlterminen.
- Monatsabschluss fuer PT-Posten und ggf. Stornogebuehren.

## 6. UI-Struktur

### Member-Bereich

- Dashboard / naechste Buchungen
- Kurskalender
- Kursdetails mit Buchen/Stornieren/Warteliste
- Personal Training Slots
- Videomediathek
- Profil / Vertrag / Check-In-Platzhalter

### Admin-Bereich

- Dashboard mit Warnlisten
- Mitgliederverwaltung
- Tarifverwaltung
- Trainer und Qualifikationen
- Kursarten, Raeume, Kurstermine
- Buchungen und Wartelisten
- Personal Training und offene Posten
- Videomanagement

## 7. Testschwerpunkte

- Buchungsfenster pro Tarif.
- Monatslimit und Kulanz bei Trainer-Ausfall.
- Wartelisten-Reihenfolge und Nachruecken.
- Late-Cancellation mit Premium-Ausnahme.
- No-Show-Zaehler und Sperre.
- Trainerqualifikationsfilter plus serverseitige Validierung.
- Premium-Inklusivslot im Personal Training.
- Vertragsende-Erinnerungen exakt 14 und 3 Tage vorher.

## 8. Offene Architekturentscheidungen

- Auth-Provider oder eigene Auth.
- Notification-Provider.
- Hosting und Deployment.
- Umgang mit SEPA/IBAN-Daten.
