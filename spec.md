# 📝 System-Spezifikation (SPEC.md) – Fitnessstudio-App „FitZone“ (Lisa's Studio)

Dieses Dokument beschreibt die funktionalen Anforderungen, das Datenmodell, die Systembeziehungen und die geschäftlichen Kernregeln (Business Rules) für das neue Mitglieder- und Kursverwaltungssystem.

---

## 1. Systemübersicht & Rollenmodell
Die Anwendung ist eine responsive Web-App (optimiert für Mobile- und Desktop-Ansichten) im **FitZone-Branding (Orange, Schwarz, Clean-Weiß)** mit zwei klar getrennten Benutzerrollen:

* **Mitglied (Member):** Kann das eigene Profil einsehen, Gruppenkurse im erlaubten Zeitfenster buchen/stornieren, sich auf Wartelisten setzen, Personal-Training-Slots direkt buchen, via App im Studio einchecken (Zukunftsausblick per QR-Code) und Online-Videos streamen.
* **Administrator (Admin - Lisa):** Hat vollen Zugriff auf das Kontrollzentrum. Kann Stammdaten verwalten (CRUD), Kurse planen (mit automatischer Trainer-Prüfung), Videos verwalten, Tarife anpassen, aktuelle Sperren einsehen, den Bezahlstatus von Personal Trainings überwachen und alle Buchungen steuern.

---

## 2. Datenmodell (Entity Relationship)

Das System basiert auf einem relationalen Datenmodell.

### 2.1 Entitäten & Attribute

#### `Member` (Mitglied)
* `id` (UUID, Primary Key)
* `first_name` (String)
* `last_name` (String)
* `email` (String, Unique)
* `sepa_iban` (String)
* `status` (Enum: `ACTIVE`, `PAUSED`, `TERMINATED`)
* `membership_tier_id` (ForeignKey)
* `contract_end_date` (Date)
* `created_at` (Timestamp)

#### `MembershipTier` (Tarif)
* `id` (UUID, Primary Key)
* `name` (String, z. B. "Basic", "Plus", "Premium")
* `monthly_price` (Decimal)
* `max_courses_per_month` (Integer, Nullable für unbegrenzt)
* `has_video_access` (Boolean)
* `booking_window_days` (Integer)
* `has_free_late_cancellation` (Boolean)
* `included_pt_slots_per_month` (Integer, Standard: Premium = 1, andere = 0)

#### `Course` (Gruppenkurs-Termin)
* `id` (UUID, Primary Key)
* `course_type_id` (ForeignKey)
* `start_time` (Timestamp)
* `end_time` (Timestamp)
* `max_participants` (Integer)
* `room_id` (ForeignKey)
* `trainer_id` (ForeignKey)

#### `CourseType` (Kursart - z.B. Yoga, HIIT)
* `id` (UUID, Primary Key)
* `name` (String, Unique)

#### `Trainer` (Trainer)
* `id` (UUID, Primary Key)
* `first_name` (String)
* `last_name` (String)
* `email` (String)
* `hourly_pt_rate` (Decimal, z.B. 60.00 bis 80.00)

#### `TrainerQualification` (Zuordnung Trainer zu Kursart - n:m)
* `id` (UUID, Primary Key)
* `trainer_id` (ForeignKey)
* `course_type_id` (ForeignKey)

#### `Room` (Raum)
* `id` (UUID, Primary Key)
* `name` (String)

#### `Booking` (Kurs-Buchung - n:m)
* `id` (UUID, Primary Key)
* `member_id` (ForeignKey)
* `course_id` (ForeignKey)
* `status` (Enum: `CONFIRMED`, `CANCELLED_LATE`, `CANCELLED_TIMELY`, `NO_SHOW`)
* `booked_at` (Timestamp)

#### `Waitlist` (Warteliste - n:m)
* `id` (UUID, Primary Key)
* `member_id` (ForeignKey)
* `course_id` (ForeignKey)
* `position` (Integer)
* `created_at` (Timestamp)

#### `PersonalTrainingBooking` (1-zu-1 Termine)
* `id` (UUID, Primary Key)
* `trainer_id` (ForeignKey)
* `member_id` (ForeignKey, Nullable wenn noch frei)
* `start_time` (Timestamp)
* `end_time` (Timestamp)
* `status` (Enum: `AVAILABLE`, `BOOKED`, `COMPLETED`, `CANCELLED_BY_TRAINER`)
* `is_free_premium_slot` (Boolean, True wenn es der monatliche Inklusiv-Slot des Premium-Mitglieds war)
* `billing_status` (Enum: `PENDING`, `BILLED_TO_ACCOUNT`, `PAID`)

#### `Video` (Online-Mediathek)
* `id` (UUID, Primary Key)
* `title` (String)
* `video_url` (String)
* `category` (String)
* `created_at` (Timestamp)

---

## 3. Systembeziehungen (Relations)
1. **`Trainer` ➔ `CourseType` (n:m über `TrainerQualification`):** Regelt, wer was unterrichten darf.
2. **`Member` ➔ `Course` (n:m über `Booking` & `Waitlist`):** Kursplatz-Belegung.
3. **`MembershipTier` ➔ `Video`:** Zugriffsberechtigung basierend auf `has_video_access`.
4. **`Trainer` & `Member` ➔ `PersonalTrainingBooking`:** 1-zu-1 Zuordnung pro gebuchtem Zeitfenster.

---

## 4. Geschäftsprozesse & Harte Business Rules

### BR1: Monatliches Buchungslimit (Basic-Tarif)
* Das System zählt alle aktiven Buchungen im laufenden Kalendermonat. Ist das Limit (5) erreicht, wird die Buchung abgebrochen.
* **Trainer-Ausfall-Kulanz:** Wird ein Kurs durch den Admin wegen Krankheit abgesagt, wird allen Teilnehmern mit Limitierung der Buchungs-Punkt automatisch für den Monat gutgeschrieben.

### BR2: Wartelisten-Nachrücker mit Notification
* Storniert ein Teilnehmer rechtzeitig, rückt `position = 1` automatisch nach (`status = CONFIRMED`). Das System löst sofort eine automatische In-App- / E-Mail-Benachrichtigung an das Mitglied aus (*„Du bist nachgerückt!“*).

### BR3: Buchungsfenster ("Early Access")
* Die Einsicht und Buchung von Kursen ist dynamisch geregelt (z.B. Premium 14 Tage im Voraus, Basic 7 Tage).

### BR4: Stornierungsfristen & Gebühren
* Stornierung < 2 Stunden vor Kursbeginn führt bei Basic/Plus zu `CANCELLED_LATE` und bucht automatisch 5,00 € Stornogebühr auf das Kundenkonto. Premium storniert kostenlos.

### BR5: Automatisches No-Show-Strafsystem
* Wer 3-mal in Folge unentschuldigt fehlt (`NO_SHOW`), wird automatisch für 14 Tage für Neubuchungen gesperrt.

### BR6: Trainer-Qualifikations-Sperre (Lisas Sicherheitsnetz)
* Beim Anlegen eines Kurses im Admin-Bereich dürfen im Trainer-Dropdown nur Trainer auswählbar sein, die laut `TrainerQualification` für diese Kursart freigeschaltet sind (z.B. Marie für Yoga, Tom für HIIT).

### BR7: Personal Training Slots & Abrechnung
* **Direktbuchung:** Trainer tragen freie Zeiten ein (`AVAILABLE`). Mitglieder buchen den Slot direkt fest ein. Der Trainer erhält eine Push-Meldung und kann im Notfall bis zu 24 Std. vorher absagen.
* **Finanz-Logik:** Premium-Mitglieder haben 1 Slot pro Monat frei (`is_free_premium_slot = True`). Alle weiteren Slots oder Slots anderer Tarife buchen den Betrag (`Trainer.hourly_pt_rate`) auf das Kundenkonto (`billing_status = PENDING`). Am Monatsende listet das Dashboard alle offenen Posten auf, die per SEPA eingezogen werden können. Nach dem Export setzt Lisa das Flag auf `BILLED_TO_ACCOUNT`.

### BR8: Automatische Abo-Ablauf-Erinnerung
* Das System prüft täglich das `contract_end_date`. Exakt **14 Tage** sowie noch einmal **3 Tage** vor Vertragsende schickt das System eine automatische Erinnerung an das Mitglied und listet den Vertrag auf Lisas Admin-Dashboard in einer Warnliste auf.

---

## 5. UI/UX Anforderungen (FitZone Style)
* **Design-Richtlinie:** Clean, übersichtlich (Inspiration: Gymondo, Urban Sports Club). Farbschema: **Orange, Schwarz, viel Weißraum für Fokus**. Funktion geht vor Design.
* **Zukunftsausblick:** Vorbereitung für einen späteren Check-In via QR-Code direkt an der Studiotür.