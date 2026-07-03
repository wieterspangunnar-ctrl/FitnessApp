# CLAUDE.md - FitZone

## Projekt
FitZone ist eine responsive Web-App fuer Lisa's Fitnessstudio. Mitglieder buchen Kurse, Wartelisten und Personal-Training-Slots; Lisa verwaltet Mitglieder, Tarife, Kurse, Trainer, Videos, Sperren und Abrechnung.

## Status
Solo-Projekt. Dieses Repo ist dokumentationsgetrieben nach `docs/modus-operandi.md` aufgebaut. Vor Code-Aenderungen immer zuerst die relevanten Projektartefakte lesen.

## Was bauen wir?
- Produkt, Scope und Business Rules: `docs/spec.md`
- Operative Features mit stabilen IDs: `docs/backlog.md`

## Tech-Stack + Architektur
- Technische Leitplanken, Datenmodell und Modulgrenzen: `docs/architecture.md`
- Architektur- und Produktentscheidungen: `docs/decisions.md`

## Arbeitsweise
- Solo-Workflow: `docs/modus-operandi.md`
- Feature-Konzepte vor komplexer Umsetzung: `docs/concepts/`

## Coding-Prinzipien

**1. Think Before Coding.** Annahmen explizit machen. Bei Mehrdeutigkeit Interpretationen aufzeigen statt still zu raten. Wenn etwas unklar ist: stoppen und fragen.

**2. Simplicity First.** Minimum Code, der das Problem loest. Keine Features ueber das Gefragte hinaus. Keine Abstraktionen fuer Single-Use-Code.

**3. Surgical Changes.** Nur anfassen, was noetig ist. Existierenden Stil matchen. Keine ungefragten Architektur-Refactorings.

**4. Goal-Driven Execution.** Erfolgskriterien vor Implementierung klaeren. Bei Bugs zuerst reproduzierbaren Test/Check, dann Fix bis verifiziert.

## Projektkonventionen
- UI-Sprache: Deutsch.
- Branding: FitZone, Orange/Schwarz/Clean-Weiss, funktional und uebersichtlich.
- Rollen strikt trennen: `Member` und `Admin`.
- Business Rules aus `docs/spec.md` sind verbindlich, besonders Buchungslimits, Warteliste, Storno, No-Show, Trainerqualifikation und PT-Abrechnung.
- Datums-/Zeitlogik bewusst behandeln: Kurszeiten, Buchungsfenster, Stornofristen und Vertragsende duerfen keine Timezone-Nebenwirkungen haben.
- Geldwerte als Decimal/Integer-Cents modellieren, nicht als Floating-Point-Rechenbasis.
- Secrets nie in Code, Docs oder KI-Konversationen schreiben. `.env` bleibt lokal, `.env.example` enthaelt nur Platzhalter.

## Session-Ende
- Tests/Checks ausfuehren, sobald ein technischer Stack vorhanden ist.
- `docs/backlog.md` bei Statusaenderungen aktualisieren.
- `docs/decisions.md` aktualisieren, wenn eine Architektur- oder Produktentscheidung getroffen wurde.
