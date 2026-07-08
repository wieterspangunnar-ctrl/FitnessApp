"use client";

import { useEffect, useState } from "react";

type WaitlistEntry = {
  id: string;
  position: number;
  member: { id: string; firstName: string; lastName: string; email: string };
  course: {
    id: string;
    startTime: string;
    endTime: string;
    courseType: { name: string };
    trainer: { firstName: string; lastName: string };
    room: { name: string };
  };
};

type WaitlistForm = {
  memberId: string;
  courseId: string;
  position: string;
};

const emptyForm: WaitlistForm = {
  memberId: "",
  courseId: "",
  position: "1"
};

export default function WaitlistsPage() {
  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);
  const [form, setForm] = useState<WaitlistForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; courseType: { name: string }; startTime: string; endTime: string }[]>([]);

  const loadWaitlists = async () => {
    const [waitlistsResponse, membersResponse, coursesResponse] = await Promise.all([
      fetch("/api/waitlists"),
      fetch("/api/members"),
      fetch("/api/courses")
    ]);

    const waitlistsData = await waitlistsResponse.json();
    const membersData = await membersResponse.json();
    const coursesData = await coursesResponse.json();

    setWaitlists(waitlistsData.waitlists ?? []);
    setMembers(membersData.members ?? []);
    setCourses(coursesData.courses ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadWaitlists();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/waitlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Speichern fehlgeschlagen");
      return;
    }

    setMessage("Wartelisten-Eintrag angelegt");
    setForm(emptyForm);
    await loadWaitlists();
  };

  const removeEntry = async (waitlistId: string) => {
    const response = await fetch(`/api/waitlists/${waitlistId}`, { method: "DELETE" });
    if (response.ok) {
      setMessage("Eintrag gelöscht");
      await loadWaitlists();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-025</p>
          <h1>Wartelisten verwalten</h1>
          <p className="intro">Mitglieder können für Kurse auf Wartelisten gesetzt werden, die Position wird sauber verwaltet.</p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Neuen Wartelisten-Eintrag anlegen</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Mitglied
              <select name="memberId" value={form.memberId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Kurs
              <select name="courseId" value={form.courseId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseType.name} · {new Date(course.startTime).toLocaleString("de-DE")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Position
              <input name="position" type="number" min="1" value={form.position} onChange={handleChange} required />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit">Speichern</button>
            <button type="button" onClick={() => setForm(emptyForm)}>Zurücksetzen</button>
          </div>

          {message ? <p>{message}</p> : null}
        </form>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Wartelisten</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : waitlists.length === 0 ? (
          <p>Noch keine Wartelisteneinträge vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {waitlists.map((entry) => (
              <article key={entry.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {entry.member.firstName} {entry.member.lastName}
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {entry.course.courseType.name} · Position {entry.position}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {new Date(entry.course.startTime).toLocaleString("de-DE")} · {entry.course.room.name} · Trainer {entry.course.trainer.firstName} {entry.course.trainer.lastName}
                    </p>
                  </div>
                  <div>
                    <button type="button" onClick={() => void removeEntry(entry.id)}>Löschen</button>
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
