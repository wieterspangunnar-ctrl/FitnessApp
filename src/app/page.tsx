const modules = [
  "Mitglieder",
  "Tarife",
  "Kurse",
  "Buchungen",
  "Personal Training",
  "Videos"
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
          <article className="module-card" key={module}>
            <h2>{module}</h2>
            <p>Bereit fuer die Umsetzung nach Backlog und Business Rules.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
