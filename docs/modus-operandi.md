# modus-operandi.md - FitZone Solo-Projekt

_Stand: 2026-06-26_

Dieses Projekt nutzt eine leichte Solo-Version von Modus Operandi: Markdown im Repo ist die Single Source of Truth, damit Mensch und AI denselben Kontext lesen.

## Prinzipien

1. **Artefakte > Ad-hoc-Kontext.** Wenn es nicht in `docs/spec.md`, `docs/architecture.md`, `docs/backlog.md` oder `docs/decisions.md` steht, ist es nicht belastbar.
2. **Markdown = Single Source of Truth.** Kein paralleles PM-System fuer Kernwahrheiten.
3. **Kontext vor Code.** Jede Session startet mit den relevanten Docs.
4. **Output > Input.** Erledigt ist, was verifiziert und dokumentiert ist.
5. **Kleine Schritte.** Ein Feature oder ein klarer Fix pro Session.
6. **Entscheidungen festhalten.** Architektur- und Produktentscheidungen gehoeren in `docs/decisions.md`.
7. **Spec bleibt fuehrend.** Fachlicher Scope gehoert in `docs/spec.md`, nicht in ein separates PRD.

## Dokumentenstruktur

```text
FitZone/
├── CLAUDE.md
├── AGENTS.md
├── spec.md
└── docs/
    ├── spec.md
    ├── backlog.md
    ├── architecture.md
    ├── decisions.md
    ├── modus-operandi.md
    ├── concepts/
    └── audit/
```

## Artefakte

| Artefakt | Zweck | Wann aktualisieren |
|----------|-------|--------------------|
| `CLAUDE.md` | AI-Briefing fuer Claude | Wenn Projektkonventionen oder Gotchas entstehen |
| `AGENTS.md` | AI-Briefing fuer Codex | Wenn Codex-spezifische Regeln noetig werden |
| `docs/spec.md` | Fachliche Spezifikation, Scope, Datenmodell und Business Rules | Bei fachlicher Scope-Aenderung |
| `docs/architecture.md` | Wie das System technisch gebaut wird | Bei Stack-, Modul- oder Datenmodellentscheidungen |
| `docs/backlog.md` | Operative Feature-Liste mit stabilen IDs | Bei jeder Feature-Statusaenderung |
| `docs/decisions.md` | Warum etwas entschieden wurde | Bei Architektur- und Produktentscheidungen |
| `docs/concepts/` | Plan-Dokumente fuer komplexe Features | Vor Umsetzung risikoreicher Features |
| `docs/audit/` | Security- und Codebase-Audits | Regelmaessig oder vor Releases |

## Session-Workflow

### 1. Kontext laden

Vor Implementierung lesen:

- `CLAUDE.md` oder `AGENTS.md`
- `docs/spec.md`
- `docs/architecture.md`
- `docs/backlog.md`, wenn ein Feature betroffen ist
- `docs/decisions.md`, wenn bestehende Entscheidungen relevant sind

### 2. Aufgabe definieren

Jede Aufgabe bekommt:

- Feature-ID aus `docs/backlog.md`, falls Feature-Arbeit
- Akzeptanzkriterien
- relevante Risiken
- Verifikation: Tests, manuelle Checks oder Doc-Review

### 3. Plan vor Code

Vor groesseren Aenderungen kurz festhalten:

- betroffene Dateien
- Datenmodell/API/UI-Auswirkungen
- Migrations- oder Sicherheitsrisiken
- Checks nach Umsetzung

### 4. Implementieren und testen

- Kleinste sinnvolle Aenderung bauen.
- Business Rules aus `docs/spec.md` serverseitig absichern.
- Tests/Checks ausfuehren, sobald ein Stack existiert.

### 5. Session abschliessen

- Backlog-Status aktualisieren.
- Neue Entscheidungen in `docs/decisions.md` dokumentieren.
- Bei komplexem Feature Konzept ergaenzen.
- Commit-Message im Conventional-Commits-Stil vorbereiten, idealerweise mit Feature-ID.

## Backlog-Regeln

- IDs haben das Format `FZ-NNN`.
- IDs werden nie wiederverwendet.
- Commits, Konzepte und Entscheidungen referenzieren die ID.
- `docs/spec.md` enthaelt den fachlichen Scope; Phasenzuordnung passiert ueber `docs/backlog.md`.

## INBOX-Regel

Keine `docs/INBOX.md` im Default. Erst einfuehren, wenn parallele Doc-Edits aus mehreren Worktrees/Maschinen Konflikte erzeugen.

## Audits

- Codebase-Audit nach groesseren Bauabschnitten oder ca. alle 5-10 Sessions.
- Security-Review vor erstem echten Deployment und danach regelmaessig.
- Ergebnisse in `docs/audit/YYYY-MM-DD-thema.md` speichern.

## Quellenmethodik

Diese lokale Struktur ist aus `jacekzawisza/modus-operandi` abgeleitet und fuer ein Solo-Projekt reduziert: keine Team-Missionen, keine Meeting-Ordner, keine Results-Schicht, kein separates PRD und keine INBOX im Default. Die fachliche Fuehrung liegt in `docs/spec.md`.
