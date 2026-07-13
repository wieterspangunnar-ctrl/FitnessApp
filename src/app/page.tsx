import Link from "next/link";
import { getContractEndReminderCandidates } from "@/lib/contract-end-reminders";
import { getOpenPersonalTrainingChargesDashboardData } from "@/lib/personal-training-open-items";

export const dynamic = "force-dynamic";

const contractEndDateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "UTC"
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC"
});

const amountFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
});

const modules = [
  { title: "Mitglieder", description: "Mitgliederverwaltung inklusive Status, Tarif und Vertragsende.", href: "/members" },
  { title: "Profil", description: "Mitgliedsprofil mit Stammdaten, Vertrag und Tarifdetails für den Member-Bereich.", href: "/profile" },
  { title: "Tarife", description: "Tarifverwaltung mit Preis, Buchungsfenstern, Videozugriff und PT-Slots.", href: "/tiers" },
  { title: "Trainer", description: "Trainer im Studio verwalten mit E-Mail und PT-Stundensatz.", href: "/trainers" },
  { title: "Räume", description: "Räume für Kursplanung anlegen und verwalten.", href: "/rooms" },
  { title: "Kurse", description: "Kurse planen mit Kursart, Zeit, Kapazität, Raum und Trainer.", href: "/courses" },
  { title: "Kursarten", description: "Kursarten definieren und verwalten für die Kursplanung.", href: "/course-types" },
  { title: "Trainerqualifikationen", description: "Trainer für Kursarten freigeben, damit nur passende Trainer auswählbar sind.", href: "/trainer-qualifications" },
  { title: "Buchungen", description: "Kursbuchungen und Buchungsstatus im Admin-Überblick festhalten.", href: "/bookings" },
  { title: "Wartelisten", description: "Mitglieder für volle Kurse verwalten und Wartelistenpositionen sichtbar machen.", href: "/waitlists" },
  { title: "Personal Training", description: "PT-Slots verwalten und Bezahlstatus nachverfolgen.", href: "/personal-training" },
  { title: "Videos", description: "Bereit fuer die Umsetzung nach Backlog und Business Rules.", href: "/" }
];

function formatContractEndDate(contractEndDate: Date) {
  return contractEndDateFormatter.format(contractEndDate);
}

function formatDateTime(value: Date) {
  return dateTimeFormatter.format(value);
}

function formatAmountFromCents(cents: number) {
  return amountFormatter.format(cents / 100);
}

export default async function Home() {
  const contractWarnings = await getContractEndReminderCandidates();
  const totalContractWarnings = contractWarnings.dueIn3Days.length + contractWarnings.dueIn14Days.length;
  const openPtCharges = await getOpenPersonalTrainingChargesDashboardData();

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
          <p className="hero-highlight">
            {totalContractWarnings > 0
              ? `${totalContractWarnings} auslaufende Vertraege brauchen Aufmerksamkeit.`
              : "Aktuell gibt es keine auslaufenden Vertraege in den 14- oder 3-Tage-Fenstern."}
          </p>
        </div>
      </section>

      <section className="dashboard-panel" aria-labelledby="contract-warning-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Admin-Dashboard</p>
            <h2 id="contract-warning-heading">Warnliste Vertragsende</h2>
          </div>
          <Link href="/members">Mitgliederverwaltung oeffnen</Link>
        </div>

        {totalContractWarnings === 0 ? (
          <p className="panel-empty">Keine Vertraege laufen in 14 oder 3 Tagen aus.</p>
        ) : (
          <div className="warning-columns">
            <section className="warning-card warning-card-urgent" aria-labelledby="due-in-3-days-heading">
              <div className="warning-card-header">
                <h3 id="due-in-3-days-heading">In 3 Tagen faellig</h3>
                <span className="warning-count">{contractWarnings.dueIn3Days.length}</span>
              </div>

              {contractWarnings.dueIn3Days.length === 0 ? (
                <p className="warning-empty">Keine akuten Vertragsenden.</p>
              ) : (
                <ul className="warning-list">
                  {contractWarnings.dueIn3Days.map((member) => (
                    <li className="warning-item" key={member.id}>
                      <div>
                        <strong>
                          {member.firstName} {member.lastName}
                        </strong>
                        <p>{member.email}</p>
                      </div>
                      <time dateTime={member.contractEndDate.toISOString()}>
                        {formatContractEndDate(member.contractEndDate)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="warning-card" aria-labelledby="due-in-14-days-heading">
              <div className="warning-card-header">
                <h3 id="due-in-14-days-heading">In 14 Tagen faellig</h3>
                <span className="warning-count">{contractWarnings.dueIn14Days.length}</span>
              </div>

              {contractWarnings.dueIn14Days.length === 0 ? (
                <p className="warning-empty">Keine Vorwarnungen im 14-Tage-Fenster.</p>
              ) : (
                <ul className="warning-list">
                  {contractWarnings.dueIn14Days.map((member) => (
                    <li className="warning-item" key={member.id}>
                      <div>
                        <strong>
                          {member.firstName} {member.lastName}
                        </strong>
                        <p>{member.email}</p>
                      </div>
                      <time dateTime={member.contractEndDate.toISOString()}>
                        {formatContractEndDate(member.contractEndDate)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </section>

      <section className="dashboard-panel" aria-labelledby="pt-billing-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Admin-Dashboard</p>
            <h2 id="pt-billing-heading">Offene PT-Posten</h2>
          </div>
          <Link href="/personal-training">Personal Training oeffnen</Link>
        </div>

        <div className="billing-summary" role="status" aria-live="polite">
          <p>{openPtCharges.totalOpenItems} offene Posten</p>
          <strong>{formatAmountFromCents(openPtCharges.totalOpenAmountCents)}</strong>
        </div>

        {openPtCharges.totalOpenItems === 0 ? (
          <p className="panel-empty">Keine offenen PT-Posten. Alle PT-Leistungen sind bereits verrechnet oder bezahlt.</p>
        ) : (
          <ul className="billing-list" aria-label="Liste offener PT-Posten">
            {openPtCharges.items.map((entry) => (
              <li className="billing-item" key={entry.id}>
                <div>
                  <strong>
                    {entry.member.firstName} {entry.member.lastName}
                  </strong>
                  <p>{entry.member.email}</p>
                  {entry.personalTrainingBooking ? (
                    <p>
                      Slot: {formatDateTime(entry.personalTrainingBooking.startTime)} bei {entry.personalTrainingBooking.trainer.firstName} {entry.personalTrainingBooking.trainer.lastName}
                    </p>
                  ) : (
                    <p>PT-Slot: kein verknuepfter Termin vorhanden</p>
                  )}
                </div>
                <div className="billing-amount-block">
                  <strong>{formatAmountFromCents(entry.amountCents)}</strong>
                  <time dateTime={entry.createdAt.toISOString()}>
                    Erstellt: {formatDateTime(entry.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
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
