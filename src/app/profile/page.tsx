"use client";

import { useEffect, useState } from "react";

type MembershipTier = {
  id: string;
  name: string;
  monthlyPrice: string;
  bookingWindowDays: number;
  hasVideoAccess: boolean;
  hasFreeLateCancellation: boolean;
  includedPtSlotsPerMonth: number;
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

export default function ProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch("/api/profile");
      const data = await response.json();
      setMember(data.member ?? null);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-026</p>
          <h1>Mein Profil</h1>
          <p className="intro">
            Mitglieder sehen hier ihre Stammdaten, ihren Tarif und wichtige Vertragsinformationen in einer übersichtlichen Ansicht.
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
          </div>
        )}
      </section>
    </main>
  );
}
