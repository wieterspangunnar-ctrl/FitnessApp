"use client";

import { useEffect, useState } from "react";

type Trainer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hourlyPtRate: string;
};

type TrainerForm = {
  firstName: string;
  lastName: string;
  email: string;
  hourlyPtRate: string;
};

const emptyForm: TrainerForm = {
  firstName: "",
  lastName: "",
  email: "",
  hourlyPtRate: ""
};

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [form, setForm] = useState<TrainerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTrainers = async () => {
    const response = await fetch("/api/trainers");
    const data = await response.json();
    setTrainers(data.trainers ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadTrainers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/trainers/${editingId}` : "/api/trainers";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage(editingId ? "Trainer aktualisiert" : "Trainer angelegt");
    resetForm();
    await loadTrainers();
  };

  const startEdit = (trainer: Trainer) => {
    setEditingId(trainer.id);
    setForm({
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      hourlyPtRate: trainer.hourlyPtRate
    });
    setMessage(null);
  };

  const removeTrainer = async (trainerId: string) => {
    const response = await fetch(`/api/trainers/${trainerId}`, { method: "DELETE" });
    if (response.ok) {
      setMessage("Trainer gelöscht");
      await loadTrainers();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-010</p>
          <h1>Trainer verwalten</h1>
          <p className="intro">
            Lisa kann hier Trainer anlegen, bearbeiten und löschen. Jeder Trainer erhält E-Mail und PT-Stundensatz.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Trainer bearbeiten" : "Neuen Trainer anlegen"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Vorname
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </label>
            <label>
              Nachname
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </label>
            <label>
              E-Mail
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              PT-Stundensatz
              <input name="hourlyPtRate" value={form.hourlyPtRate} onChange={handleChange} placeholder="z. B. 65.00" required />
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
        <h2>Trainerliste</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : trainers.length === 0 ? (
          <p>Noch keine Trainer angelegt.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {trainers.map((trainer) => (
              <article key={trainer.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{trainer.firstName} {trainer.lastName}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{trainer.email}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      PT-Stundensatz: {trainer.hourlyPtRate} €
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(trainer)}>Bearbeiten</button>
                    <button type="button" onClick={() => void removeTrainer(trainer.id)}>Löschen</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
