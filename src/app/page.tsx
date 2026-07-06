import Link from "next/link";

const modules = [
  { title: "Mitglieder", description: "Mitgliederverwaltung inklusive Status, Tarif und Vertragsende.", href: "/members" },
  { title: "Tarife", description: "Tarifverwaltung mit Preis, Buchungsfenstern, Videozugriff und PT-Slots.", href: "/tiers" },
  { title: "Trainer", description: "Trainer im Studio verwalten mit E-Mail und PT-Stundensatz.", href: "/trainers" },
  { title: "Räume", description: "Räume für Kursplanung anlegen und verwalten.", href: "/rooms" },
  { title: "Kurse", description: "Kurse planen mit Kursart, Zeit, Kapazität, Raum und Trainer.", href: "/courses" },
  { title: "Kursarten", description: "Kursarten definieren und verwalten für die Kursplanung.", href: "/course-types" },
  { title: "Trainerqualifikationen", description: "Trainer für Kursarten freigeben, damit nur passende Trainer auswählbar sind.", href: "/trainer-qualifications" },
  { title: "Buchungen", description: "Bereit fuer die Umsetzung nach Backlog und Business Rules.", href: "/" },
  { title: "Personal Training", description: "Bereit fuer die Umsetzung nach Backlog und Business Rules.", href: "/" },
  { title: "Videos", description: "Bereit fuer die Umsetzung nach Backlog und Business Rules.", href: "/" }
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FitZone Foundation</p>
          <h1>Lisa's Studio bekommt ein stabiles App-Geruest.</h1>
          <p className="intro">
            Next.js App Router, Prisma und SQLite sind vorbereitet. Die
            fachlichen Module folgen dokumentationsgetrieben aus Spec und
            Backlog.
          </p>
        </div>
      </section>

      <section className="module-grid" aria-label="Geplante Module">
        {modules.map((module) => (
          <article className="module-card" key={module.title}>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            {module.href !== "/" ? (
              <p style={{ marginTop: 12 }}>
                <Link href={module.href}>Zur Verwaltung öffnen</Link>
              </p>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
