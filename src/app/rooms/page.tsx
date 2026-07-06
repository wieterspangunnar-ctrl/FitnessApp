"use client";

import { useEffect, useState } from "react";

type Room = { id: string; name: string };
type RoomForm = { name: string };

const emptyForm: RoomForm = { name: "" };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    const response = await fetch("/api/rooms");
    const data = await response.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadRooms();
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
    const endpoint = editingId ? `/api/rooms/${editingId}` : "/api/rooms";

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

    setMessage(editingId ? "Raum aktualisiert" : "Raum angelegt");
    resetForm();
    await loadRooms();
  };

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setForm({ name: room.name });
    setMessage(null);
  };

  const removeRoom = async (roomId: string) => {
    const response = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
    if (response.ok) {
      setMessage("Raum gelöscht");
      await loadRooms();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-013</p>
          <h1>Räume verwalten</h1>
          <p className="intro">Räume anlegen und bearbeiten. Jeder Raum braucht einen eindeutigen Namen für Kurstermine.</p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Raum bearbeiten" : "Neuen Raum anlegen"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={resetForm}>Zurücksetzen</button>
          </div>

          {message ? <p>{message}</p> : null}
        </form>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Räume</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : rooms.length === 0 ? (
          <p>Noch keine Räume vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {rooms.map((room) => (
              <article key={room.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{room.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(room)}>Bearbeiten</button>
                    <button type="button" onClick={() => void removeRoom(room.id)}>Löschen</button>
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
