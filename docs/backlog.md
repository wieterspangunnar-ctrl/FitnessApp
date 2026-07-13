# backlog.md - FitZone

_Stand: 2026-07-11_

_Stabile Feature-IDs. Nicht umnummerieren. Killed-IDs bleiben killed._

## Konvention

- **ID-Schema:** `FZ-NNN`
- **Prefix:** `FZ` fuer FitZone
- **Nummerierung:** fortlaufend, nie wiederverwenden
- **Referenzierung:** In Commits, Konzepten und Entscheidungen immer per ID

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `hypo` | Hypothese/Idee, noch nicht validiert |
| `validated` | Durch Spezifikation oder Nutzer bestaetigt, aber noch nicht gebaut |
| `in-progress` | In Arbeit |
| `done` | Implementiert |
| `killed` | Verworfen, Begruendung in `decisions.md` |

## Features

### Phase 1 - Core Foundation & Admin-Stammdaten

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-001 | Projekt-Scaffold erstellen | 1 | done | docs/spec.md §1 | Next.js/Prisma/SQLite in `docs/decisions.md` entschieden |
| FZ-002 | Responsive App-Shell fuer Mobile und Desktop | 1 | validated | docs/spec.md §1, §5 | Grundlage fuer alle Rollen-Views |
| FZ-003 | FitZone-Basisdesign anwenden | 1 | validated | docs/spec.md §5 | Orange, Schwarz, Clean-Weiss, viel Fokus |
| FZ-004 | Rollenmodell `Member` und `Admin` einrichten | 1 | validated | docs/spec.md §1 | Zugriff strikt trennen |
| FZ-005 | Admin-Kontrollzentrum-Grundlayout | 1 | validated | docs/spec.md §1 | Zentrale Navigation fuer Lisa |
| FZ-006 | Member-Dashboard-Grundlayout | 1 | validated | docs/spec.md §1 | Profil, Buchungen, Kurse, PT, Videos erreichbar |
| FZ-007 | Relationales Datenmodell initialisieren | 1 | done | docs/spec.md §2 | Initiales Prisma-Schema mit UUID Primary Keys und Foreign Keys |
| FZ-008 | `Member`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Implementiert: Mitgliederverwaltung mit Prisma-Modell, API-Routen und Admin-UI fuer Anlegen/Bearbeiten/Loeschen; dokumentiert in `docs/decisions.md` |
| FZ-009 | `MembershipTier`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Implementiert: Tarif-CRUD, UI und Datenmodell |
| FZ-010 | `Trainer`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Implementiert: Trainer-CRUD mit Name, E-Mail und PT-Stundensatz |
| FZ-011 | `CourseType`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Implementiert: API (`src/app/api/course-types/*`) und Admin-UI (`src/app/course-types/page.tsx`) |
| FZ-012 | `TrainerQualification`-Relation modellieren | 1 | done | docs/spec.md §2.1, §3 | Implementiert: Prisma-Modell und generierter Client (`prisma/schema.prisma`, `src/generated/prisma`) |
| FZ-013 | `Room`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Raumname; Admin-CRUD umgesetzt |
| FZ-014 | `Course`-Entitaet modellieren | 1 | done | docs/spec.md §2.1 | Kursart, Zeit, Kapazitaet, Raum, Trainer |
| FZ-015 | Admin-CRUD fuer Mitglieder | 1 | done | docs/spec.md §1, §2.1 | Stammdaten inkl. Status und Vertragsende |
| FZ-016 | Admin-CRUD fuer Tarife | 1 | done | docs/spec.md §1, §2.1 | Basic, Plus, Premium und Regelparameter |
| FZ-017 | Admin-CRUD fuer Trainer | 1 | done | docs/spec.md §1, §2.1 | Implementiert: `src/app/api/trainers`, `src/app/trainers/page.tsx` |
| FZ-018 | Admin-CRUD fuer Kursarten | 1 | done | docs/spec.md §1, §2.1 | Implementiert: API und Admin-UI unter `src/app/api/course-types/*` und `src/app/course-types/page.tsx` |
| FZ-019 | Admin-CRUD fuer Trainerqualifikationen | 1 | done | docs/spec.md §3, BR6 | Welche Trainer welche Kursarten unterrichten duerfen |
| FZ-020 | Admin-CRUD fuer Raeume | 1 | done | docs/spec.md §1, §2.1 | Implementiert: Raume anlegen, bearbeiten, löschen und in Kursplanung nutzbar |
| FZ-021 | Admin-Kurstermine planen | 1 | done | docs/spec.md §1, §2.1 | Implementiert in `src/app/courses/page.tsx` und `src/app/api/courses/*` |
| FZ-022 | Trainer-Dropdown nach Qualifikation filtern | 1 | done | docs/spec.md BR6 | Im Admin-Bereich nur passende Trainer anzeigen |
| FZ-023 | Trainerqualifikation serverseitig erzwingen | 1 | done | docs/spec.md BR6 | Im Courses-API-POST/PUT jetzt serverseitig geprüft; ungültige Kombinationen werden mit 400 abgewiesen |

### Phase 2 - Member-Kurse, Buchung & Warteliste

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-024 | `Booking`-Entitaet modellieren | 2 | done | docs/spec.md §2.1, §3 | Member zu Course mit Status und `booked_at` — API: src/app/api/bookings/route.ts |
| FZ-025 | `Waitlist`-Entitaet modellieren | 2 | done | docs/spec.md §2.1, §3 | Member zu Course mit Position; API und Admin-UI unter `src/app/api/waitlists/*` und `src/app/waitlists/page.tsx` umgesetzt |
| FZ-026 | Member-Profil anzeigen | 2 | done | docs/spec.md §1 | Eigene Profil- und Vertragsdaten; umgesetzt als Profilseite mit Stammdaten, Tarif und Vertragsinformationen |
| FZ-027 | Kurskalender fuer Mitglieder anzeigen | 2 | done | docs/spec.md §1, BR3 | Kurse sichtbar nach Tariffenster |
| FZ-028 | Buchungsfenster pro Tarif anwenden | 2 | done | docs/spec.md BR3 | Implementiert: Mitgliedersicht filtert Kurse nach Tariffenster; Buchungen werden serverseitig nur innerhalb des erlaubten Fensters akzeptiert. |
| FZ-029 | Kursdetails mit Kapazitaet anzeigen | 2 | done | docs/spec.md §1, §2.1 | Implementiert: API liefert freie Plätze; Admin- und Member-Ansicht zeigen Kapazität. |
| FZ-030 | Kursbuchung durch Mitglieder | 2 | done | docs/spec.md §1, §3 | Backend: POST `/api/bookings` erstellt `Booking` oder `Waitlist` bei voller Belegung |
| FZ-031 | Monatslimit fuer aktive Buchungen zaehlen | 2 | done | docs/spec.md BR1 | Laufender Kalendermonat |
| FZ-032 | Buchung bei erreichtem Tariflimit blockieren | 2 | done | docs/spec.md BR1 | Implementiert in der Booking-API über eine zentrale Tariflimit-Prüfung; Basic-Limit typischerweise 5 |
| FZ-033 | Kursstornierung durch Mitglieder | 2 | done | docs/spec.md §1, BR4 | Stornieren statt loeschen |
| FZ-034 | Rechtzeitige Stornierung als `CANCELLED_TIMELY` speichern | 2 | done | docs/spec.md BR4 | Frist >= 2 Stunden |
| FZ-035 | Spaete Stornierung als `CANCELLED_LATE` speichern | 2 | done | docs/spec.md BR4 | Implementiert: src/app/api/bookings/[id]/route.ts |
| FZ-036 | Premium-Ausnahme fuer spaete Stornierung anwenden | 2 | done | docs/spec.md BR4 | Implementiert in `src/app/api/bookings/[id]/route.ts` mit testbarer Regel in `src/lib/cancellation-status.ts` |
| FZ-037 | Wartelistenbeitritt bei vollem Kurs | 2 | done | docs/spec.md §1, §2.1 | Implementiert in `src/app/api/bookings/route.ts`; vergibt die naechste Wartelistenposition |
| FZ-038 | Wartelistenpositionen stabil verwalten | 2 | done | docs/spec.md §2.1, BR2 | Implementiert: zentrale Reindex-Logik fuer POST/PUT/DELETE in Waitlist- und Booking-API, Reihenfolge stabil nach Position mit `created_at` als Tie-Breaker |
| FZ-039 | Automatisches Nachruecken bei rechtzeitiger Stornierung | 2 | done | docs/spec.md BR2 | Implementiert in `src/app/api/bookings/[id]/route.ts`; Nachruecker-Logik transaktion und automatisches Reindexen |
| FZ-040 | Nachruecker-Benachrichtigung ausloesen | 2 | done | docs/spec.md BR2 | Implementiert: Trigger nach erfolgreichem Nachruecken in `src/app/api/bookings/[id]/route.ts` ueber `src/lib/notifications.ts` |
| FZ-041 | Admin kann alle Kursbuchungen steuern | 2 | done | docs/spec.md §1 | Implementiert: Admin-UI fuer Buchung anlegen/stornieren/Status setzen in `src/app/bookings/page.tsx` und Status-Update-API in `src/app/api/bookings/[id]/route.ts` |

### Phase 3 - Betriebssicherheit, Sperren & Vertragswarnungen

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-042 | Trainer-Ausfall durch Admin erfassen | 3 | done | docs/spec.md BR1 | Implementiert: Kursstatus `CANCELLED_TRAINER_SICKNESS` inkl. Admin-Aktion in der Kursverwaltung und Buchungsblockade fuer abgesagte Kurse |
| FZ-043 | Limit-Kulanz bei Trainer-Ausfall gutschreiben | 3 | done | docs/spec.md BR1 | Implementiert: Monatslimit zaehlt bestaetigte Buchungen auf wegen Trainerausfall abgesagten Kursen nicht mehr mit |
| FZ-044 | 5,00 EUR Late-Cancellation-Gebuehr buchen | 3 | done | docs/spec.md BR4 | Implementiert: Bei `CANCELLED_LATE` werden 500 Cent inkl. Buchungszeitpunkt an der Buchung persistiert; Premium bleibt gebuehrenfrei |
| FZ-045 | Kundenkonto fuer Gebuehren/Posten modellieren | 3 | done | docs/spec.md BR4, BR7 | Implementiert: `CustomerAccountEntry`-Ledger mit Referenzen auf Buchungen/PT-Slots; Late-Cancellation schreibt atomar `PENDING`-Posten in der Booking-Stornotransaktion |
| FZ-046 | No-Shows als `NO_SHOW` markieren | 3 | done | docs/spec.md BR5 | Implementiert: Booking-Status-Update erlaubt `NO_SHOW` nur fuer bereits gestartete Kurse und nur aus `CONFIRMED`; abgedeckt durch API-Tests in `src/app/api/bookings/[id]/route.test.ts` |
| FZ-047 | Drei No-Shows in Folge erkennen | 3 | done | docs/spec.md BR5 | Implementiert: Sequenzlogik bei `NO_SHOW`-Statusupdate inkl. API-Metadaten `noShowStreak` und `hasThreeNoShowsInRow` |
| FZ-048 | 14-Tage-Neubuchungssperre setzen | 3 | done | docs/spec.md BR5 | Implementiert: Prisma-Modell `NoShowRestriction` (memberId unique, startedAt, expiresAt); PUT `/api/bookings/[id]` setzt Sperre via upsert nach 3 aufeinanderfolgenden No-Shows; siehe `docs/decisions.md` fuer Entwurfsbgruendung |
| FZ-049 | Neubuchungen waehrend aktiver Sperre blockieren | 3 | done | docs/spec.md BR5 | Implementiert: POST `/api/bookings` prueft auf aktive `NoShowRestriction` bevor andere Validierungen greifen; HTTP 403 mit aussagekraeftiger Fehlermeldung (Verfallsdatum) bei aktiver Sperre |
| FZ-050 | Aktuelle Sperren im Admin-Dashboard anzeigen | 3 | done | docs/spec.md §1, BR5 | Implementiert: GET `/api/restrictions` filtert und liefert aktive Sperren; Admin-Seite `src/app/restrictions/page.tsx` zeigt Tabelle; DELETE `/api/restrictions/[id]` erlaubt manuelles Aufheben durch Lisa |
| FZ-051 | Taegliche Vertragsende-Pruefung einrichten | 3 | done | docs/spec.md BR8 | Implementiert: GET `/api/jobs/contract-end-check` plus UTC-stabile Kandidatenlogik in `src/lib/contract-end-reminders.ts`, inkl. optionalem `CRON_SECRET`-Schutz |
| FZ-052 | Erinnerung 14 Tage vor Vertragsende senden | 3 | done | docs/spec.md BR8 | Implementiert: Job `GET /api/jobs/contract-end-check` versendet 14-Tage-Erinnerungen ueber `src/lib/notifications.ts`; API-Test in `src/app/api/jobs/contract-end-check/route.test.ts` erweitert |
| FZ-053 | Erinnerung 3 Tage vor Vertragsende senden | 3 | done | docs/spec.md BR8 | Implementiert: Job `GET /api/jobs/contract-end-check` versendet jetzt auch 3-Tage-Erinnerungen ueber `src/lib/notifications.ts`; API-Test in `src/app/api/jobs/contract-end-check/route.test.ts` erweitert |
| FZ-054 | Vertragsende-Warnliste im Admin-Dashboard | 3 | done | docs/spec.md BR8 | Implementiert: Startseite zeigt Lisa eine Warnliste fuer Vertraege mit Ende in 14 bzw. 3 Tagen auf Basis der bestehenden Vertragsende-Logik |

### Phase 4 - Personal Training & Abrechnung

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-055 | `PersonalTrainingBooking`-Entitaet modellieren | 4 | done | docs/spec.md §2.1, §3 | Implementiert: Prisma-Modell, API (`src/app/api/personal-training/*`) und Admin-UI (`src/app/personal-training/page.tsx`) mit CRUD, Status- und Abrechnungsverwaltung |
| FZ-056 | Trainer/PT-Slots als `AVAILABLE` anlegen | 4 | done | docs/spec.md BR7 | Implementiert: `POST /api/personal-training` legt freie Slots mit `status = AVAILABLE` an, inkl. Pflichtfeld-, Zeit- und Ueberschneidungspruefung; abgedeckt durch `src/app/api/personal-training/route.test.ts` |
| FZ-057 | Mitglieder sehen freie PT-Slots | 4 | done | docs/spec.md §1, BR7 | Implementiert: API-Filter fuer verfuegbare kommende PT-Slots (`GET /api/personal-training?onlyAvailable=true`) und Anzeige im Member-Profil (`src/app/profile/page.tsx`) |
| FZ-058 | PT-Slot direkt fest buchen | 4 | done | docs/spec.md BR7 | Implementiert: Member-Profil bucht freie PT-Slots direkt via `PUT /api/personal-training/[id]`; API erzwingt aktives Mitglied und atomaren `AVAILABLE` -> `BOOKED`-Uebergang |
| FZ-059 | Trainer ueber PT-Buchung benachrichtigen | 4 | done | docs/spec.md BR7 | Implementiert: Push/In-App/E-Mail via `notificationDispatcher.sendPersonalTrainingBookingNotification()` bei erfolgreicher Buchung in `src/app/api/personal-training/[id]/route.ts` |
| FZ-060 | Trainerabsage bis 24 Stunden vorher erlauben | 4 | done | docs/spec.md BR7 | Implementiert: `PUT /api/personal-training/[id]` erzwingt Trainerabsage nur fuer gebuchte Slots mit mindestens 24h Vorlauf; Tests in `src/app/api/personal-training/route.test.ts` |
| FZ-061 | Premium-Inklusivslot pro Monat erkennen | 4 | done | docs/spec.md BR7 | Implementiert: serverseitige Erkennung pro Slot-Monat in `PUT /api/personal-training/[id]`, Rueckgabe als `premiumPtSlotRecognition` und Member-Hinweis im Profil |
| FZ-062 | PT-Buchung als freien Premium-Slot markieren | 4 | done | docs/spec.md BR7 | Implementiert: Direkte PT-Buchung setzt `isFreePremiumSlot` automatisch anhand der Premium-Prüfung |
| FZ-063 | Kostenpflichtige PT-Slots mit Trainer-Stundensatz buchen | 4 | done | docs/spec.md BR7 | Implementiert: Bei PT-Direktbuchung wird fuer nicht freie Premium-Slots ein `CustomerAccountEntry` vom Typ `PERSONAL_TRAINING_CHARGE` mit Betrag aus `Trainer.hourly_pt_rate` (in Cents) angelegt; getestet in `src/app/api/personal-training/route.test.ts` |
| FZ-064 | PT-Billing-Status `PENDING` setzen | 4 | done | docs/spec.md BR7 | Implementiert: PT-Direktbuchung setzt `billingStatus` fachlich abgeleitet auf `PENDING` fuer kostenpflichtige Slots bzw. `PAID` fuer freie Premium-Slots; API-Tests in `src/app/api/personal-training/route.test.ts` erweitert |
| FZ-065 | Admin-Dashboard fuer offene PT-Posten | 4 | done | docs/spec.md §1, BR7 | Implementiert: Startseite zeigt offenen PT-Posten-Block mit Anzahl, Gesamtsumme und Detailliste aller `PENDING`-PT-Posten inkl. Mitglied, Slot und Trainer; Link zur PT-Verwaltung vorhanden |
| FZ-066 | Monatsabschluss-Liste fuer SEPA-Einzug | 4 | validated | docs/spec.md BR7 | Offene Posten export-/sichtbar machen |
| FZ-067 | PT-Posten nach Export auf `BILLED_TO_ACCOUNT` setzen | 4 | validated | docs/spec.md BR7 | Nach SEPA-Vorbereitung |

### Phase 5 - Online-Videos & Zugriff

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-068 | `Video`-Entitaet modellieren | 5 | validated | docs/spec.md §2.1 | Titel, URL, Kategorie, Created At |
| FZ-069 | Admin-CRUD fuer Videos | 5 | validated | docs/spec.md §1, §2.1 | Videos verwalten |
| FZ-070 | Member-Videomediathek anzeigen | 5 | validated | docs/spec.md §1 | Videos streamen |
| FZ-071 | Videozugriff nach Tarif pruefen | 5 | validated | docs/spec.md §2.1, §3 | `has_video_access` |
| FZ-072 | Video-Streaming ueber `video_url` integrieren | 5 | validated | docs/spec.md §1, §2.1 | Player/Einbettung je nach Provider |

### Phase 6 - Zukunftsausblick & Haertung

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| FZ-073 | QR-Check-In-Datenmodell vorbereiten | 6 | hypo | docs/spec.md §1, §5 | Zukunftsausblick |
| FZ-074 | Check-In-Platzhalter in Member-App | 6 | hypo | docs/spec.md §1, §5 | Spaeter QR-Code an Studiotuer |
| FZ-075 | Admin-Sicht fuer Check-In-Faehigkeit vorbereiten | 6 | hypo | docs/spec.md §1, §5 | Noch kein MVP-Kern |
| FZ-076 | Security-Audit fuer Rollen und sensible Daten | 6 | hypo | docs/spec.md §1, §2.1 | SEPA/IBAN, Adminrechte, Memberdaten |
| FZ-077 | Timezone-Tests fuer Kurse, Fristen und Vertragsende | 6 | hypo | docs/spec.md BR3, BR4, BR8 | Kritische Grenzfaelle |
| FZ-078 | Race-Condition-Tests fuer Buchung und Warteliste | 6 | hypo | docs/spec.md BR1, BR2 | Ueberbuchung verhindern |

## Workflow

- Neues Feature: naechste freie ID vergeben, Status `hypo`.
- Validiertes Feature: Status `validated`, Quelle/Notiz ergaenzen.
- Umsetzung: Status `in-progress`, Branch/Session in Notiz.
- Fertig: Status `done`, Commit/Version in Notiz.
- Verworfen: Status `killed`, Entscheidung in `docs/decisions.md` dokumentieren.
