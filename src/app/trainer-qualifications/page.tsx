"use client";

import { useEffect, useMemo, useState } from "react";

type Trainer = { id: string; firstName: string; lastName: string };
type CourseType = { id: string; name: string };
type TrainerQualification = { id: string; trainer: Trainer; courseType: CourseType };

type Form = { trainerId: string; courseTypeId: string };

const emptyForm: Form = {
  trainerId: "",
  courseTypeId: ""
};

export default function TrainerQualificationsPage() {
  const [qualifications, setQualifications] = useState<TrainerQualification[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [qualRes, trainersRes, courseTypesRes] = await Promise.all([
      fetch("/api/trainer-qualifications"),
      fetch("/api/trainers"),
      fetch("/api/course-types")
    ]);

    const qualData = await qualRes.json();
    const trainersData = await trainersRes.json();
    const courseTypesData = await courseTypesRes.json();

    setQualifications(qualData.trainerQualifications ?? []);
    setTrainers(trainersData.trainers ?? []);
    setCourseTypes(courseTypesData.courseTypes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setMessage(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!form.trainerId || !form.courseTypeId) {
      setMessage("Bitte Trainer und Kursart wählen.");
      return;
    }

    const response = await fetch("/api/trainer-qualifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage("Trainerqualifikation hinzugefügt");
    resetForm();
    await loadData();
  };

  const removeQualification = async (id: string) => {
    const response = await fetch(`/api/trainer-qualifications/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
      return;
    }

    setMessage("Trainerqualifikation gelöscht");
    await loadData();
  };

  const trainerOptions = useMemo(
    () => trainers.map((trainer) => ({
      value: trainer.id,
      label: `${trainer.firstName} ${trainer.lastName}`
    })),
    [trainers]
  );

  const courseTypeOptions = useMemo(
    () => courseTypes.map((courseType) => ({
      value: courseType.id,
      label: courseType.name
    })),
    [courseTypes]
  );

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-019</p>
          <h1>Trainerqualifikationen verwalten</h1>
          <p className="intro">
            Lisa verknüpft Trainer mit Kursarten. Nur freigegebene Trainer dürfen später für eine Kursart ausgewählt werden.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Neue Qualifikation anlegen</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Trainer
              <select name="trainerId" value={form.trainerId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {trainerOptions.map((trainer) => (
                  <option key={trainer.value} value={trainer.value}>{trainer.label}</option>
                ))}
              </select>
            </label>

            <label>
              Kursart
              <select name="courseTypeId" value={form.courseTypeId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {courseTypeOptions.map((courseType) => (
                  <option key={courseType.value} value={courseType.value}>{courseType.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={resetForm}>Zurücksetzen</button>
          </div>

          {message ? <p>{message}</p> : null}
        </form>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Bestehende Qualifikationen</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : qualifications.length === 0 ? (
          <p>Noch keine Trainerqualifikationen vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {qualifications.map((qualification) => (
              <article key={qualification.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{qualification.trainer.firstName} {qualification.trainer.lastName}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Kursart: {qualification.courseType.name}
                    </p>
                  </div>
                  <button type="button" onClick={() => void removeQualification(qualification.id)}>Löschen</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
