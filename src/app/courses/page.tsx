"use client";

import { useEffect, useMemo, useState } from "react";

type CourseType = { id: string; name: string };
type Room = { id: string; name: string };
type Trainer = { id: string; firstName: string; lastName: string };
type Course = {
  id: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  courseType: CourseType;
  room: Room;
  trainer: Trainer;
};

type CourseForm = {
  courseTypeId: string;
  startTime: string;
  endTime: string;
  maxParticipants: string;
  roomId: string;
  trainerId: string;
};

const emptyForm: CourseForm = {
  courseTypeId: "",
  startTime: "",
  endTime: "",
  maxParticipants: "",
  roomId: "",
  trainerId: ""
};

function formatToLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [coursesRes, courseTypesRes, roomsRes, trainersRes] = await Promise.all([
      fetch("/api/courses"),
      fetch("/api/course-types"),
      fetch("/api/rooms"),
      fetch("/api/trainers")
    ]);

    const coursesData = await coursesRes.json();
    const courseTypesData = await courseTypesRes.json();
    const roomsData = await roomsRes.json();
    const trainersData = await trainersRes.json();

    setCourses(coursesData.courses ?? []);
    setCourseTypes(courseTypesData.courseTypes ?? []);
    setRooms(roomsData.rooms ?? []);
    setTrainers(trainersData.trainers ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/courses/${editingId}` : "/api/courses";

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

    setMessage(editingId ? "Kurs aktualisiert" : "Kurs angelegt");
    resetForm();
    await loadData();
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      courseTypeId: course.courseType.id,
      startTime: formatToLocalDateTime(course.startTime),
      endTime: formatToLocalDateTime(course.endTime),
      maxParticipants: String(course.maxParticipants),
      roomId: course.room.id,
      trainerId: course.trainer.id
    });
    setMessage(null);
  };

  const removeCourse = async (courseId: string) => {
    const response = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (response.ok) {
      setMessage("Kurs gelöscht");
      await loadData();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  const trainerLabel = useMemo(
    () => (trainerId: string) => {
      const trainer = trainers.find((item) => item.id === trainerId);
      return trainer ? `${trainer.firstName} ${trainer.lastName}` : "Unbekannt";
    },
    [trainers]
  );

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-014</p>
          <h1>Kurse verwalten</h1>
          <p className="intro">
            Hier legt Lisa Kurstermine an. Jeder Kurs braucht Kursart, Zeit, Kapazität, Raum und Trainer.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Kurs bearbeiten" : "Neuen Kurs anlegen"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Kursart
              <select name="courseTypeId" value={form.courseTypeId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {courseTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Trainer
              <select name="trainerId" value={form.trainerId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {trainers.map((item) => (
                  <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>
                ))}
              </select>
            </label>
            <label>
              Raum
              <select name="roomId" value={form.roomId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {rooms.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Startzeit
              <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
            </label>
            <label>
              Endzeit
              <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
            </label>
            <label>
              Max. Teilnehmer
              <input type="number" min="1" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} required />
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
        <h2>Kursübersicht</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : courses.length === 0 ? (
          <p>Noch keine Kurse angelegt.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {courses.map((course) => (
              <article key={course.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{course.courseType.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Trainer: {course.trainer.firstName} {course.trainer.lastName} · Raum: {course.room.name}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {new Date(course.startTime).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })} – {new Date(course.endTime).toLocaleString("de-DE", { timeStyle: "short" })}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Max. Teilnehmer: {course.maxParticipants}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(course)}>Bearbeiten</button>
                    <button type="button" onClick={() => void removeCourse(course.id)}>Löschen</button>
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
