# decisions.md - Architektur- und Produktentscheidungen

_Chronologisches Log aller Architektur- und Produktentscheidungen._

## 2026-07-12 - FZ-057 Mitglieder sehen freie PT-Slots im Member-Profil

**Kontext:** Laut `docs/spec.md` §1 und BR7 sollen Mitglieder freie Personal-Training-Slots sehen koennen, um die spaetere Direktbuchung vorzubereiten. Nach FZ-055/FZ-056 waren Slots administrativ vorhanden, aber im Member-Bereich nicht sichtbar.

### Entscheidung

FZ-057 wird als kleine, gezielte Erweiterung von API und Member-UI umgesetzt:
- `GET /api/personal-training` unterstuetzt jetzt den Query-Parameter `onlyAvailable=true`.
- Bei aktiviertem Filter liefert die API nur Slots mit `status = AVAILABLE` und `startTime >= now`, weiterhin nach Startzeit sortiert.
- Die Member-Profilseite `src/app/profile/page.tsx` laedt diese gefilterte Liste und zeigt sie im neuen Abschnitt "Freie Personal-Training-Slots" mit Trainer, Zeitfenster und Stundensatz.
- Der API-Test `src/app/api/personal-training/route.test.ts` wurde um einen Fall erweitert, der den Filter-Pfad absichert.

### Alternativen verworfen

- Separater Endpunkt nur fuer freie Slots (z. B. `/api/personal-training/available`): unnoetige Duplizierung der bestehenden PT-Listenlogik.
- Ausschliesslich clientseitiges Filtern aller Slots: hoehere Payloads und keine serverseitig garantierte Sicht nur auf verfuegbare Termine.
- Umsetzung in der Admin-PT-Seite statt Member-Profil: wuerde das Featureziel "Mitglieder sehen freie Slots" verfehlen.

### Konsequenzen

- BR7-Vorbereitung ist im Member-Bereich sichtbar umgesetzt, ohne bestehende Admin-Flows zu veraendern.
- Die API bleibt rueckwaertskompatibel; ohne Query-Parameter liefert sie weiterhin die Vollansicht.
- FZ-058 kann direkt auf demselben Slot-Datensatz und Anzeigefluss aufsetzen.

## 2026-07-12 - FZ-056 Trainer/PT-Slots als AVAILABLE anlegen verifiziert und abgesichert

**Kontext:** Laut `docs/spec.md` BR7 muessen Trainer freie Personal-Training-Zeiten erfassen koennen, die als `AVAILABLE` bereitstehen. Die API-Grundlage aus FZ-055 legte Slots bereits als `AVAILABLE` an, aber fuer FZ-056 fehlte eine explizite, automatisierte Absicherung der Kernregel.

### Entscheidung

FZ-056 wird als gezielte Verifikation und Haertung der bestehenden Slot-Anlage umgesetzt:
- Neuer API-Test `src/app/api/personal-training/route.test.ts` validiert, dass `POST /api/personal-training` neue Slots mit `status = AVAILABLE` und leerer Member-Zuordnung (`memberId = null`) anlegt.
- Ein zweiter Test deckt die Ueberschneidungsregel fuer denselben Trainer ab und erwartet korrekt HTTP 409.
- Die bestehende API-Validierung (Pflichtfelder, gueltige Zeiten, `end > start`, Trainer-Existenz) bleibt unveraendert und ist Teil der FZ-056-Akzeptanz.

### Alternativen verworfen

- Neuer separater Endpunkt nur fuer FZ-056: unnoetig, da `POST /api/personal-training` die fachliche Regel bereits passend kapselt.
- Umsetzung ohne Tests: zu hohes Regressionsrisiko fuer den spaeteren Member-Buchungsfluss (FZ-057/FZ-058).

### Konsequenzen

- FZ-056 ist jetzt nicht nur funktional vorhanden, sondern testbar abgesichert.
- Die Umsetzung bleibt klein und kompatibel mit den Folgefeatures in Phase 4.

## 2026-07-12 - FZ-055 PersonalTrainingBooking-Entitaet modelliert und API + Admin-UI eingefuehrt

**Kontext:** Laut `docs/spec.md` §2.1, §3 und BR7 werden Personal-Training-Slots benoetigt, bei denen Trainer freie Zeiten als `AVAILABLE` eintragen und Mitglieder diese buchen koennen. Die Entitaet `PersonalTrainingBooking` war bereits im Prisma-Schema und in der Datenbank vorhanden (als Teil frueherer Modellierungsarbeit). Die zugehoerigen API-Routen und die Admin-UI fehlten noch.

### Entscheidung

FZ-055 wird als vollstaendige Modellierungsebene implementiert:
- **Prisma-Modell:** Bereits vorhanden in `prisma/schema.prisma` mit allen Spec-Feldern (`trainerId`, `memberId` nullable, `startTime`, `endTime`, `status`, `isFreePremiumSlot`, `billingStatus`). Keine Schemaaenderung noetig.
- **API `GET /api/personal-training`:** Liefert alle Slots mit Trainer- und Member-Daten, sortiert nach `startTime`.
- **API `POST /api/personal-training`:** Legt einen neuen Slot mit Status `AVAILABLE` an. Serverseitige Validierungen: Pflichtfelder, Zeitkonsistenz (end > start), Trainer-Existenz, Ueberschneidungspruefung fuer denselben Trainer (ausgenommen `CANCELLED_BY_TRAINER`-Slots).
- **API `GET /api/personal-training/[id]`:** Einzelabfrage eines Slots.
- **API `PUT /api/personal-training/[id]`:** Erlaubt Status- und Abrechnungsstatus-Updates sowie Member-Zuweisung. Bei Member-Zuweisung ohne expliziten Status wird Status automatisch auf `BOOKED` gesetzt. Nur `AVAILABLE`-Slots koennen neu zugewiesen werden.
- **API `DELETE /api/personal-training/[id]`:** Loeschen nur fuer Slots mit Status `AVAILABLE` erlaubt, um versehentliches Loeschen gebuchter oder abgeschlossener Termine zu verhindern.
- **Admin-UI `src/app/personal-training/page.tsx`:** Formular zum Anlegen neuer Slots (Trainer, Start-/Endzeit), Tabelle mit Status- und Abrechnungs-Dropdowns, Loesch-Aktion fuer freie Slots.

### Alternativen verworfen

- Member-seitiger Buchungsfluss direkt in FZ-055: zu breit fuer diese Modellierungsstufe; FZ-056 ff. decken die Slot-Buchung durch Mitglieder ab.
- Billing-Logik (PT-Gebueehr auf Kundenkonto) in FZ-055: gehoert zu BR7, wird in einem eigenen Feature abgebildet; `CustomerAccountEntry` hat bereits die Relation und ist vorbereitet.
- Separate API-Routen fuer Trainer-seitige vs. Admin-seitige Operationen: unnoetige Komplexitaet auf dieser Projektstufe.

### Konsequenzen

- BR7-Grundlage ist gelegt: Trainer koennen Slots anlegen und verwalten, Lisa hat vollstaendige Admin-Sicht und Kontrolle ueber Status und Abrechnung.
- Die Ueberschneidungspruefung verhindert doppelte Slotbelegung fuer denselben Trainer.
- Keine Schemaaenderungen oder Migrationen noetig; die bestehende Tabellenstruktur war bereits korrekt.
- FZ-056 (Slot-Buchung durch Mitglieder) und spaetrere Abrechnungs-Features koennen direkt auf dieser API aufbauen.

## 2026-07-11 - FZ-054 Vertragsende-Warnliste im Admin-Dashboard als Wiederverwendung der Reminder-Logik umgesetzt

**Kontext:** Laut `docs/spec.md` BR8 soll Lisa auslaufende Vertraege im Admin-Dashboard als Warnliste sehen. Nach FZ-051 bis FZ-053 existierte bereits die serverseitige Kandidatenlogik fuer Vertragsenden in 14 und 3 Tagen, aber es gab noch keine sichtbare Admin-Uebersicht dafuer.

### Entscheidung

FZ-054 wird als Erweiterung der bestehenden Startseite `src/app/page.tsx` umgesetzt und nutzt bewusst dieselbe Domain-Logik wie der taegliche Vertragsende-Job:
- Die Startseite fungiert fuer den aktuellen Scope als leichtgewichtiges Admin-Dashboard und ruft serverseitig `getContractEndReminderCandidates()` auf.
- Die Warnliste zeigt getrennte Bereiche fuer Vertraege mit Ende in 3 Tagen und in 14 Tagen.
- Es wird kein separater Dashboard-spezifischer API-Endpunkt eingefuehrt; die bestehende Lib-Funktion bleibt die zentrale Quelle fuer beide Anwendungsfaelle.
- Die Seite wird als dynamisch gerendert markiert, damit die Warnliste den aktuellen Datenbestand ohne statische Vorberechnung abbildet.

### Alternativen verworfen

- Separater API-Endpunkt nur fuer das Dashboard: unnoetige Duplizierung gegenueber der bereits testbaren Kandidatenlogik in `src/lib/contract-end-reminders.ts`.
- Vollstaendig neue Admin-Dashboard-Seite statt Erweiterung der bestehenden Startseite: fuer FZ-054 zu breit und nicht noetig, solange die Startseite die Rolle des operativen Einstiegs uebernimmt.
- Direkte Datenbankabfrage nur in der Page-Komponente ohne Lib-Wiederverwendung: erhoeht das Risiko fachlicher Abweichungen zwischen UI und Reminder-Job.

### Konsequenzen

- BR8 ist nicht nur als Hintergrundjob, sondern jetzt auch operativ fuer Lisa sichtbar umgesetzt.
- Vertragsende-Warnungen in UI und Job teilen sich dieselbe UTC-stabile Fachlogik.
- Fuer FZ-054 waren keine Schemaaenderungen, Migrationen oder neuen Backend-Routen noetig.

## 2026-07-11 - FZ-053 Erinnerung 3 Tage vor Vertragsende serverseitig ausgeloest

**Kontext:** Laut `docs/spec.md` BR8 muss das System neben der 14-Tage-Erinnerung auch exakt 3 Tage vor `contract_end_date` automatisch benachrichtigen. Nach FZ-052 wurden 3-Tage-Kandidaten bereits ermittelt (`dueIn3Days`), aber noch nicht versendet.

### Entscheidung

FZ-053 wird als gezielte Erweiterung des bestehenden Job-Endpunkts `GET /api/jobs/contract-end-check` umgesetzt:
- Der Endpoint versendet nun Erinnerungen fuer beide Kandidatenlisten: `dueIn14Days` und `dueIn3Days`.
- Fuer 3-Tage-Erinnerungen wird dieselbe Dispatcher-Schnittstelle `sendContractEndReminderNotification()` aus `src/lib/notifications.ts` genutzt; der Payload setzt `daysUntilEnd: 3`.
- Die API-Antwort wurde um `sentIn3DaysCount` erweitert, analog zum bestehenden `sentIn14DaysCount`.
- Der API-Test in `src/app/api/jobs/contract-end-check/route.test.ts` validiert jetzt explizit den Versand fuer beide Zeitpunkte.

### Alternativen verworfen

- Zweiter separater Job-Endpunkt nur fuer 3-Tage-Erinnerungen: unnoetige Duplizierung von Auth, Kandidatenermittlung und Dispatching.
- Sonderfall-Implementierung ausserhalb des bestehenden Notification-Dispatchers: erhoeht Kopplung und erschwert spaetere Provider-Integration.
- Reine Rueckgabe von `dueIn3Days` ohne Versand: verletzt BR8, da die Erinnerung nicht ausgeloest wird.

### Konsequenzen

- BR8 ist jetzt fuer beide Reminder-Zeitpunkte (14 und 3 Tage) technisch umgesetzt.
- Das Job-Feedback ist konsistent und transparenter (`sentIn14DaysCount`, `sentIn3DaysCount`).
- Die bestehende Architektur aus FZ-051/FZ-052 bleibt erhalten; es waren keine Schema- oder Migrationsaenderungen noetig.

## 2026-07-11 - FZ-052 Erinnerung 14 Tage vor Vertragsende serverseitig ausgeloest

**Kontext:** Laut `docs/spec.md` BR8 muss das System exakt 14 Tage vor `contract_end_date` eine automatische Erinnerung an das Mitglied senden. Nach FZ-051 wurden Kandidatenlisten (`dueIn14Days`, `dueIn3Days`) bereits korrekt ermittelt, aber es gab noch keinen echten Versand-Trigger.

### Entscheidung

FZ-052 wird als Erweiterung des bestehenden Job-Endpunkts `GET /api/jobs/contract-end-check` umgesetzt:
- Neue Dispatcher-Funktion `sendContractEndReminderNotification()` in `src/lib/notifications.ts` als provider-neutrale Versand-Schnittstelle (In-App/E-Mail).
- Der Job versendet Erinnerungen fuer alle Kandidaten in `dueIn14Days` unmittelbar nach der Kandidatenermittlung.
- Der Versand ist bewusst auf 14 Tage begrenzt; `dueIn3Days` wird weiterhin nur geliefert und bleibt Scope von FZ-053.
- Fuer Testbarkeit wurden Job-Abhaengigkeiten in `contractEndCheckDependencies` gebuendelt; Tests koennen Versand und Kandidatenermittlung gezielt stubben.

### Alternativen verworfen

- Versand direkt in `getContractEndReminderCandidates()`: vermischt Datenabfrage mit Side-Effects und reduziert Wiederverwendbarkeit.
- Gleichzeitige Umsetzung von 14- und 3-Tage-Versand in einem Schritt: wuerde FZ-052 und FZ-053 fachlich und im Backlog unnoetig koppeln.
- Direkte Provider-Integration im Endpoint: erhoeht Kopplung und erschwert spaeteren Austausch/Erweiterung.

### Konsequenzen

- BR8 ist fuer den 14-Tage-Fall technisch umgesetzt und API-seitig verifizierbar.
- Der Endpunkt liefert nun zusaetzlich `sentIn14DaysCount` als unmittelbares Laufzeit-Feedback.
- FZ-053 kann mit derselben Architektur nachgezogen werden, ohne die FZ-052-Logik zu destabilisieren.

## 2026-07-11 - FZ-051 Taegliche Vertragsende-Pruefung als geschuetzter Job-Endpunkt umgesetzt

**Kontext:** Laut `docs/spec.md` BR8 muss das System taeglich `contract_end_date` pruefen und die Faelle exakt fuer 14 sowie 3 Tage Restlaufzeit identifizieren. Vor der Umsetzung gab es keine zentrale, wiederverwendbare Prueflogik und keinen aufrufbaren Job-Endpunkt.

### Entscheidung

FZ-051 wird als serverseitiger Job-Endpunkt mit separater Domain-Logik umgesetzt:
- Neue Domain-Funktion `getContractEndReminderCandidates()` in `src/lib/contract-end-reminders.ts`.
- Neue Route `GET /api/jobs/contract-end-check` in `src/app/api/jobs/contract-end-check/route.ts`.
- Die Logik arbeitet mit UTC-Tagesgrenzen und liefert getrennte Listen fuer `dueIn14Days` und `dueIn3Days` inklusive Count-Feldern.
- Beruecksichtigt werden Mitglieder mit Status `ACTIVE` und `PAUSED`; `TERMINATED` wird ausgeschlossen.
- Optionaler Job-Schutz: Ist `CRON_SECRET` gesetzt, muss der Header `x-cron-secret` uebereinstimmen, sonst HTTP 401.

### Alternativen verworfen

- Direkt in der Route implementierte Prueflogik ohne Lib-Funktion: schlechter testbar und schwerer fuer FZ-052/FZ-053 wiederverwendbar.
- Lokale Datumsarithmetik ohne klare UTC-Normalisierung: erhoeht Risiko fuer Off-by-one-Fehler an Tagesgrenzen.
- Ungeschuetzter Job-Endpunkt ohne Secret-Option: zu offen fuer ungewollte externe Aufrufe in produktionsnahen Setups.

### Konsequenzen

- BR8-Teil "taegliche Pruefung" ist technisch implementiert und per Endpoint triggerbar.
- FZ-052 und FZ-053 koennen direkt auf den gelieferten Kandidatenlisten aufsetzen.
- Die API ist minimal-invasiv, ohne neue Datenbanktabellen oder Migrationen.

## 2026-07-11 - FZ-048/FZ-049/FZ-050 No-Show-Strafsystem mit automatischer 14-Tage-Sperre umgesetzt

**Kontext:** Laut `docs/spec.md` BR5 soll nach drei aufeinanderfolgenden No-Shows ein Mitglied automatisch fuer 14 Tage von Neubuchungen gesperrt werden. Diese drei Features bilden ein zusammenhängendes Strafsystem und wurden daher zusammen implementiert.

### Entscheidung

**FZ-048 – 14-Tage-Sperre automatisch setzen:**
- Neue Entität `NoShowRestriction` mit Feldern `memberId` (unique), `startedAt`, `expiresAt`.
- In `PUT /api/bookings/[id]` bei Zielstatus `NO_SHOW`: Nach dem Status-Update wird `getConsecutiveNoShowStreak()` aufgerufen.
- Wenn `noShowStreak >= 3`: `NoShowRestriction` wird via `upsert` erstellt oder aktualisiert. `expiresAt` berechnet sich als `now + 14 Tage`.
- Keine retroaktive Anwendung auf alte Mitglieder mit bereits 3+ No-Shows; Sperre wird nur bei zukünftigen No-Show-Statusupdates gesetzt.

**FZ-049 – Neubuchungen während Sperre blockieren:**
- In `POST /api/bookings` vor allen anderen Prüfungen: `NoShowRestriction.findUnique(where: {memberId})` abfragen.
- Falls gefunden und `expiresAt > now`: HTTP 403 mit aussagekräftiger Fehlermeldung, die das Verfallsdatum enthält (z. B. "bis zum 25.07.2026").
- Abgelaufene Sperren werden automatisch ignoriert (nicht aktiv gelöscht, da Cleanup optional ist).

**FZ-050 – Admin-Dashboard für aktive Sperren:**
- Neue Route `GET /api/restrictions`: Liefert alle aktiven Sperren (gefiltert auf `expiresAt > now`) mit Member-Details.
- Neue Admin-Seite `src/app/restrictions/page.tsx`: Tabelle mit Mitgliedsnamen, Email, Gültigkeitszeitraum.
- Button "Aufheben" pro Zeile → `DELETE /api/restrictions/[id]`, um Admin-Override zu ermöglichen (z. B. bei besonderen Fällen).

### Begründung für die enge Kopplung

Die drei Features sind **fachlich untrennbar**:
- FZ-048 ohne FZ-049 wäre wirkungslos (Sperre könnte umgangen werden).
- FZ-049 ohne FZ-048 hätte keine Sperren zu blockieren.
- FZ-050 ohne beide wäre Lisas Kontrollverlust (keine Sicht auf aktive Strafen).

Implementiert als **synchrone, serverseitige, transaktionssichere Regeln**, nicht als asynchrone Jobs.

### Alternativen verworfen

- Asynchroner Job bei 3. No-Show: zu viel Latenz, Risiko von Buchungen zwischen No-Show und Sperre-Setzen.
- Sperre am Member-Modell direkt: führt zu Duplizierung mit `NoShowRestriction`; hätte keine explizite Gültigkeitsdauer.
- Client-seitige Blockierung ohne serverseitige Validierung: unsicher bei direkten API-Aufrufen.
- Automatisches Löschen abgelaufener Sperren: nicht nötig; Abfrage mit `expiresAt > now` ist trivial und Auditierbarkeit bleibt erhalten.

### Konsequenzen

- BR5 ist nun vollständig und erzwingbar serverseitig implementiert.
- Phase 3 ("Betriebssicherheit") damit um 3 Features kompletter.
- Keine externen Dependencies (Jobs, Scheduler) nötig; läuft inline mit den bestehenden Booking-APIs.

## 2026-07-11 - FZ-047 Drei No-Shows in Folge als serverseitige Sequenzlogik umgesetzt

**Kontext:** Laut `docs/spec.md` BR5 soll nach drei unentschuldigten Fehlterminen in Folge eine 14-Tage-Sperre greifen. Nach FZ-046 waren `NO_SHOW`-Statuswerte fachlich gueltig, aber die eigentliche Serienerkennung pro Mitglied fehlte noch.

### Entscheidung

FZ-047 wird als serverseitige Sequenzlogik im bestehenden Booking-Statusupdate umgesetzt:
- Bei `PUT /api/bookings/[id]` und Zielstatus `NO_SHOW` wird nach erfolgreichem Update die aktuelle `NO_SHOW`-Serie des Mitglieds ermittelt.
- Die Auswertung nutzt vergangene Buchungen bis einschliesslich des betroffenen Kursstarts, sortiert absteigend nach Kurszeit, und zaehlt nur die unmittelbar aufeinanderfolgenden `NO_SHOW`-Eintraege.
- Die API liefert dafuer zusaetzliche Metadaten zur Folge zurueck: `noShowStreak` sowie `hasThreeNoShowsInRow`.
- Tests in `src/app/api/bookings/[id]/route.test.ts` decken den Positivfall (3 in Folge) und einen Unterbrechungsfall (Serie bricht bei anderem Status) ab.

### Alternativen verworfen

- Clientseitige Serienerkennung im Admin-UI: unzuverlaessig, da direkte API-Aufrufe die Regel umgehen koennen.
- Batch-/Cron-basierte Nachberechnung: zu spaet fuer direkte Folgeaktionen in naechsten Features (FZ-048/FZ-049).
- Persistenter Zaehler am Mitglied: zusaetzlicher Synchronisationsaufwand und hoehere Fehleranfaelligkeit bei Korrekturen historischer Buchungen.

### Konsequenzen

- Die Fachregel "3 No-Shows in Folge" ist jetzt zentral und reproduzierbar serverseitig auswertbar.
- FZ-048 kann direkt an `hasThreeNoShowsInRow` anknuepfen, um die 14-Tage-Sperre automatisch zu setzen.
- Die Logik bleibt minimal-invasiv ohne neues Datenmodell.

## 2026-07-11 - FZ-046 No-Show-Markierung fachlich eingeschraenkt und serverseitig validiert

**Kontext:** Laut `docs/spec.md` BR5 sind `NO_SHOW`-Markierungen die Grundlage fuer das spaetere Strafsystem (3 in Folge -> 14 Tage Sperre). Nach FZ-041 war das Setzen von `NO_SHOW` im Admin-Flow zwar moeglich, aber ohne fachliche Guardrails: Der Status konnte auch fuer noch nicht gestartete Kurse oder bereits stornierte Buchungen gesetzt werden.

### Entscheidung

FZ-046 wird als serverseitig erzwungene Regel in `PUT /api/bookings/[id]` umgesetzt:
- `NO_SHOW` darf nur aus dem Ausgangsstatus `CONFIRMED` gesetzt werden.
- `NO_SHOW` darf erst gesetzt werden, wenn `course.startTime` erreicht/ueberschritten ist.
- Bei Verstoessen liefert die API klare 400-Fehler; bei unbekannter Buchung 404.
- Die Regeln sind durch API-Tests in `src/app/api/bookings/[id]/route.test.ts` abgesichert (Positivfall + zwei Negativfaelle).

### Alternativen verworfen

- Nur UI-seitige Einschränkung im Admin-Formular: unsicher, da direkte API-Aufrufe die Regel umgehen koennen.
- Freies Status-Setzen mit spaeterer Korrekturlogik: erhoeht Risiko inkonsistenter Daten fuer FZ-047/FZ-048.
- Eigenes No-Show-Objekt statt Booking-Status: fuer den aktuellen Scope unnoetig komplex.

### Konsequenzen

- `NO_SHOW` ist jetzt ein belastbarer Fachstatus fuer tatsaechlich ausgefallene Teilnahme.
- FZ-047 (No-Show-Serie) kann auf valideren Statusdaten aufbauen.
- Die Admin-Steuerbarkeit aus FZ-041 bleibt erhalten, aber mit BR5-konformer Leitplanke.

## 2026-07-11 - FZ-045 Kundenkonto als zentrales Ledger fuer Gebuehren und Posten modelliert

**Kontext:** Laut `docs/spec.md` BR4 und BR7 muessen spaete Stornierungen und PT-Kosten auf ein nachvollziehbares Kundenkonto gebucht werden. Nach FZ-044 waren Late-Cancellation-Betraege zwar an `Booking` sichtbar, aber es fehlte ein zentrales Postenmodell fuer offene Forderungen, Billing-Status und spaetere Monatsabschluesse.

### Entscheidung

FZ-045 wird als eigenstaendiges Ledger-Modell `CustomerAccountEntry` im Prisma-Schema umgesetzt:
- Neues Enum `AccountEntryType` mit `LATE_CANCELLATION_FEE` und `PERSONAL_TRAINING_CHARGE`.
- Neues Modell `CustomerAccountEntry` mit `memberId`, optionalen Quellen (`bookingId`, `personalTrainingBookingId`), `amountCents`, `billingStatus` (`PENDING`, `BILLED_TO_ACCOUNT`, `PAID`) sowie Zeitstempeln (`createdAt`, `billedAt`, `paidAt`).
- Eindeutigkeit pro Quelle und Typ via `@@unique([bookingId, type])` und `@@unique([personalTrainingBookingId, type])` zur Duplikatvermeidung.
- `DELETE /api/bookings/[id]` bucht bei `CANCELLED_LATE` transaktional einen `CustomerAccountEntry` (`LATE_CANCELLATION_FEE`, `500` Cent, `PENDING`) per idempotentem `upsert`.

### Alternativen verworfen

- Weiterfuehren ausschliesslich ueber Felder an `Booking`: reicht nicht fuer PT-Posten und zentrales Offene-Posten-Reporting.
- Separates Kundenkonto je Mitglied mit aggregiertem Saldo ohne Einzelposten: verliert Nachvollziehbarkeit/Auditierbarkeit der Einzelvorgaenge.
- Async-Nachbuchung ausserhalb der Stornotransaktion: erhoeht Inkonsistenzrisiko bei Fehlerszenarien.

### Konsequenzen

- Storno- und kuenftige PT-Posten teilen sich jetzt ein gemeinsames, auswertbares Datenmodell.
- FZ-063 bis FZ-067 koennen direkt auf `CustomerAccountEntry` aufsetzen, ohne neues Billing-Grundgeruest.
- Die bereits vorhandenen `Booking`-Gebuehrenfelder bleiben als direkte Fachspur erhalten; das Ledger bildet den abrechnungsfaehigen Postenbestand.

## 2026-07-11 - FZ-044 Late-Cancellation-Gebuehr als persistente Buchungsattribute umgesetzt

**Kontext:** Laut `docs/spec.md` BR4 muss bei einer spaeten Stornierung (< 2 Stunden) fuer Basic/Plus automatisch eine Gebuehr von 5,00 EUR auf das Kundenkonto gebucht werden; Premium bleibt gebuehrenfrei. Die bestehende Storno-Logik setzte bereits den Status (`CANCELLED_LATE` vs. `CANCELLED_TIMELY`), persistierte aber noch keinen Geldposten.

### Entscheidung

FZ-044 wird als minimale, fachlich eindeutige Erweiterung auf der bestehenden `Booking`-Entitaet umgesetzt:
- `Booking` erhaelt `lateCancellationFeeCents` (nullable Integer) und `lateCancellationFeeBookedAt` (nullable Timestamp).
- In `DELETE /api/bookings/[id]` werden bei `CANCELLED_LATE` exakt `500` Cent und ein Buchungszeitpunkt gesetzt.
- Bei `CANCELLED_TIMELY` (inkl. Premium-Ausnahme) bleiben beide Felder `null`.
- Die Gebuehrenbuchung erfolgt in derselben Transaktion wie die Statusaenderung, um Inkonsistenzen zu vermeiden.

### Alternativen verworfen

- Sofortige Einfuehrung eines vollstaendigen Kundenkonto-/Ledger-Modells: fachlich moeglich, aber fuer FZ-044 zu gross; das ist Scope von FZ-045.
- Nur abgeleitete Gebuehr ohne Persistenz (z. B. rein aus `status`): unzureichend fuer nachvollziehbare Abrechnung und Reporting.
- Externe asynchrone Nachbuchung nach Storno: erhoeht Race-Condition-Risiko und bricht atomare Fachlogik.

### Konsequenzen

- Die 5,00-EUR-Regel aus BR4 ist jetzt serverseitig nachvollziehbar gespeichert.
- FZ-045 kann spaeter auf den Feldern aufsetzen oder sie in ein zentrales Billing-/Kundenkonto-Modell ueberfuehren.
- Bestehende Premium-Ausnahme bleibt unveraendert erhalten.

## 2026-07-11 - FZ-043 Monatslimit ignoriert Trainerausfall-Kurse

**Kontext:** Laut `docs/spec.md` BR1 muessen Teilnehmer mit limitierter Monatsbuchung bei einem durch Lisa als Trainerausfall markierten Kurs ihren Buchungspunkt automatisch zurueckerhalten. Nach FZ-042 war der Ausfallstatus am Kurs vorhanden, aber die Monatslimit-Pruefung zaehlte bestaetigte Buchungen auf solchen Kursen weiterhin mit.

### Entscheidung

FZ-043 wird als Anpassung der bestehenden Limitzaehlung umgesetzt, nicht als separates Gutschriftobjekt oder nachgelagerter Korrekturlauf:
- In `POST /api/bookings` zaehlt die Monatslimit-Pruefung nur noch bestaetigte Buchungen auf Kursen mit `Course.status = SCHEDULED`.
- Bereits bestaetigte Buchungen auf `CANCELLED_TRAINER_SICKNESS` gelten damit sofort als Kulanzfall und blockieren keine neue Buchung mehr.
- Die Regel bleibt implizit aus dem Kursstatus ableitbar; es wird kein zusaetzliches Feld am `Booking` oder `Member` eingefuehrt.

### Alternativen verworfen

- Separates Kulanz-/Credit-Feld am Mitglied: waere fuer die aktuelle Regel zu schwergewichtig und muesste aktiv synchron gehalten werden.
- Betroffene Buchungen bei Ausfall aktiv auf einen Sonderstatus umschreiben: unnoetig invasiv und riskanter fuer bestehende Storno-/Historienlogik.
- Nachtraeglicher Batch-Job zur Rueckgabe des Limits: fachlich zu spaet, weil die Neubuchung sofort wieder moeglich sein muss.

### Konsequenzen

- Die Kulanz greift automatisch, sobald ein Kurs als Trainerausfall markiert ist.
- Es ist keine Datenmigration und kein neuer Persistenzzustand noetig.
- Die Regel bleibt eng an BR1 gekoppelt und nutzt die in FZ-042 eingefuehrte Kursstatus-Semantik konsequent weiter.

## 2026-07-11 - FZ-042 Trainerausfall als expliziter Kursstatus erfasst

**Kontext:** Laut `docs/spec.md` BR1 muss Lisa einen Kursausfall wegen Krankheit explizit administrativ erfassen koennen. Bislang gab es dafuer keine eigene Fachauspraegung am Kurs, wodurch Ausfaelle nur indirekt oder durch Loeschung modellierbar waren.

### Entscheidung

FZ-042 wird ueber einen dedizierten Kursstatus umgesetzt:
- Im Datenmodell wurde fuer `Course` ein Enum-Status eingefuehrt (`SCHEDULED`, `CANCELLED_TRAINER_SICKNESS`).
- Die API `PUT /api/courses/[id]` akzeptiert und validiert den neuen Status serverseitig.
- In der Admin-Kursverwaltung kann Lisa pro Kurs den Trainerausfall direkt markieren.
- Neue Buchungen auf so markierte Kurse werden in `POST /api/bookings` mit klarer Fehlermeldung blockiert.

### Alternativen verworfen

- Kurs bei Ausfall direkt loeschen: verliert Historie und ist fachlich nicht gleichbedeutend mit Absage.
- Freitextfeld fuer Ausfallgruende ohne Status: erschwert regelbasierte Weiterverarbeitung (z. B. Kulanz in FZ-043).
- Separates Ausfall-Objekt ohne Kursstatus: unnoetige Komplexitaet fuer den aktuellen Scope.

### Konsequenzen

- Trainerausfall ist jetzt als klarer, auswertbarer Fachzustand am Kurs modelliert.
- Admin kann Absagen operational ohne DB-Eingriff erfassen.
- Folgefeature FZ-043 (Limit-Kulanz bei Trainerausfall) hat eine stabile technische Grundlage.

## 2026-07-10 - FZ-041 Admin steuert Kursbuchungen zentral ueber Buchungsmodul

**Kontext:** Laut `docs/spec.md` §1 soll Lisa als Admin alle Kursbuchungen ueber das Kontrollzentrum steuern koennen. Bisher gab es primär eine Uebersicht und Mitglieds-getriebene Flows, aber keine vollstaendige Admin-Steuerung fuer manuelles Eingreifen.

### Entscheidung

FZ-041 wird als gezielte Erweiterung des bestehenden Buchungsmoduls umgesetzt, ohne neues Subsystem einzufuehren:
- In `src/app/bookings/page.tsx` kann der Admin jetzt Buchungen direkt anlegen, pro Buchung den Status setzen und Buchungen stornieren.
- In `src/app/api/bookings/[id]/route.ts` wurde ein `PUT`-Handler eingefuehrt, der nur gueltige `BookingStatus`-Werte (`CONFIRMED`, `CANCELLED_LATE`, `CANCELLED_TIMELY`, `NO_SHOW`) akzeptiert.
- Die bestehende Storno- und Nachruecklogik im `DELETE`-Handler bleibt unveraendert, damit BR2/BR4 weiterhin konsistent greifen.

### Alternativen verworfen

- Separates Admin-Only Booking-API-Modul: haette redundante Endpunkte geschaffen und bestehende Fachlogik dupliziert.
- Freitext-Status ohne serverseitige Enum-Validierung: erhoeht Risiko ungueltiger Stati und inkonsistenter Auswertungen.
- Vollstaendiger Umbau des Booking-Flows: fuer den Scope von FZ-041 zu gross und nicht noetig.

### Konsequenzen

- Lisa kann Buchungen jetzt operativ zentral steuern (anlegen, stornieren, Status pflegen) ohne DB-Eingriff.
- `NO_SHOW` kann adminseitig sauber gesetzt werden und bereitet FZ-046/FZ-047 fachlich vor.
- Die Erweiterung bleibt chirurgisch: bestehende Business-Rule-Implementierungen fuer Storno/Nachruecken wurden nicht aufgeweicht.

## 2026-07-10 - FZ-040 Nachruecker-Benachrichtigung nach erfolgreichem Move-Up ausgelost

**Kontext:** Laut `docs/spec.md` BR2 soll bei rechtzeitiger Stornierung mit automatischem Nachruecken sofort eine Benachrichtigung an das nachgerueckte Mitglied ausgeloest werden.

### Entscheidung

In `DELETE /api/bookings/[id]` wird nach erfolgreicher Transaktion (Stornierung + Move-Up + Wartelisten-Reindex) ein dedizierter Notification-Trigger ausgefuehrt. Die Zustellung ist in `src/lib/notifications.ts` als provider-neutrale Dispatcher-Funktion gekapselt (`sendWaitlistMoveUpNotification`) und markiert die vorgesehenen Kanaele `IN_APP` und `EMAIL`.

Die Route sammelt den Notification-Payload innerhalb der Transaktion, loest den Trigger aber erst nach Commit aus. Damit bleiben Datenoperationen atomar, waehrend externe Side-Effects keine Transaktion offen halten.

### Alternativen verworfen

- Notification direkt innerhalb der DB-Transaktion senden: erhoeht Risiko von langen Locks und Rollback-Seiteneffekten.
- FZ-040 bis zur finalen Provider-Entscheidung offen lassen: verletzt BR2, obwohl der Trigger technisch bereits eindeutig ausloesbar ist.
- Ad-hoc-Logging ohne gekapselten Dispatcher: erschwert spaeteren Austausch gegen echten In-App/E-Mail-Provider.

### Konsequenzen

- Nachruecker-Benachrichtigung wird jetzt serverseitig ausgeloest, sobald ein Mitglied erfolgreich nachrueckt.
- Ein spaeterer Providerwechsel (z. B. SMTP, In-App Inbox, Queue) kann ohne Anpassung der Fachlogik in der Booking-Route erfolgen.
- Fehlschlaege bei der Zustellung blockieren die Stornierung nicht; sie werden als Fehler protokolliert.

## 2026-07-10 - FZ-039 Automatisches Nachruecken bei rechtzeitiger Stornierung transaktional umgesetzt

**Kontext:** Gemäss `docs/spec.md` BR2 soll beim Stornieren eines Kurses mit rechtzeitiger Abmeldung (>= 2 Std. vorher) das erste Wartelistenmitglied automatisch zu einem bestätigten Platz (`CONFIRMED`) nachrücken.

### Entscheidung

Die Stornierungslogik `DELETE /api/bookings/[id]` wurde erweitert: Nach dem Setzen von `status = CANCELLED_TIMELY` wird atomar eine Transaktion eingeleitet, die:
1. Das erste Wartelistenmitglied (`position = 1`) ausfindig macht
2. Eine neue bestätigte `Booking` für dieses Mitglied anlegt
3. Den Wartelisteneintrag löst und die restlichen Positionen über `deleteWaitlistEntryAndReindex()` aus `src/lib/waitlist-position.ts` konsistent reindexiert

Die Implementierung nutzt `prisma.$transaction()` zur atomaren Ausführung und verhindert Race Conditions bei parallelen Stornierungen desselben Kurses.

### Alternativen verworfen

- Nachruecken asynchron/delayed: erhöht Komplexität und Risiko von Benachrichtigungs-Race Conditions.
- Warteliste direkt zu Booking promoten ohne neuen Datensatz: fachlich inkorrekt, da die Buchungshistorie (`booked_at`) verloren ginge.
- Nur das Wartelisteneintrag aktualisieren ohne separate Booking: widerspricht dem Datenmodell (Booking und Waitlist sind disjunkt).

### Konsequenzen

- Mitglieder auf der Warteliste rücken sofort nach, wenn jemand rechtzeitig storniert.
- Der Nachruecker bekommt eine neue `booked_at`-Timestamp, was die Buchungshistorie sauberhält.
- FZ-040 (Nachruecker-Benachrichtigung) ist vorbereitet; die Notifikationslogik kann sich auf die erfolgreiche Booking-Erstellung abstützen.
- Die Transaktionalität verhindert Doppelvergaben und Wartelisten-Inkonsistenzen auch unter Last.

## 2026-07-10 - FZ-038 Wartelistenpositionen transaktionssicher stabilisiert

**Kontext:** Nach FZ-037 konnten Wartelisteneintraege zwar angelegt werden, aber Positionsaenderungen und Loeschungen konnten zu Luecken oder Konflikten mit der Unique-Constraint `@@unique([courseId, position])` fuehren. Laut `docs/spec.md` BR2 muss die Reihenfolge stabil bleiben.

### Entscheidung


Die Wartelisten-Positionslogik wird zentral in `src/lib/waitlist-position.ts` gebuendelt und von Booking- sowie Waitlist-API gemeinsam genutzt. Einfuegen, Verschieben und Loeschen laufen transaktional und reindizieren die Positionen pro Kurs lueckenlos auf `1..n`.

Zur kollisionsfreien Umsortierung mit bestehender Unique-Constraint werden bestehende Eintraege temporaer in einen Offset-Bereich verschoben und danach in finaler Reihenfolge zurueckgeschrieben. Bei gleicher Position dient `created_at` als stabiler Tie-Breaker.

### Alternativen verworfen

- Nur „naechste freie Position“ fortfuehren: behebt keine Luecken nach Loeschung und keine konsistente Umordnung.
- Reindex nur im Frontend: unsicher bei parallelen API-Aufrufen und verletzt serverseitige Datenhoheit.
- Constraint entfernen und nur logisch sortieren: erhoeht Risiko inkonsistenter Daten und erschwert Nachrueck-Logik.

### Konsequenzen

- Positionsverwaltung ist jetzt in einer wiederverwendbaren, testbaren Domainenlogik gebuendelt.
- Booking- und Waitlist-Endpunkte verhalten sich konsistent bei voller Auslastung, manuellem Reordering und Loeschen.
- FZ-039 (automatisches Nachruecken) kann auf einer lueckenlosen, stabilen Warteliste aufbauen.

## 2026-07-10 - FZ-037 Wartelistenbeitritt bei vollem Kurs direkt in der Buchungs-API umgesetzt

**Kontext:** Gemäss `docs/spec.md` soll ein Mitglied bei voller Kursauslastung nicht einfach scheitern, sondern direkt auf die Warteliste mit der naechsten freien Position gesetzt werden.

### Entscheidung

Die Buchungs-API `POST /api/bookings` erzeugt bei voller Belegung keinen Fehler, sondern legt im selben Transaktionsfluss einen `Waitlist`-Eintrag mit der naechsten `position` an. Die Position wird aus dem hoechsten bestehenden Wartelistenwert des Kurses abgeleitet.

### Alternativen verworfen

- Separate Wartelisten-Anfrage nach einer fehlgeschlagenen Buchung: zu umstaendlich fuer den Member-Flow und fachlich nicht noetig.
- Position nur im Frontend berechnen: unsicher, weil parallele Buchungen die Reihenfolge verschieben koennen.

### Konsequenzen

- Der Member-Flow bleibt einfach: Buchung starten, bei vollem Kurs automatisch auf Warteliste landen.
- Die Reihenfolge wird serverseitig bestimmt und bleibt damit konsistent.
- FZ-038 kann auf dieser Grundlage die stabile Wartelisten-Logik weiter haerten.

## 2026-07-10 - FZ-036 Premium-Ausnahme fuer spaete Stornierung als zentrale Regel umgesetzt

**Kontext:** Gemäss `docs/spec.md` BR4 muss bei Stornierungen unter 2 Stunden vor Kursbeginn fuer Tarife mit `hasFreeLateCancellation = true` weiterhin `CANCELLED_TIMELY` gesetzt werden, waehrend andere Tarife als `CANCELLED_LATE` gelten.

### Entscheidung

Die Storno-Entscheidungslogik wurde aus der API-Route extrahiert und als zentrale, testbare Regel in `src/lib/cancellation-status.ts` umgesetzt. Die Route `DELETE /api/bookings/[id]` nutzt diese Funktion jetzt direkt.

Abgedeckte Regel faelle:
- >= 2 Stunden vor Kursbeginn: `CANCELLED_TIMELY`
- < 2 Stunden ohne Premium-Ausnahme: `CANCELLED_LATE`
- < 2 Stunden mit Premium-Ausnahme: `CANCELLED_TIMELY`

### Alternativen verworfen

- Logik nur inline in der Route behalten: schwerer isoliert zu testen und bei spaeteren Regeln zu erweitern.
- Premium-Ausnahme nur in der UI modellieren: fachlich unsicher, da API-Aufrufe die Regel umgehen koennten.

### Konsequenzen

- Die BR4-Ausnahme ist serverseitig eindeutig und wiederverwendbar implementiert.
- Unit-Tests in `src/lib/cancellation-status.test.ts` sichern die drei Kernfaelle ab.
- Folgefeatures wie Gebuehrenbuchung (FZ-044) koennen auf dem klaren Status-Ergebnis aufbauen.

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

## 2026-07-08 - FZ-033 Kursstornierung durch Mitglieder implementiert

**Kontext:** Gemäß `docs/spec.md` BR4 sollen Mitglieder Buchungen stornieren können. Statt Buchungen zu löschen, müssen Stornos auditierbar als Statusänderung abgelegt werden (`CANCELLED_TIMELY` / `CANCELLED_LATE`) und die Spätstorno-Regel des Tarifs (`hasFreeLateCancellation`) berücksichtigt werden.

### Entscheidung

Die Stornierung wird serverseitig als neue Route `DELETE /api/bookings/[id]` umgesetzt. Die Route prüft:

- Existenz der Buchung und dass sie `CONFIRMED` ist.
- verbleibende Zeit bis Kursbeginn; bei < 2 Stunden wird `CANCELLED_LATE` gesetzt, sonst `CANCELLED_TIMELY`.
- das Flag `membershipTier.hasFreeLateCancellation`: falls gesetzt, wird auch bei <2 Stunden `CANCELLED_TIMELY` gesetzt.

Die Route ändert nur den `status` der `Booking`-Entität (Audit-Trail bleibt erhalten). Gebührenbuchungen und Benachrichtigungen werden in einem separaten Schritt implementiert (siehe Konsequenzen / Nächste Schritte).

Wesentliche Implementationsdatei: `src/app/api/bookings/[id]/route.ts` (DELETE-Handler).

### Alternativen verworfen

- Löschung der Buchung (`DELETE` physisch): verworfen wegen Audit- und Reporting-Anforderungen.
- Komplettes Gebühren-Handling in dieser Änderung: zurückgestellt, um die Kern-Rücksetzlogik klein und prüfbar zu halten.

### Konsequenzen

- Positiv: Storno-Workflow entspricht `docs/spec.md` BR4 und lässt spätere Nachverrechnung/Reporting zu.
- Offen: Gebühren (`5,00 €` für Basic/Plus bei späten Stornos) sind noch nicht automatisch auf Kundenkonten gebucht. Weiteres Ticket empfohlen (FZ-044).
- Offen: Nachrücken von Wartelisten bei rechtzeitiger Stornierung (FZ-039) ist nicht Teil dieses Commits und sollte als nächster Schritt ergänzt werden.

## 2026-07-08 - FZ-034 Rechtzeitige Stornierung (`CANCELLED_TIMELY`) umgesetzt

**Kontext:** Gemäß `docs/spec.md` BR4 müssen Stornierungen, die mindestens 2 Stunden vor Kursbeginn erfolgen, als `CANCELLED_TIMELY` persistiert werden.

### Entscheidung

Die Logik zur Unterscheidung zwischen `CANCELLED_TIMELY` und `CANCELLED_LATE` wurde in der neuen Route `DELETE /api/bookings/[id]` implementiert. Bei >= 2 Stunden bis Kursbeginn wird `CANCELLED_TIMELY` gesetzt; bei < 2 Stunden greift der Tarif-Fall (`hasFreeLateCancellation`) sonst `CANCELLED_LATE`.

### Konsequenzen

- Positiv: Die Stornierungs-Status sind auditierbar und entsprechen der Spezifikation.
- Offen: Gebührenbuchung für späte Stornos (FZ-044) und Nachrücken aus Wartelisten (FZ-039) sind separat zu implementieren.



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


## 2026-07-08 - FZ-035 Späte Stornierung (`CANCELLED_LATE`) umgesetzt

**Kontext:** Gemäß `docs/spec.md` BR4 sollen Stornierungen, die weniger als 2 Stunden vor Kursbeginn erfolgen, als späte Stornierung erkannt und entsprechend als `CANCELLED_LATE` persistiert werden. Premium-Tarife mit `has_free_late_cancellation` sollen hiervon ausgenommen sein.

### Entscheidung

FZ-035 wurde in der bestehenden Buchungs-API als serverseitige Logik implementiert. Die `DELETE /api/bookings/[id]`-Route prüft die verbleibende Zeit bis Kursbeginn und setzt den `Booking.status` auf `CANCELLED_LATE` wenn die Frist < 2 Stunden liegt, es sei denn, das zugehörige `MembershipTier` hat `hasFreeLateCancellation` gesetzt — in diesem Fall wird `CANCELLED_TIMELY` verwendet.

Wesentliche Implementationsdatei: `src/app/api/bookings/[id]/route.ts` (DELETE-Handler).

### Alternativen verworfen

- Physische Löschung der Buchung: verworfen wegen Audit- und Reporting-Anforderungen.
- Gebührenverarbeitung (5,00 €) direkt in dieser Änderung: zurückgestellt in FZ-044, um die Kern-Status-Logik klein und prüfbar zu halten.

### Konsequenzen

- Positiv: Stornierungen sind nun auditierbar und entsprechen den Business Rules in `docs/spec.md`.
- Offen: Gebührenbuchung für späte Stornos (FZ-044) und automatisches Nachrücken von Wartelisten (FZ-039) sind noch zu implementieren.
- Tests für Randfälle (Zeitzonen, exakte 2-Stunden-Grenze) sollten ergänzt werden.


