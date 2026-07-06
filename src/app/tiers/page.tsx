"use client";

import { useEffect, useState } from "react";

type MembershipTier = {
  id: string;
  name: string;
  monthlyPrice: string;
  maxCoursesPerMonth: number | null;
  hasVideoAccess: boolean;
  bookingWindowDays: number;
  hasFreeLateCancellation: boolean;
  includedPtSlotsPerMonth: number;
};

type TierForm = {
  name: string;
  monthlyPrice: string;
  maxCoursesPerMonth: string;
  hasVideoAccess: string;
  bookingWindowDays: string;
  hasFreeLateCancellation: string;
  includedPtSlotsPerMonth: string;
};

const emptyForm: TierForm = {
  name: "",
  monthlyPrice: "",
  maxCoursesPerMonth: "",
  hasVideoAccess: "false",
  bookingWindowDays: "",
  hasFreeLateCancellation: "false",
  includedPtSlotsPerMonth: "0"
};

export default function TiersPage() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [form, setForm] = useState<TierForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTiers = async () => {
    const response = await fetch("/api/tiers");
    const data = await response.json();
    setTiers(data.tiers ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadTiers();
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
    const endpoint = editingId ? `/api/tiers/${editingId}` : "/api/tiers";

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

    setMessage(editingId ? "Tarif aktualisiert" : "Tarif angelegt");
    resetForm();
    await loadTiers();
  };

  const startEdit = (tier: MembershipTier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name,
      monthlyPrice: tier.monthlyPrice,
      maxCoursesPerMonth: tier.maxCoursesPerMonth?.toString() ?? "",
      hasVideoAccess: tier.hasVideoAccess ? "true" : "false",
      bookingWindowDays: tier.bookingWindowDays.toString(),
      hasFreeLateCancellation: tier.hasFreeLateCancellation ? "true" : "false",
      includedPtSlotsPerMonth: tier.includedPtSlotsPerMonth.toString()
    });
    setMessage(null);
  };

  const removeTier = async (tierId: string) => {
    const response = await fetch(`/api/tiers/${tierId}`, { method: "DELETE" });
    if (response.ok) {
      setMessage("Tarif gelöscht");
      await loadTiers();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Löschen fehlgeschlagen");
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">FZ-009</p>
          <h1>Tarife verwalten</h1>
          <p className="intro">
            Hier legt Lisa die Membership-Tarife fest. Preis, Buchungsfenster, Videozugriff, Stornoregeln und Premium-PT-Slots werden zentral gesteuert.
          </p>
        </div>
      </section>

      <section className="module-card" style={{ marginTop: 24 }}>
        <h2>{editingId ? "Tarif bearbeiten" : "Neuen Tarif anlegen"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Monats­preis
              <input name="monthlyPrice" value={form.monthlyPrice} onChange={handleChange} placeholder="z. B. 129.00" required />
            </label>
            <label>
              Kurslimit / Monat
              <input name="maxCoursesPerMonth" value={form.maxCoursesPerMonth} onChange={handleChange} placeholder="leer = unbegrenzt" />
            </label>
            <label>
              Videozugriff
              <select name="hasVideoAccess" value={form.hasVideoAccess} onChange={handleChange}>
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </label>
            <label>
              Buchungs­fenster (Tage)
              <input name="bookingWindowDays" value={form.bookingWindowDays} onChange={handleChange} required />
            </label>
            <label>
              Kostenlose Spät­stornierung
              <select name="hasFreeLateCancellation" value={form.hasFreeLateCancellation} onChange={handleChange}>
                <option value="true">Ja</option>
                <option value="false">Nein</option>
              </select>
            </label>
            <label>
              Inklusive PT-Slots / Monat
              <input name="includedPtSlotsPerMonth" value={form.includedPtSlotsPerMonth} onChange={handleChange} required />
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
        <h2>Tarifübersicht</h2>
        {loading ? (
          <p>Wird geladen…</p>
        ) : tiers.length === 0 ? (
          <p>Keine Tarife vorhanden.</p>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {tiers.map((tier) => (
              <article key={tier.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{tier.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      {tier.monthlyPrice} € · {tier.maxCoursesPerMonth ?? "unbegrenzt"} Kurse/Monat
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Buchungsfenster: {tier.bookingWindowDays} Tage · Videozugriff: {tier.hasVideoAccess ? "Ja" : "Nein"}
                    </p>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Spätstorno kostenlos: {tier.hasFreeLateCancellation ? "Ja" : "Nein"} · PT-Slots: {tier.includedPtSlotsPerMonth}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => startEdit(tier)}>Bearbeiten</button>
                    <button type="button" onClick={() => void removeTier(tier.id)}>Löschen</button>
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
