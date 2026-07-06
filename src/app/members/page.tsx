"use client";

import { useEffect, useMemo, useState } from "react";

type MembershipTier = {
  id: string;
  name: string;
  monthlyPrice: string;
};

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  sepaIban: string;
  status: string;
  contractEndDate: string;
  membershipTier: MembershipTier;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  sepaIban: "",
  status: "ACTIVE",
  membershipTierId: "",
  contractEndDate: ""
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    const response = await fetch("/api/members");
    const data = await response.json();
    setMembers(data.members ?? []);
    setTiers(data.tiers ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/members/${editingId}` : "/api/members";

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

    setMessage(editingId ? "Mitglied aktualisiert" : "Mitglied angelegt");
    resetForm();
    await loadMembers();
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      sepaIban: member.sepaIban,
      status: member.status,
      membershipTierId: member.membershipTier.id,
      contractEndDate: member.contractEndDate.slice(0, 10)
    });
  };

  const removeMember = async (memberId: string) => {
    const response = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    if (response.ok) {
      await loadMembers();
      setMessage("Mitglied gelöscht");
    }
  };

  const tierOptions = useMemo(() => tiers, [tiers]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-008</p>
          <h1>Mitgliederverwaltung</h1>
          <p className="intro">
            Lisa kann Mitglieder anlegen, bearbeiten und verwalten. Die Basis für spätere Buchungen, Sperren und Vertragswarnungen ist damit vorhanden.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Mitglied bearbeiten" : "Neues Mitglied anlegen"}</h2>
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
              SEPA-IBAN
              <input name="sepaIban" value={form.sepaIban} onChange={handleChange} required />
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="ACTIVE">Aktiv</option>
                <option value="PAUSED">Gesperrt</option>
                <option value="TERMINATED">Beendet</option>
              </select>
            </label>
            <label>
              Tarif
              <select name="membershipTierId" value={form.membershipTierId} onChange={handleChange} required>
                <option value="">Bitte wählen</option>
                {tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            </label>
            <label>
              Vertragsende
              <input type="date" name="contractEndDate" value={form.contractEndDate} onChange={handleChange} required />
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
        <h2>Mitglieder</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : members.length === 0 ? (
          <p>Noch keine Mitglieder angelegt.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {members.map((member) => (
              <article key={member.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{member.firstName} {member.lastName}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{member.email}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Tarif: {member.membershipTier.name} · Status: {member.status}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Vertragsende: {member.contractEndDate.slice(0, 10)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(member)}>Bearbeiten</button>
                    <button type="button" onClick={() => void removeMember(member.id)}>Löschen</button>
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
