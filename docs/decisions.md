# decisions.md - Architektur- und Produktentscheidungen

_Chronologisches Log aller Architektur- und Produktentscheidungen._

## 2026-07-03 - Next.js mit SQLite und Prisma als initialer Stack

**Kontext:** Fuer FZ-001 und FZ-007 braucht das Projekt ein lauffaehiges Web-App-Geruest und eine relationale Datenbasis, die die Business Rules aus `docs/spec.md` transaktionssicher vorbereiten kann.

### Entscheidung

Das Projekt startet mit Next.js 16 App Router, TypeScript, SQLite und Prisma 7. Prisma nutzt lokal den SQLite-Adapter `@prisma/adapter-better-sqlite3`; der Prisma Client wird nach `src/generated/prisma` generiert. Node.js `>=20.19.0` ist die Mindestversion.

### Alternativen verworfen

- Separates Backend/API-Projekt: fuer den MVP-Start und Solo-Workflow zu viel Betriebs- und Strukturaufwand.
- PostgreSQL direkt zum Start: fachlich spaeter gut moeglich, aber fuer lokale Iteration und initiales Scaffolding schwerer als noetig.
- ORM-freie SQLite-Nutzung: erhoeht Risiko bei Relationen, Decimal-Feldern und spaeteren Migrationen.

### Konsequenzen

- Ein einzelnes Next.js-Projekt kann UI, Serverlogik und Datenzugriff buendeln.
- SQLite macht lokale Entwicklung einfach, erfordert aber besondere Aufmerksamkeit bei Nebenlaeufigkeit und spaeterem Hosting.
- Prisma-Migrationen werden die technische Wahrheit fuer das relationale Schema.
- Ein spaeterer Wechsel auf PostgreSQL bleibt moeglich, muss wegen SQLite-spezifischer Details separat entschieden und migriert werden.

---

## 2026-06-26 - Modus Operandi fuer Solo-Projekt eingefuehrt

**Kontext:** Das Projekt hatte eine fachliche Spezifikation, aber noch keine AI-lesbare Arbeitsstruktur.

### Entscheidung

Das Projekt wird als Solo-Projekt nach der Modus-Operandi-Methodik organisiert:

- Root-Briefing: `CLAUDE.md` plus `AGENTS.md`
- Projektartefakte: `docs/spec.md`, `docs/architecture.md`, `docs/backlog.md`, `docs/decisions.md`
- Arbeitsordner: `docs/concepts/`, `docs/audit/`
- Keine `docs/INBOX.md`, solange keine parallelen Doc-Edits aus mehreren Worktrees/Maschinen auftreten.

### Alternativen verworfen

- Nur Root-`spec.md` behalten: zu wenig Kontext fuer wiederholte AI-Sessions.
- Team-Struktur mit Mission-Dokumenten: fuer Solo-Projekt unnoetig schwer.

### Konsequenzen

- AI-Sessions haben einen stabilen Einstiegspunkt und muessen nicht aus der Rohspezifikation raten.
- Features erhalten stabile IDs (`FZ-NNN`) fuer Commits, Konzepte und Entscheidungen.
- Dokumente muessen am Session-Ende gepflegt werden, sonst entsteht Drift.

---

## 2026-07-05 - FZ-008 als nutzbare Member-Verwaltung umgesetzt

**Kontext:** Das Projekt hatte das Datenmodell fuer `Member` bereits vorbereitet, aber noch keine echte Verwaltungsfunktion fuer Lisa im Produkt.

### Entscheidung

FZ-008 wird direkt als einfache, nutzbare Mitgliederverwaltung umgesetzt: Mitglieder koennen ueber eine Admin-Ansicht angelegt, bearbeitet und geloescht werden. Die Persistenz erfolgt ueber das bestehende Prisma-Modell, die Datenpflege ueber Next.js Route-Handler und eine einfache UI im App-Router.

### Alternativen verworfen

- Nur Datenmodell ohne UI und API: zu wenig nutzbarer Mehrwert fuer den Admin-Workflow.
- Separater Backend-Service fuer Mitgliederverwaltung: fuer den aktuellen MVP-Stand zu aufwendig und nicht notwendig.

### Konsequenzen

- FZ-008 ist jetzt nicht nur spezifiziert, sondern im Produkt verwendbar.
- Die Basis fuer spaetere Features wie Buchungen, Sperren und Vertragswarnungen ist sauber vorhanden.
- Die Implementation bleibt bewusst klein und fokussiert auf die Kernanforderungen aus `docs/spec.md`.

---

## 2026-07-06 - FZ-009 MembershipTier als Tarifmodell implementiert

**Kontext:** Das System brauchte einen zentralen Membership-Tarif, um Preise, Buchungsfenster, Videorechte, Spätstorno-Regeln und Premium-PT-Slots abzubilden.

### Entscheidung

FZ-009 wird als Prisma-Modell `MembershipTier` mit den Feldern `monthlyPrice`, `maxCoursesPerMonth`, `hasVideoAccess`, `bookingWindowDays`, `hasFreeLateCancellation` und `includedPtSlotsPerMonth` umgesetzt. Dazu wurde ein Admin-CRUD in `src/app/tiers/page.tsx` sowie REST-Route-Handler in `src/app/api/tiers` angelegt. Standardtarife werden über `ensureDefaultMembershipTiers()` vorbefuellt.

### Alternativen verworfen

- Nachtraegliches nur datenbankseitiges Modell ohne UI: zu wenig sofort nutzbarer Wert fuer den Admin.
- Separates Tarifservice-Modul: zu viel Architekturaufwand fuer Phase 1 und inkonsistent mit dem bestehenden Next.js-App-Router-Ansatz.

### Konsequenzen

- Die Tariflogik ist jetzt im System vorhanden und kann von Mitgliedern, Kursen und späteren Buchungsregeln referenziert werden.
- Admins koennen Membership-Tarife direkt verwalten, ohne Code- oder DB-Eingriffe.
- Die Implementierung bleibt konsistent mit dem vorhandenen Prisma/Next.js-Stack und legt die Grundlage fuer FZ-016, FZ-028 und weitere Buchungsregeln.

---

## 2026-07-06 - FZ-010 Trainer-Entitaet und Admin-CRUD eingefuehrt

**Kontext:** Das Modell fuer Trainer musste auf die vorhandene Kurs- und PT-Planung vorbereitet werden, damit Lisa Trainer mit E-Mail-Adresse und stundenbasiertem Personal-Training-Satz verwalten kann.

### Entscheidung

FZ-010 wird als Prisma-Modell `Trainer` umgesetzt und um einfache Admin-CRUD-Endpoints erweitert. Dazu wurden neue Next.js API-Route-Handler in `src/app/api/trainers` hinzugefügt und eine Admin-Oberfläche in `src/app/trainers/page.tsx` implementiert.

### Alternativen verworfen

- Nur Datenmodell ohne Admin-UI: zu wenig direkt nutzbarer Wert für das MVP.
- Trainerverwaltung per DB-Seeding oder externem Tool: zu unpraktisch für Lisas tägliches Management.

### Konsequenzen

- Lisa kann Trainer jetzt direkt im Produkt anlegen, bearbeiten und löschen.
- Das System hat eine klare Basis für spätere Features wie Kursplanung, Trainerqualifikationen und PT-Abrechnung.
- Die Implementierung bleibt konsistent mit dem bestehenden Next.js/Prisma-Stack und fügt kein neues Backend-Pattern hinzu.

---

## 2026-07-06 - FZ-011 `CourseType` CRUD und Admin-UI umgesetzt

**Kontext:** `CourseType` war im Datenmodell spezifiziert (siehe `docs/spec.md §2.1`) aber noch nicht via API oder Admin-UI verfügbar. Für Kursplanung, Trainer-Qualifikationen und Kurs-CRUD braucht das System eindeutige Kursarten.

### Entscheidung

FZ-011 wird als schlankes, aber produktives Feature umgesetzt: ein Prisma-Modell `CourseType` bleibt Quelle der Wahrheit (bereits im Schema vorhanden), ergänzt durch Next.js Route-Handler (`GET`/`POST` auf Collection, `PUT`/`DELETE` auf Einzelressource) und eine einfache Admin-Oberfläche für Lisa zum Anlegen, Bearbeiten und Löschen von Kursarten.

Wesentliche Dateien der Umsetzung:
- `src/app/api/course-types/route.ts` (GET, POST)
- `src/app/api/course-types/[id]/route.ts` (PUT, DELETE)
- `src/app/course-types/page.tsx` (Admin-UI CRUD)

### Alternativen verworfen
- Nur Datenmodell ohne API/UI: liefert keinen sofortigen Nutzen für Admins.
- GraphQL statt REST: zusätzlicher Aufwand, inkonsistent mit bestehenden Route-Handlern im App-Router.

### Konsequenzen
- Positiv: Lisa kann Kursarten sofort im Produkt verwalten; Kursplanung und weitere Features (z. B. `TrainerQualification`, `Course`) können `CourseType` referenzieren.
- Risiko: Eindeutigkeit wird durch Prisma-Constraint (`name` unique) gesichert; UI und API behandeln Fehlerfälle konservativ und liefern klare Fehlermeldungen.
- Operativ: Bitte nach dem Deploy `npm run prisma:generate`/Migrations-Checks ausführen, falls Schemaänderungen folgen.


<!-- Vorlage fuer neue Entscheidungen:

## JJJJ-MM-TT - Titel der Entscheidung

**Kontext:** Warum mussten wir entscheiden?

### Entscheidung
Was haben wir entschieden?

### Alternativen verworfen
- Option A: Warum nicht?
- Option B: Warum nicht?

### Konsequenzen
- Positiv
- Negativ / Risiken

-->

## 2026-07-06 - FZ-012 `TrainerQualification` (n:m) als relationale Entität umgesetzt

**Kontext:** Das System braucht eine robuste Zuordnung, welche `Trainer` welche `CourseType` unterrichten dürfen. Diese Information ist Grundlage fuer sichere Kursplanung (BR6) und spätere UI-Filter/Validierungen.

### Entscheidung

Die Zuordnung wird als eigenstaendiges Prisma-Modell `TrainerQualification` umgesetzt (Join-Tabelle). Technische Eckpunkte:

- Relationale Modellierung in `prisma/schema.prisma` mit Feldern `trainerId` und `courseTypeId` und einer zusammengesetzten Unique-Constraint `@@unique([trainerId, courseTypeId])`.
- Fremdschluessel-Relationen auf `Trainer` und `CourseType` mit `onDelete: Cascade`.
- Prisma Client wurde generiert unter `src/generated/prisma`, CRUD-Operationen stehen via `prisma.trainerQualification` zur Verfuegung.

### Alternativen verworfen

- Denormalisierte Liste von `courseTypeId`s als JSON-Feld im `Trainer`-Modell: einfacher, aber schwieriger zu validieren, indexieren und zu referenzieren in Prisma/SQL.
- Tag-/String-basiertes Mapping: weniger strenge Datenintegritaet, hohes Fehlerpotential bei Umbenennungen/Refactorings.

### Konsequenzen

- Positiv: Sauberes, normalisiertes Datenmodell erleichtert serverseitige Validierung, eindeutige Constraints verhindern doppelte Eintraege.
- Erfordert noch Admin-CRUD und UI-Filter (siehe FZ-019, FZ-022) damit Lisa Qualifikationen pflegen und der Trainer-Dropdown in der Kursplanung korrekt gefiltert wird.
- Operativ: Bei Schema-Änderungen `prisma migrate` / `prisma generate` ausführen; lokale DB-Migrationen pruefen bevor auf Produktionsdaten umgestellt wird.

### Nächste Schritte

- Implementierung einer Admin-CRUD-API und einfacher Admin-UI fuer `TrainerQualification` (FZ-019).
- Serverseitige Erzwingung der Qualifikation beim Anlegen von Kursen (FZ-023) bereits in Planung.

## 2026-07-06 - FZ-013 `Room`-Entitaet als Admin-CRUD umgesetzt

**Kontext:** Das Datenmodell spezifiziert bereits `Room` als Kernentität für die Kursplanung, aber es fehlte eine produktive Admin-Verwaltung für Räume.

### Entscheidung

FZ-013 wird als vollständige Admin-CRUD-Funktion umgesetzt. Der Prisma-Client nutzt das bestehende `Room`-Modell mit dem eindeutigen `name`-Feld. Dazu wurden neue Next.js App Router API-Routen unter `src/app/api/rooms` und eine Admin-Seite `src/app/rooms/page.tsx` ergänzt.

### Alternativen verworfen

- Nur Schema-Erweiterung ohne UI: Zu wenig nutzbarer Mehrwert, da die Raumverwaltung für Kursplanung direkt im Admin-Produkt verfügbar sein muss.
- Raumdaten per Seeder oder externem Tool pflegen: Unpraktisch für Lisas laufenden Studiobetrieb und nicht konsistent mit dem restlichen App-Router-CRUD-Ansatz.

### Konsequenzen

- Positiv: Räume können jetzt im Produkt angelegt, bearbeitet und gelöscht werden. Das System ist bereit für Kursplanung mit Raum-Referenzen.
- Risiken: Die Raumverwaltung bleibt aktuell einfach gehalten; zusätzliche Validierung für Raumnamen und Konfliktbehandlung kann später ergänzt werden.
- Operativ: Nach Änderungen an `Room` im Prisma-Schema sollte `prisma generate` im lokalen Setup sichergestellt werden.

