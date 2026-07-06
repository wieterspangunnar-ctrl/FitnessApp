"use client";

import { useEffect, useState } from "react";

type CourseType = { id: string; name: string };

type Form = { name: string };
const emptyForm: Form = { name: "" };

export default function CourseTypesPage() {
  const [items, setItems] = useState<CourseType[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/course-types");
    const data = await res.json();
    setItems(data.courseTypes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/course-types/${editingId}` : "/api/course-types";

    const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage(editingId ? "Kursart aktualisiert" : "Kursart angelegt");
    reset();
    await load();
  };

  const startEdit = (item: CourseType) => {
    setEditingId(item.id);
    setForm({ name: item.name });
    setMessage(null);
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/course-types/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Kursart gelöscht");
      await load();
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-011</p>
          <h1>Kursarten verwalten</h1>
          <p className="intro">Kursarten (z. B. Yoga, HIIT) zentral anlegen. Namen müssen eindeutig sein.</p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Kursart bearbeiten" : "Neue Kursart anlegen"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={reset}>Zurücksetzen</button>
          </div>

          {message ? <p>{message}</p> : null}
        </form>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Kursarten</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : items.length === 0 ? (
          <p>Keine Kursarten vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {items.map((it) => (
              <article key={it.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{it.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(it)}>Bearbeiten</button>
                    <button type="button" onClick={() => void remove(it.id)}>Löschen</button>
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
