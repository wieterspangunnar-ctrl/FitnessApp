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

## 2026-07-08 - FZ-027 Kurskalender für Mitglieder im Profil umgesetzt

**Kontext:** Für das Tarifsystem muss ein Mitgliedskurskalender sichtbar sein, der die verfügbaren Kurse entsprechend dem Buchungsfenster des aktuellen Tarifs anzeigt. FZ-027 ist Teil der Member-Funktionalität und soll die Kursübersicht für Mitglieder verfügbar machen.

### Entscheidung
Die Member-Profilseite wurde um einen kursbasierten Kalender ergänzt. Die Umsetzung nutzt bestehende API-Routen für `profile` und `courses` und filtert Kurse clientseitig nach dem aktuellen Datum sowie `bookingWindowDays` des Mitgliedstarifs.

### Alternativen verworfen
- Eigene Timeline-/Kalenderkomponente mit externem Paket: Zu großer Aufwand für die MVP-Phase, wenn ein einfacher Listenfilter den Bedarf deckt.
- Serverseitige Vorausberechnung in der Profil-API: Gute Alternative, aber für FZ-027 war der Fokus auf kleine Änderungen und Wiederverwendung bestehender Endpunkte.

### Konsequenzen
- Mitglieder sehen nun direkt im Profil einen buchungsfenstersensitiven Kurskalender.
- Die Lösung bleibt lean und verwendet keine zusätzlichen UI-Bibliotheken.
- Spätere Features wie direkte Buchung oder Kalenderansicht können auf den vorhandenen `courses`-Daten aufbauen.

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

## 2026-07-08 - FZ-032 Tariflimit-Blockade für Buchungen umgesetzt

**Kontext:** Gemäß BR1 soll eine neue Kursbuchung verhindert werden, sobald ein Mitglied im aktuellen Kalendermonat das monatliche Buchungslimit seines Tarifplans erreicht hat. Diese Regel ist für Basic-Tarife besonders relevant, wo das Limit typischerweise bei 5 liegt.

### Entscheidung

FZ-032 wird als serverseitige Prüfung in der Buchungs-API umgesetzt. Vor dem Anlegen einer Buchung wird das aktuelle Monatsbuchungskonto des Mitglieds ermittelt und mit dem `maxCoursesPerMonth`-Wert des zugehörigen Tarifs verglichen. Sobald das Limit erreicht ist, wird die Buchung mit einem klaren Fehler abgewiesen und kein weiterer Buchungs- oder Wartlisten-Eintrag erzeugt.

### Alternativen verworfen

- Nur clientseitige Blockade in der UI: zu wenig robust, weil Buchungen auch über API- oder zukünftige Frontends möglich wären.
- Keine zentrale Prüfungslogik: die Regel wäre an mehreren Stellen dupliziert und schwerer wartbar.

### Konsequenzen

- Buchungen sind jetzt konsistent an die Tariflimits gebunden.
- Die Regel lässt sich leicht erweitern, wenn später zusätzliche Tariflogiken oder Sonderfälle hinzukommen.
- Die Umsetzung ist bewusst klein gehalten und nutzt die bestehende Prisma-/Next.js-Architektur weiter.

---

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

---

## 2026-07-08 - FZ-029 Kursdetails mit Kapazität sichtbar gemacht

**Kontext:** Die Kursübersichten mussten für Lisa und Mitglieder sofort erkennen lassen, wie viele freie Plätze noch verfügbar sind. Die Spezifikation verlangt dazu eine sichtbare Kapazitätsdarstellung, ohne dafür ein neues Datenmodell oder ein separates Backend-Modul aufzubauen.

### Entscheidung

FZ-029 wird als kleine, datenbasierte Erweiterung der bestehenden Kurs-API umgesetzt. Die API zählt bestätigte Buchungen pro Kurs und berechnet daraus `availableSpots` für jedes Kurs-Objekt. Diese Informationen werden in der Admin-Kursübersicht und in der Member-Profil-Ansicht angezeigt.

### Alternativen verworfen

- Separate Kapazitäts-Engine oder eigenes Datenmodell: zu viel Aufwand für das MVP und nicht nötig, weil die Buchungsdaten bereits im bestehenden Schema vorliegen.
- Nur Anzeige in der Admin-Ansicht: würde die Anforderung an Mitglieder nicht vollständig abbilden.

### Konsequenzen

- Lisa sieht in der Kursverwaltung direkt, welche Kurse noch freie Plätze haben.
- Mitglieder erhalten in ihrem Profil ebenfalls einen schnellen Überblick über die verfügbare Kapazität.
- Die Lösung bleibt klein, konsistent mit dem bestehenden Prisma/Next.js-Ansatz und lässt sich später um weitere Buchungszustände erweitern.

---

## 2026-07-08 - FZ-028 Buchungsfenster pro Tarif umgesetzt

**Kontext:** Gemäss `docs/spec.md` BR3 darf die Sichtbarkeit von Kursen und die Möglichkeit zur Buchung abhängig vom Tarif des Mitglieds variieren. Die Umsetzung musste deshalb zentral und nachvollziehbar erfolgen, statt nur in der UI nachzubilden.

### Entscheidung

FZ-028 wird als serverseitige, tarifbasierte Buchungsfenster-Logik umgesetzt. Die Regel wird zentral in `src/lib/booking-window.ts` definiert und von den relevanten API-Routen verwendet:

- Die Kursliste für Mitglieder wird nur noch innerhalb des von `MembershipTier.bookingWindowDays` definierten Fensters zurückgegeben.
- Neue Buchungen werden nur noch akzeptiert, wenn der Kurs zum aktuellen Zeitpunkt noch im erlaubten Fenster liegt.
- Die Profilseite nutzt dieselbe Logik, damit die sichtbare Kursübersicht für Mitglieder konsistent bleibt.

### Alternativen verworfen

- Nur clientseitige Filterung in der Profilseite: zu wenig robust, weil Buchungen weiterhin über die API möglich gewesen wären.
- Separate Regeln in jeder UI-Komponente: erhöht Redundanz und Risiko von Inkonsistenzen.

### Konsequenzen

- Die Buchungsfenster-Regel ist jetzt fachlich korrekt und zentral gepflegt.
- Mitglieder können keine Kurse mehr außerhalb ihres Tarif-Fensters buchen.
- Die Lösung lässt sich später leicht auf weitere Member- oder Admin-Flows erweitern.

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

---

## 2026-07-08 - FZ-026 Mitgliederprofil fuer den Member-Bereich umgesetzt

**Kontext:** Gemäss `docs/spec.md` soll ein Mitglied seine eigenen Profil- und Vertragsdaten einsehen können. Im bisherigen Stand war nur die Admin-Verwaltung von Mitgliedern vorhanden, aber keine passende Member-sichtbare Profilansicht.

### Entscheidung

FZ-026 wird als einfache Profilseite im Member-Bereich umgesetzt. Die Umsetzung umfasst:

- Neue Route `src/app/profile/page.tsx` mit einer übersichtlichen Profilansicht für Stammdaten, Tarif und Vertragsdaten.
- Neue API-Route `src/app/api/profile/route.ts`, die ein vorhandenes Mitglied inklusive Tarifinformationen bereitstellt.
- Verlinkung der neuen Profilseite aus der Startseite über `src/app/page.tsx`.

### Alternativen verworfen

- Nur die vorhandene Admin-Mitgliederverwaltung erweitern: würde die Anforderung aus `docs/spec.md` nicht erfüllen, weil das Profil für das Mitglied selbst sichtbar sein muss.
- Ein separates Auth-System oder Rollenmodell für die Profilseite einführen: für den aktuellen MVP-Stand zu aufwendig und nicht Teil der bestehenden Foundation.

### Konsequenzen

- Mitglieder können ihre Kerninformationen jetzt direkt im Produkt einsehen.
- Die Basis für spätere Member-spezifische Funktionen wie Buchungen, Stornierungen und Vertragswarnungen ist erweitert.
- Die Umsetzung bleibt bewusst klein und fokussiert auf die spezifizierte Anforderung aus FZ-026.

## 2026-07-06 - FZ-023 Trainerqualifikation serverseitig erzwungen

**Kontext:** Die Kursplanung hatte bereits eine Filterung im UI, aber keine technische Sicherheitsbarriere. Ein ungültiger Trainer/Kursart-Mix konnte damit trotzdem über die API erzeugt oder geändert werden.

### Entscheidung

FZ-023 wird als serverseitige Validierung umgesetzt. Die API-Endpunkte für Kurse prüfen beim Anlegen und Bearbeiten jetzt direkt über Prisma, ob der gewählte Trainer für die gewählte Kursart qualifiziert ist. Ungültige Kombinationen werden mit einem `400`-Fehler abgelehnt.

### Alternativen verworfen

- Nur UI-Filterung belassen: reicht nicht als Sicherheitsnetz und ist durch direkte API-Aufrufe leicht zu umgehen.
- Validierung nur im Frontend-Formular: nicht ausreichend für Admin- oder Integrationsfälle.

### Konsequenzen

- Positiv: Die Business Rule BR6 ist jetzt auch auf API-Ebene durchgesetzt.
- Die Kurs-API ist damit konsistent mit den bestehenden Admin- und Stammdaten-Workflows und schützt vor fehlerhaften Daten.
- Die Umsetzung bleibt bewusst klein und nutzt das vorhandene Prisma-Modell `TrainerQualification` als Quelle der Wahrheit.

## 2026-07-06 - FZ-021 Admin-Kurstermine planen umgesetzt

**Kontext:** FZ-021 ist erforderlich, damit Lisa Kurstermine im Adminbereich als eigenständiges CRUD-Feature anlegen, bearbeiten und löschen kann. Der Kursplaner muss Kursart, Start/Ende, Kapazität, Raum und Trainer als Pflichtfelder abbilden.

### Entscheidung

FZ-021 wurde als vollständige Kursplanungsfunktion umgesetzt. Technische Eckpunkte:

- Neue Admin-UI in `src/app/courses/page.tsx` mit Formular für `courseTypeId`, `startTime`, `endTime`, `maxParticipants`, `roomId` und `trainerId`.
- Neue API-Endpunkte in `src/app/api/courses/route.ts` und `src/app/api/courses/[id]/route.ts` für `GET`, `POST`, `PUT` und `DELETE`.
- UI und API validieren Pflichtfelder, Datum/Zeit und minimale Teilnehmerzahl.
- Kurse werden mit zugehörigen `CourseType`, `Room` und `Trainer` geladen und über die Admin-Übersicht dargestellt.

### Alternativen verworfen

- Nur ein Datenmodell ohne Admin-Oberfläche: zu wenig direkt anwendbarer Wert für Lisa.
- Externe Kursplanungs-App / separates Backend: unnötiger Architekturaufwand für den MVP und inkonsistent mit dem bestehenden Next.js-App-Router-Ansatz.

### Konsequenzen

- Lisa kann Kurstermine jetzt direkt im Adminbereich planen und verwalten.
- Die Basis für weiterführende Features wie Buchung, Trainerqualifikationsprüfung (FZ-022/FZ-023) und Kursübersicht ist gelegt.
- Die Implementierung bleibt klein, klar und konsistent mit dem aktuellen Prisma/Next.js-Stack.

### Alternativen verworfen

- Nur Backend-CRUD ohne Admin-Oberfläche: schlechte Usability für Lisa und kein schneller Mehrwert.
- Trainerqualifikationen als statische Konfiguration statt persistenter Entität: erhöhtes Fehler- und Pflegepotenzial.

### Konsequenzen

- Positiv: Lisa kann Qualifikationen im Produkt pflegen, die spätere Kursplanung nutzt.
- Positiv: Das System bleibt konsistent mit bestehendem App-Router-CRUD-Pattern und dem Prisma-Datenmodell.
- Risiko: Die aktuelle Version implementiert noch keine serverseitige Filterung des Trainer-Dropdowns in `Course`-Formularen; das ist als nächster Schritt FZ-022/FZ-023 vorgesehen.

## 2026-07-06 - FZ-022 Trainer-Dropdown nach Qualifikation filtern umgesetzt

**Kontext:** FZ-022 ergänzt die Kursplanung, damit im Adminformular nur Trainer auswählbar sind, die für die gewählte Kursart qualifiziert sind. Das reduziert Fehleingaben und passt die UI an den bestehenden `TrainerQualification`-Workflow an.

### Entscheidung

FZ-022 wurde in `src/app/courses/page.tsx` umgesetzt. Technische Eckpunkte:

- Der Trainer-Dropdown wird nach `courseTypeId` basierend auf den geladenen `trainerQualifications` gefiltert.
- Bei geänderter Kursart aktualisiert sich die Trainerliste automatisch.
- Wenn für die gewählte Kursart keine qualifizierten Trainer vorhanden sind, zeigt das Dropdown einen Hinweis an.

### Konsequenzen

- Lisa sieht im Kursformular nur passende Trainer und kann keine unqualifizierten Trainer auswählen.
- Die UI ist nun konsistent mit der Admin-Verwaltung von `TrainerQualification` (FZ-019) und der bestehenden Kursplanung (FZ-021).
- Die serverseitige Absicherung bleibt als Folge-Task unter FZ-023 bestehen.

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

## 2026-07-08 - FZ-024 `Booking`-Entitaet und einfache Booking-API eingefuehrt

**Kontext:** Die Spezifikation verlangt eine persistente Abbildung von Kursbuchungen (`docs/spec.md §2.1, §3`). FZ-024 zielt darauf ab, Member-Kurs-Buchungen mit Status und Zeitstempel zu erfassen, um darauffolgende Features (Warteliste, Storno-Logik, No-Show, Monatslimits) aufzubauen.

### Entscheidung

Die Entscheidung ist, die `Booking`-Entitaet als Prisma-Modell zu nutzen (bereits im Schema vorhanden) und eine schlanke API zu ergänzen: `src/app/api/bookings/route.ts` mit `GET` (Liste) und `POST` (Buchung anlegen). Technische Eckpunkte:

- Prisma-Model: `Booking` mit `id`, `memberId`, `courseId`, `status: BookingStatus` (Default: `CONFIRMED`) und `bookedAt` (`@default(now())`). Unique-Constraint `@@unique([memberId, courseId])` verhindert doppelte Buchungen.
- API: `POST /api/bookings` validiert Member und Course-Existenz, legt die Booking an und behandelt Unique-Constraint-Fehler (Prisma `P2002` → 409 Conflict).
- API: `GET /api/bookings` liefert Bookings inklusive `member` und `course` (inkl. `courseType`, `room`, `trainer`) sortiert nach `bookedAt`.

### Alternativen verworfen

- Erst UI bauen und API danach: Verworfen, weil eine kleine API früh nützliche Integrations- und Testpunkte liefert.
- Externen Buchungsservice auslagern: Zu komplex für MVP/Solo-Workflow.

### Konsequenzen

- Positiv: Basisfunktionalität zum Anlegen und Auflisten von Buchungen ist vorhanden; schnelle Integration in Admin- und Member-Views möglich.
- Limitation: Wichtige Business-Rules sind noch nicht serverseitig implementiert (Kapazitätscheck, Buchungsfenster pro Tarif, Monatslimits, automatische Wartelisten-Logik, Stornofristen). Diese stehen als nächste Schritte im Backlog (FZ-030..FZ-039, FZ-031..FZ-036).
- Operativ: Falls das Prisma-Schema in Zukunft angepasst wird, ist nach Änderungen `prisma migrate`/`prisma generate` lokal auszuführen. Die aktuelle Änderung betraf nur die Server-API-Datei `src/app/api/bookings/route.ts` und `docs/backlog.md`.

### Nächste Schritte

- Serverseitige Regeln implementieren: Kapazitätsprüfung vor Anlegen, Monatslimitprüfung, und differenzierte Stornierungs-Statusänderungen.
- Wartelisten-Integration: Automatisches Nachrücken und Notification-Trigger.
- End-to-end Tests für Race-Conditions bei parallelen Buchungsversuchen (siehe FZ-078).


## 2026-07-08 - FZ-031 Monatslimit für aktive Buchungen implementiert

**Kontext:** Die Spezifikation verlangt ein monatliches Limit für aktive Kursbuchungen im laufenden Kalendermonat (`docs/spec.md BR1`). Basic- und Plus-Tarife nutzen `MembershipTier.maxCoursesPerMonth`, Premium bleibt unbegrenzt bei `null`.

### Entscheidung

FZ-031 wird serverseitig in der Booking-API umgesetzt. Technische Eckpunkte:

- `src/app/api/bookings/route.ts` ergänzt eine Limitprüfung vor dem Erstellen eines neuen `Booking`.
- Für `member.membershipTier.maxCoursesPerMonth != null` wird die Anzahl der `CONFIRMED`-Buchungen im aktuellen Monat gezählt.
- Ist das Limit erreicht, wird die Buchung mit einem 403-Fehler abgelehnt und eine klare Fehlermeldung zurückgegeben.
- Die Prüfung findet innerhalb einer Prisma-Transaktion statt, um Mehrfachbuchungen und Limit-Überschreitungen konsistent zu verhindern.

### Alternativen verworfen

- Limit allein im UI anzeigen: Verworfen, weil die Regelserverseitig gelten muss, um Manipulation zu verhindern.
- Monatslimit nur bei Kursanzeige prüfen: Verworfen, da sonst direkte API-Aufrufe die Regel umgehen könnten.

### Konsequenzen

- Positiv: Das System schützt Member vor Überschreitung ihres Tariflimits und erfüllt BR1 aus der Spezifikation.
- Risiko: Jahreswechsel-/Monatswechsel-Logik muss sauber bleiben; aktuell wird der Kalendermonat auf Basis des Serverdatums gewählt.
- Operativ: Bei Änderungen am `MembershipTier`-Modell oder am `Booking`-Status sollten Tests für Grenzfälle (z.B. Buchung in neuem Monat, frühere Buchungen) ergänzt werden.

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

## 2026-07-08 - FZ-025 Wartelisten-Entitaet als Admin-CRUD umgesetzt

**Kontext:** Die Spezifikation verlangt eine persistente Darstellung von Wartelisten-Einträgen für Kurse (`docs/spec.md §2.1, §3`). FZ-025 soll es ermöglichen, Mitglieder für volle Kurse in eine Warteliste aufzunehmen und deren Positionen verwaltbar zu machen.

### Entscheidung

FZ-025 wird als eigene Wartelisten-Funktion umgesetzt. Technische Eckpunkte:
- Neue API-Routen unter `src/app/api/waitlists/route.ts` und `src/app/api/waitlists/[id]/route.ts` für `GET`, `POST`, `PUT` und `DELETE`.
- Neue Admin-UI unter `src/app/waitlists/page.tsx`, um Wartelisten-Einträge anzulegen, anzuzeigen und zu löschen.
- Die Warteliste ist an bestehende `Member`-, `Course`-, `CourseType`-, `Room`- und `Trainer`-Daten angebunden, damit Lisa den Kontext direkt im Admin-UI sieht.
- Die Startseite wurde um einen direkten Einstieg zu Buchungen und Wartelisten ergänzt.

### Alternativen verworfen

- Nur das Datenmodell ohne API/UI: zu wenig sofort nutzbarer Mehrwert für Lisa.
- Wartelisten nur indirekt über Buchungslogik abbilden: erschwert spätere Verwaltung und Nachrück-Logik.

### Konsequenzen

- Positiv: Wartelisten-Einträge sind jetzt explizit im System gespeichert und verwaltbar.
- Positiv: Die Basis ist gelegt für spätere Business Rules wie automatisches Nachrücken bei Stornierung und Benachrichtigungen.
- Operativ: Die aktuelle Umsetzung ist bewusst schlank und fokussiert auf die Datenhaltung und Admin-Verwaltung; die eigentliche Buchungs-/Nachrück-Logik folgt in den nächsten Schritten.

## 2026-07-08 - FZ-030 Kursbuchung durch Mitglieder (Backend-Implementierung)

**Kontext:** Mitglieder sollen Kurse buchen können; bei voller Belegung soll eine Warteliste entstehen. Die Operation muss race-condition-sicher und konsistent mit bestehenden Business Rules (Buchungsfenster, Mitgliedsstatus, Kapazität) sein.

### Entscheidung

Die POST-Route `/api/bookings` wurde erweitert, sodass die Serverlogik nun:

- Mitglieds- und Tarifdaten prüft (Buchungsfenster via `bookingWindowDays` bleibt aktiv).
- Nur `ACTIVE`-Mitglieder Buchungen anlegen dürfen (sonst 403).
- In einer Prisma-Transaction ermittelt wird, ob noch Kapazität vorhanden ist; bei freiem Platz wird ein `Booking` angelegt, sonst ein `Waitlist`-Eintrag mit korrekter `position`.
- Doppelte Buchungs- oder Wartelisten-Einträge erkannt und mit konsistenten Fehlerantworten behandelt werden.

Wesentliche Änderung: `src/app/api/bookings/route.ts` (POST-Handler) implementiert die atomare Logik für Booking vs. Waitlist.

### Alternativen verworfen

- Nur clientseitige Lösung: nicht race-condition-sicher.
- Einfaches `count` + `create` ohne Transaction: riskant bei parallelen Anfragen.

### Konsequenzen

- Positiv: Verhindert Überbuchungen und wahrt Business Rules serverseitig.
- Offene Folgeaufgaben: Frontend-UI für Wartelisten-Feedback, Notification-Workflows beim Nachrücken, und Tests gegen Rennbedingungen.

### Aktion

- Änderung wurde angewendet und `docs/backlog.md` für FZ-030 auf `done` gesetzt.


