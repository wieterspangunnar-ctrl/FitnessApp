"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  status: string;
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      setBookings(data.bookings ?? []);
      setLoading(false);
    };

    void loadBookings();
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-024</p>
          <h1>Kursbuchungen</h1>
          <p className="intro">Übersicht über bestätigte Kursbuchungen, inklusive Teilnehmer, Kurs und Zeit.</p>
        </div>
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
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{booking.status}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>Gebucht am {new Date(booking.bookedAt).toLocaleDateString("de-DE")}</p>
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
