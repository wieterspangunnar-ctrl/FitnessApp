"use client";

import { useEffect, useMemo, useState } from "react";

type MembershipTier = {
  id: string;
  name: string;
  monthlyPrice: string;
  bookingWindowDays: number;
  hasVideoAccess: boolean;
  hasFreeLateCancellation: boolean;
  includedPtSlotsPerMonth: number;
};

type CourseType = { id: string; name: string };
type Room = { id: string; name: string };
type Trainer = { id: string; firstName: string; lastName: string };
type Course = {
  id: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  confirmedBookingCount: number;
  availableSpots: number;
  courseType: CourseType;
  room: Room;
  trainer: Trainer;
};

type MemberProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  sepaIban: string;
  status: string;
  contractEndDate: string;
  membershipTier: MembershipTier;
};

type PersonalTrainingSlot = {
  id: string;
  startTime: string;
  endTime: string;
  trainer: { id: string; firstName: string; lastName: string; hourlyPtRate: string };
};

export default function ProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [availablePtSlots, setAvailablePtSlots] = useState<PersonalTrainingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const profileResponse = await fetch("/api/profile");
      const profileData = await profileResponse.json();
      const memberData = profileData.member ?? null;

      setMember(memberData);

      if (!memberData) {
        setCourses([]);
        setAvailablePtSlots([]);
        setLoading(false);
        return;
      }

      const [coursesResponse, ptSlotsResponse] = await Promise.all([
        fetch(`/api/courses?memberId=${memberData.id}`),
        fetch("/api/personal-training?onlyAvailable=true")
      ]);

      const coursesData = await coursesResponse.json();
      const ptSlotsData = await ptSlotsResponse.json();

      setCourses(coursesData.courses ?? []);
      setAvailablePtSlots((ptSlotsData.slots ?? []) as PersonalTrainingSlot[]);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const visibleCourses = useMemo(() => {
    return [...courses].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [courses]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-026</p>
          <h1>Mein Profil</h1>
          <p className="intro">
            Mitglieder sehen hier ihre Stammdaten, ihren Tarif, ihren Kurskalender und wichtige Vertragsinformationen in einer übersichtlichen Ansicht.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        {loading ? (
          <p>Profil wird geladen…</p>
        ) : !member ? (
          <p>Noch kein Profil vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>{member.firstName} {member.lastName}</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{member.email}</p>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div className="module-card" style={{ minHeight: "auto" }}>
                <h3 style={{ marginTop: 0 }}>Kontaktdaten</h3>
                <p><strong>E-Mail:</strong> {member.email}</p>
                <p><strong>IBAN:</strong> {member.sepaIban}</p>
              </div>
              <div className="module-card" style={{ minHeight: "auto" }}>
                <h3 style={{ marginTop: 0 }}>Mitgliedschaft</h3>
                <p><strong>Status:</strong> {member.status}</p>
                <p><strong>Tarif:</strong> {member.membershipTier.name}</p>
                <p><strong>Vertragsende:</strong> {member.contractEndDate.slice(0, 10)}</p>
              </div>
              <div className="module-card" style={{ minHeight: "auto" }}>
                <h3 style={{ marginTop: 0 }}>Tarifdetails</h3>
                <p><strong>Monatsbeitrag:</strong> {member.membershipTier.monthlyPrice}</p>
                <p><strong>Buchungsfenster:</strong> {member.membershipTier.bookingWindowDays} Tage</p>
                <p><strong>Videozugang:</strong> {member.membershipTier.hasVideoAccess ? "Ja" : "Nein"}</p>
                <p><strong>Freie Spätstornierung:</strong> {member.membershipTier.hasFreeLateCancellation ? "Ja" : "Nein"}</p>
                <p><strong>Freie PT-Slots:</strong> {member.membershipTier.includedPtSlotsPerMonth}</p>
              </div>
            </div>

            <div className="module-card" style={{ minHeight: "auto" }}>
              <h3 style={{ marginTop: 0 }}>Kurskalender</h3>
              <p style={{ marginTop: 0, color: "var(--muted)" }}>
                Dein Tarif erlaubt Einsicht in Kurse für die nächsten {member.membershipTier.bookingWindowDays} Tage.
              </p>
              {visibleCourses.length === 0 ? (
                <p>Aktuell sind keine Kurse im Buchungsfenster verfügbar.</p>
              ) : (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {visibleCourses.map((course) => (
                    <article key={course.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                      <h4 style={{ margin: 0 }}>{course.courseType.name}</h4>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        {new Date(course.startTime).toLocaleDateString("de-DE", { dateStyle: "medium", timeStyle: "short" })} – {new Date(course.endTime).toLocaleTimeString("de-DE", { timeStyle: "short" })}
                      </p>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        Trainer: {course.trainer.firstName} {course.trainer.lastName} · Raum: {course.room.name}
                      </p>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        Max. Teilnehmer: {course.maxParticipants}
                      </p>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        Freie Plätze: {course.availableSpots} / {course.maxParticipants}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="module-card" style={{ minHeight: "auto" }}>
              <h3 style={{ marginTop: 0 }}>Freie Personal-Training-Slots</h3>
              <p style={{ marginTop: 0, color: "var(--muted)" }}>
                Hier siehst du alle aktuell verfügbaren PT-Termine für die Direktbuchung.
              </p>
              {availablePtSlots.length === 0 ? (
                <p>Aktuell sind keine freien PT-Slots verfügbar.</p>
              ) : (
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {availablePtSlots.map((slot) => (
                    <article key={slot.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                      <h4 style={{ margin: 0 }}>
                        Trainer: {slot.trainer.firstName} {slot.trainer.lastName}
                      </h4>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        {new Date(slot.startTime).toLocaleDateString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                        {" "}bis{" "}
                        {new Date(slot.endTime).toLocaleTimeString("de-DE", { timeStyle: "short" })}
                      </p>
                      <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                        Stundensatz: {Number(slot.trainer.hourlyPtRate).toFixed(2)} EUR
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
