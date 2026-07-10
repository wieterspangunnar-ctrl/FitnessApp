"use client";

import { useEffect, useState } from "react";

const BOOKING_STATUSES = ["CONFIRMED", "CANCELLED_LATE", "CANCELLED_TIMELY", "NO_SHOW"] as const;

type BookingStatus = (typeof BOOKING_STATUSES)[number];

type Booking = {
  id: string;
  status: BookingStatus;
  bookedAt: string;
  member: { firstName: string; lastName: string; email: string };
  course: {
    id: string;
    startTime: string;
    endTime: string;
    courseType: { name: string };
    trainer: { firstName: string; lastName: string };
    room: { name: string };
  };
};

type MemberOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type CourseOption = {
  id: string;
  startTime: string;
  endTime: string;
  courseType: { name: string };
};

type BookingForm = {
  memberId: string;
  courseId: string;
};

const emptyForm: BookingForm = {
  memberId: "",
  courseId: ""
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [bookingsResponse, membersResponse, coursesResponse] = await Promise.all([
      fetch("/api/bookings"),
      fetch("/api/members"),
      fetch("/api/courses")
    ]);

    const bookingsData = await bookingsResponse.json();
    const membersData = await membersResponse.json();
    const coursesData = await coursesResponse.json();

    const nextBookings = (bookingsData.bookings ?? []) as Booking[];
    setBookings(nextBookings);
    setMembers((membersData.members ?? []) as MemberOption[]);
    setCourses((coursesData.courses ?? []) as CourseOption[]);
    setStatusDrafts(
      nextBookings.reduce<Record<string, BookingStatus>>((acc, booking) => {
        acc[booking.id] = booking.status;
        return acc;
      }, {})
    );
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Buchung konnte nicht angelegt werden");
      return;
    }

    setMessage("Buchung wurde angelegt");
    setForm(emptyForm);
    await loadData();
  };

  const updateStatus = async (bookingId: string) => {
    setMessage(null);
    const status = statusDrafts[bookingId];

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Status konnte nicht aktualisiert werden");
      return;
    }

    setMessage("Buchungsstatus aktualisiert");
    await loadData();
  };

  const cancelBooking = async (bookingId: string) => {
    setMessage(null);

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE"
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Stornierung fehlgeschlagen");
      return;
    }

    setMessage("Buchung storniert");
    await loadData();
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-041</p>
          <h1>Kursbuchungen</h1>
          <p className="intro">Lisa kann Buchungen zentral anlegen, stornieren und Statuswerte wie NO_SHOW direkt steuern.</p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Neue Buchung anlegen</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Mitglied
              <select name="memberId" value={form.memberId} onChange={handleFormChange} required>
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
              <select name="courseId" value={form.courseId} onChange={handleFormChange} required>
                <option value="">Bitte wählen</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseType.name} · {new Date(course.startTime).toLocaleString("de-DE")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit">Buchung anlegen</button>
            <button type="button" onClick={() => setForm(emptyForm)}>Zurücksetzen</button>
          </div>
        </form>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>Buchungsübersicht</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : bookings.length === 0 ? (
          <p>Noch keine Buchungen vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {bookings.map((booking) => (
              <article key={booking.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {booking.member.firstName} {booking.member.lastName}
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {booking.course.courseType.name} · {new Date(booking.course.startTime).toLocaleString("de-DE")}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Raum {booking.course.room.name} · Trainer {booking.course.trainer.firstName} {booking.course.trainer.lastName}
                    </p>
                  </div>
                  <div style={{ minWidth: 260 }}>
                    <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>Gebucht am {new Date(booking.bookedAt).toLocaleDateString("de-DE")}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={statusDrafts[booking.id] ?? booking.status}
                        onChange={(event) => {
                          const value = event.target.value as BookingStatus;
                          setStatusDrafts((current) => ({ ...current, [booking.id]: value }));
                        }}
                      >
                        {BOOKING_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => void updateStatus(booking.id)}>Status setzen</button>
                      <button type="button" onClick={() => void cancelBooking(booking.id)}>Stornieren</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}
      </section>
    </main>
  );
}
