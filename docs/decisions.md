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

## 2026-07-06 - FZ-016 Admin-CRUD fuer Membership-Tarife umgesetzt

**Kontext:** Lisa braucht eine zentrale Tarifpflege für Basic, Plus und Premium. Tarife sollen nicht nur Preise, sondern auch Buchungsfenster, Videozugriff, Spätstorno-Regeln und inklusive PT-Slots abbilden.

### Entscheidung

FZ-016 wird als Admin-CRUD für das bereits bestehende Prisma-Modell `MembershipTier` umgesetzt. Die Umsetzung umfasst:
- API-Route-Handler in `src/app/api/tiers/route.ts` und `src/app/api/tiers/[id]/route.ts`
- Admin-UI in `src/app/tiers/page.tsx` für Anlegen, Bearbeiten, Löschen
- vorbefüllte Standardtarife via `src/lib/member-seed.ts` und `ensureDefaultMembershipTiers()`

### Alternativen verworfen

- Nur Datenmodell ohne Admin-UI: bietet keinen direkten Nutzen für Lisa.
- Separater Tarif-Service: zu hoher Architekturaufwand für Phase 1 und inkonsistent mit dem bestehenden Next.js-App-Router-Ansatz.

### Konsequenzen

- Positiv: Tarife können nun produktiv im Adminbereich verwaltet werden.
- Die Tarifdaten sind als zentrale Basis für Buchungsfenster, Videozugriff und PT-Abrechnung verfügbar.
- Die Umsetzung bleibt konsistent mit dem bestehenden Prisma/Next.js-Stack.

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

## 2026-07-06 - FZ-017 Admin-CRUD fuer Trainer abgeschlossen

**Kontext:** Die Trainerverwaltung benötigt eine produktive Admin-Lösung inklusive PT-Stundensatz, damit Maria Trainerdaten einfach pflegen und spätere PT-Abrechnung unterstützen kann.

### Entscheidung

FZ-017 wird als Admin-CRUD mit Next.js App-Router API-Routen (`src/app/api/trainers`, `src/app/api/trainers/[id]/route.ts`) und einer Adminseite (`src/app/trainers/page.tsx`) umgesetzt. Die API validiert Pflichtfelder und speichert `hourlyPtRate` als Decimal.

### Konsequenzen

- Lisa kann Trainer jetzt produktiv anlegen, bearbeiten und löschen.
- Der PT-Stundensatz steht direkt für spätere Personal-Training-Abrechnung bereit.
- Die Umsetzung bleibt konsistent mit dem bestehenden Prisma/Next.js-Stack.

---

## 2026-07-06 - FZ-011 `CourseType` Datenmodell & FZ-018 Admin-CRUD umgesetzt

**Kontext:** `CourseType` war im Datenmodell spezifiziert (siehe `docs/spec.md §2.1`) und bildet die Grundlage für Kursplanung, Trainerqualifikationen und Kursverwaltung.

### Entscheidung

FZ-011 wurde als Prisma-Datenmodell für `CourseType` umgesetzt. Aufbauend darauf wurde FZ-018 als Admin-CRUD ergänzt: ein Prisma-Modell `CourseType` bleibt Quelle der Wahrheit, ergänzt durch Next.js Route-Handler (`GET`/`POST` auf Collection, `PUT`/`DELETE` auf Einzelressource) und eine einfache Admin-Oberfläche für Lisa zum Anlegen, Bearbeiten und Löschen von Kursarten.

Wesentliche Dateien der Umsetzung:
- `src/app/api/course-types/route.ts` (GET, POST)
- `src/app/api/course-types/[id]/route.ts` (PUT, DELETE)
- `src/app/course-types/page.tsx` (Admin-UI CRUD)

### Alternativen verworfen
- Nur Datenmodell ohne API/UI: liefert keinen sofortigen Nutzen für Admins.
- GraphQL statt REST: zusätzlicher Aufwand, inkonsistent mit bestehenden Route-Handlern im App-Router.

### Konsequenzen
- Positiv: Lisa kann Kursarten jetzt direkt im Produkt verwalten; Kursplanung und weitere Features (z. B. `TrainerQualification`, `Course`) können `CourseType` referenzieren.
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

## 2026-07-06 - FZ-020 Admin-CRUD fuer Räume umgesetzt

**Kontext:** Lisa braucht eine Admin-Sicht fuer Räume, damit Kurstermine einem eindeutigen Raum zugeordnet werden können. Die Raumverwaltung muss Raumnamen speichern, ändern und löschen können.

### Entscheidung

FZ-020 wird als vollständiger Admin-CRUD für das Prisma-Modell `Room` umgesetzt. Die Umsetzung umfasst:

- Prisma-Datenmodell `Room` mit eindeutiger `name`-Spalte in `prisma/schema.prisma`.
- API-Route-Handler in `src/app/api/rooms/route.ts` und `src/app/api/rooms/[id]/route.ts` für GET/POST/PUT/DELETE.
- Admin-Oberfläche in `src/app/rooms/page.tsx` zur Auflistung, Anlage, Bearbeitung und Löschung von Räumen.
- Verlinkung des Raum-Moduls aus der zentralen App-Startseite `src/app/page.tsx`.

### Alternativen verworfen

- Nur ein Datenmodell ohne Admin-UI: bietet keinen direkten Nutzen für den täglichen Studio-Betrieb.
- Raumverwaltung nur über Kurs-Formulare: zu umständlich und nicht konsistent mit anderen Stammdaten-CRUDs.

### Konsequenzen

- Lisa kann Räume jetzt produktiv im Adminbereich verwalten.
- Räume stehen als Referenz für Kursplanung und Kapazitätssteuerung bereit.
- Das Feature ist abgeschlossen und schließt den Backlog-Eintrag FZ-020 ab.

### Nächste Schritte

- Implementierung einer Admin-CRUD-API und einfacher Admin-UI fuer `TrainerQualification` (FZ-019).
- Serverseitige Erzwingung der Qualifikation beim Anlegen von Kursen (FZ-023) bereits in Planung.

## 2026-07-06 - FZ-019 Admin-CRUD fuer Trainerqualifikationen umgesetzt

**Kontext:** FZ-019 erweitert die Datenmodell-Umsetzung von `TrainerQualification` um eine operable Admin-Verwaltung. Lisa muss Trainer/Kursart-Zuordnungen direkt im Produkt pflegen können, damit später bei der Kursplanung nur passende Trainer angeboten werden.

### Entscheidung

FZ-019 wurde als neues Admin-Modul umgesetzt. Technische Eckpunkte:

- Neue API-Routen unter `src/app/api/trainer-qualifications` für `GET`, `POST`, `DELETE`.
- Neue Admin-UI unter `src/app/trainer-qualifications/page.tsx` mit Formular zum Anlegen und Liste zum Löschen bestehender Qualifikationen.
- Die Startseite (`src/app/page.tsx`) wurde um einen Verweis auf das neue Modul ergänzt.
- `docs/backlog.md` wurde auf `done` gesetzt für FZ-019.

### Alternativen verworfen

- Nur Backend-CRUD ohne Admin-Oberfläche: schlechte Usability für Lisa und kein schneller Mehrwert.
- Trainerqualifikationen als statische Konfiguration statt persistenter Entität: erhöhtes Fehler- und Pflegepotenzial.

### Konsequenzen

- Positiv: Lisa kann Qualifikationen im Produkt pflegen, die spätere Kursplanung nutzt.
- Positiv: Das System bleibt konsistent mit bestehendem App-Router-CRUD-Pattern und dem Prisma-Datenmodell.
- Risiko: Die aktuelle Version implementiert noch keine serverseitige Filterung des Trainer-Dropdowns in `Course`-Formularen; das ist als nächster Schritt FZ-022/FZ-023 vorgesehen.

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

## 2026-07-06 - FZ-014 `Course`-Entitaet und Admin-CRUD umgesetzt

**Kontext:** Das System hatte bereits `CourseType`, `Trainer`, und `Room` als Stammdaten, aber noch keine produktive Kursplanung für Lisa. Für FZ-014 muss ein Kurstermin mit Kursart, Start/Ende, Kapazität, Raum und Trainer administrierbar sein.

### Entscheidung

FZ-014 wird als vollständige Admin-CRUD-Funktion umgesetzt. Dazu wurden neue Next.js App Router API-Routen unter `src/app/api/courses` (`GET`, `POST`, `PUT`, `DELETE`) sowie eine Admin-Oberfläche `src/app/courses/page.tsx` hinzugefügt. Die UI erlaubt die Auswahl von Kursart, Trainer, Raum, Startzeit, Endzeit und maximaler Teilnehmerzahl.

### Alternativen verworfen

- Nur Schema-Erweiterung ohne produktive Admin-UI: Das Feature würde keinen direkten Nutzen für Lisa liefern.
- Separate Server-API außerhalb des App-Routers: Mit dem vorhandenen Next.js-Stack wäre das unnötig komplex.

### Konsequenzen

- Positiv: Kurstermine können jetzt direkt im Produkt angelegt, bearbeitet und gelöscht werden. Die Implementierung ist konsistent zur vorhandenen CRUD-Architektur.
- Risiko: Die aktuelle Version prüft noch nicht serverseitig die Trainerqualifikation für die Kursart; diese Validierung wird mit FZ-023 ergänzt.
- Operativ: Vor weitergehender Kurslogik sollten Integrationstests für Kursdaten und die späteren Buchungsregeln erstellt werden.

## 2026-07-06 - FZ-015 Admin-CRUD für Mitglieder umgesetzt

**Kontext:** Für Lisa muss der Admin-Zugang zur Mitgliederverwaltung vollständig sein, inklusive Stammdaten, Vertragsende und Status. Das System hatte bereits das `Member`-Datenmodell, aber noch keine konsistente Admin-CRUD-Funktion für Members.

### Entscheidung

FZ-015 wird als vollständiges Admin-CRUD umgesetzt. Die Umsetzung umfasst:
- `src/app/api/members/route.ts` mit `GET` und `POST`
- `src/app/api/members/[id]/route.ts` mit `GET`, `PUT` und `DELETE`
- `src/app/members/page.tsx` als Admin-UI mit Formular für Anlegen/Bearbeiten und Liste der Mitglieder
- Anzeige und Persistenz von `contractEndDate` und `status`

### Alternativen verworfen

- Nur Datenmodell ohne Admin-UI: zu wenig nutzbarer Mehrwert für Lisa.
- Member-Verwaltung in einem separaten Backend-Service: zu viel Aufwand für den bestehenden Next.js MVP-Stack.

### Konsequenzen

- Positiv: Der Admin kann Mitglieder jetzt produktiv anlegen, editieren und löschen.
- Positiv: Die Datenbasis für spätere Sperren und Vertragswarnungen ist damit lückenlos vorhanden.
- Operativ: Für weitere Features wie Buchungslimits, No-Show-Sperren und Vertragsende-Reminder kann `Member.contractEndDate` nun zuverlässig genutzt werden.

