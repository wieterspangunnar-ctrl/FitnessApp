"use client";

import { useEffect, useState } from "react";

const PT_STATUSES = ["AVAILABLE", "BOOKED", "COMPLETED", "CANCELLED_BY_TRAINER"] as const;
const BILLING_STATUSES = ["PENDING", "BILLED_TO_ACCOUNT", "PAID"] as const;

type PtStatus = (typeof PT_STATUSES)[number];
type BillingStatus = (typeof BILLING_STATUSES)[number];

type Trainer = { id: string; firstName: string; lastName: string; hourlyPtRate: string };
type MemberOption = { id: string; firstName: string; lastName: string };

type OpenPtChargeItem = {
  id: string;
  amountCents: number;
  createdAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  personalTrainingBooking: {
    id: string;
    startTime: string;
    endTime: string;
    trainer: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
};

type MonthClosingData = {
  items: OpenPtChargeItem[];
  totalOpenItems: number;
  totalOpenAmountCents: number;
};

type PtSlot = {
  id: string;
  startTime: string;
  endTime: string;
  status: PtStatus;
  isFreePremiumSlot: boolean;
  billingStatus: BillingStatus;
  trainer: { id: string; firstName: string; lastName: string; hourlyPtRate: string };
  member: { id: string; firstName: string; lastName: string; membershipTier: { name: string; includedPtSlotsPerMonth: number } } | null;
};

type SlotForm = {
  trainerId: string;
  startTime: string;
  endTime: string;
};

const emptyForm: SlotForm = { trainerId: "", startTime: "", endTime: "" };

const STATUS_LABELS: Record<PtStatus, string> = {
  AVAILABLE: "Verfügbar",
  BOOKED: "Gebucht",
  COMPLETED: "Abgeschlossen",
  CANCELLED_BY_TRAINER: "Abgesagt (Trainer)"
};

const BILLING_LABELS: Record<BillingStatus, string> = {
  PENDING: "Offen",
  BILLED_TO_ACCOUNT: "Berechnet",
  PAID: "Bezahlt"
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PersonalTrainingPage() {
  const [slots, setSlots] = useState<PtSlot[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [form, setForm] = useState<SlotForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMonthClosingExporting, setIsMonthClosingExporting] = useState(false);
  const [monthClosingData, setMonthClosingData] = useState<MonthClosingData>({
    items: [],
    totalOpenItems: 0,
    totalOpenAmountCents: 0
  });
  const [statusDrafts, setStatusDrafts] = useState<Record<string, PtStatus>>({});
  const [billingDrafts, setBillingDrafts] = useState<Record<string, BillingStatus>>({});

  const loadData = async () => {
    const [slotsRes, trainersRes, membersRes] = await Promise.all([
      fetch("/api/personal-training"),
      fetch("/api/trainers"),
      fetch("/api/members")
    ]);
    const monthClosingRes = await fetch("/api/personal-training/month-closing");

    const slotsData = await slotsRes.json();
    const trainersData = await trainersRes.json();
    const membersData = await membersRes.json();
    const monthClosingResponse = await monthClosingRes.json();

    const nextSlots = (slotsData.slots ?? []) as PtSlot[];
    setSlots(nextSlots);
    setTrainers((trainersData.trainers ?? []) as Trainer[]);
    setMembers((membersData.members ?? []) as MemberOption[]);
    setMonthClosingData(monthClosingResponse as MonthClosingData);

    setStatusDrafts(
      nextSlots.reduce<Record<string, PtStatus>>((acc, s) => { acc[s.id] = s.status; return acc; }, {})
    );
    setBillingDrafts(
      nextSlots.reduce<Record<string, BillingStatus>>((acc, s) => { acc[s.id] = s.billingStatus; return acc; }, {})
    );

    setLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await fetch("/api/personal-training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Slot konnte nicht angelegt werden");
      return;
    }

    setMessage("Slot wurde angelegt");
    setForm(emptyForm);
    await loadData();
  };

  const updateSlot = async (id: string, patch: Record<string, unknown>) => {
    setMessage(null);
    const response = await fetch(`/api/personal-training/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Aktualisierung fehlgeschlagen");
      return;
    }

    await loadData();
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    const response = await fetch(`/api/personal-training/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Löschen fehlgeschlagen");
      return;
    }
    setMessage("Slot gelöscht");
    await loadData();
  };

  const handleMonthClosingExport = async () => {
    setMessage(null);
    setIsMonthClosingExporting(true);

    try {
      const response = await fetch("/api/personal-training/month-closing", {
        method: "POST"
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Monatsabschluss konnte nicht verarbeitet werden");
        return;
      }

      setMessage(
        `${data.updatedAccountEntries ?? 0} PT-Posten auf BILLED_TO_ACCOUNT gesetzt`
      );
      await loadData();
    } finally {
      setIsMonthClosingExporting(false);
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Lade Daten …</p>;

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Personal Training – Slots</h1>

      {message && (
        <div style={{
          background: message.toLowerCase().includes("fehler") || message.toLowerCase().includes("nicht") ? "#fee2e2" : "#d1fae5",
          border: "1px solid",
          borderColor: message.toLowerCase().includes("fehler") || message.toLowerCase().includes("nicht") ? "#fca5a5" : "#6ee7b7",
          borderRadius: 6,
          padding: "10px 16px",
          marginBottom: 20,
          fontSize: 14
        }}>
          {message}
        </div>
      )}

      {/* Neuen Slot anlegen */}
      <section style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Neuen Slot anlegen</h2>
        <form onSubmit={(e) => { void handleCreate(e); }} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            Trainer *
            <select
              required
              value={form.trainerId}
              onChange={(e) => setForm((f) => ({ ...f, trainerId: e.target.value }))}
              style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 14, minWidth: 180 }}
            >
              <option value="">– wählen –</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({Number(t.hourlyPtRate).toFixed(2)} €/h)
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            Startzeit *
            <input
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
            Endzeit *
            <input
              type="datetime-local"
              required
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </label>

          <button
            type="submit"
            style={{
              padding: "8px 20px",
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Slot anlegen
          </button>
        </form>
      </section>

      {/* Slot-Tabelle */}
      {slots.length === 0 ? (
        <p style={{ color: "#6b7280" }}>Keine PT-Slots vorhanden.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#1f2937", color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Trainer</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Startzeit</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Endzeit</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Mitglied</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Abrechnung</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Inklusiv-Slot</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, idx) => (
                <tr key={slot.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "10px 12px" }}>
                    {slot.trainer.firstName} {slot.trainer.lastName}
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{Number(slot.trainer.hourlyPtRate).toFixed(2)} €/h</div>
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDateTime(slot.startTime)}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDateTime(slot.endTime)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {slot.member
                      ? `${slot.member.firstName} ${slot.member.lastName}`
                      : <span style={{ color: "#9ca3af" }}>–</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <select
                      value={statusDrafts[slot.id] ?? slot.status}
                      onChange={(e) => setStatusDrafts((d) => ({ ...d, [slot.id]: e.target.value as PtStatus }))}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }}
                    >
                      {PT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <select
                      value={billingDrafts[slot.id] ?? slot.billingStatus}
                      onChange={(e) => setBillingDrafts((d) => ({ ...d, [slot.id]: e.target.value as BillingStatus }))}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13 }}
                    >
                      {BILLING_STATUSES.map((s) => (
                        <option key={s} value={s}>{BILLING_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {slot.isFreePremiumSlot ? "✓" : "–"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        onClick={() => void updateSlot(slot.id, {
                          status: statusDrafts[slot.id],
                          billingStatus: billingDrafts[slot.id]
                        })}
                        style={{
                          padding: "4px 12px",
                          background: "#f97316",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600
                        }}
                      >
                        Speichern
                      </button>
                      {slot.status === "AVAILABLE" && (
                        <button
                          onClick={() => void handleDelete(slot.id)}
                          style={{
                            padding: "4px 12px",
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 13
                          }}
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: 20, marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.08, color: "#9a3412", fontWeight: 700 }}>Monatsabschluss</p>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>SEPA-Einzug vorbereiten</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#9a3412" }}>{monthClosingData.totalOpenItems} offene Posten</p>
            <strong style={{ fontSize: 18 }}>{Number(monthClosingData.totalOpenAmountCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong>
          </div>
        </div>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => void handleMonthClosingExport()}
            disabled={monthClosingData.totalOpenItems === 0 || isMonthClosingExporting}
            style={{
              padding: "8px 14px",
              background: monthClosingData.totalOpenItems === 0 || isMonthClosingExporting ? "#9ca3af" : "#c2410c",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontWeight: 600,
              cursor: monthClosingData.totalOpenItems === 0 || isMonthClosingExporting ? "not-allowed" : "pointer",
              fontSize: 13
            }}
          >
            {isMonthClosingExporting ? "Verarbeite Export..." : "SEPA-Export abgeschlossen -> BILLED_TO_ACCOUNT setzen"}
          </button>
        </div>

        {monthClosingData.totalOpenItems === 0 ? (
          <p style={{ margin: 0, color: "#9a3412" }}>Keine offenen PT-Posten für den Monatsabschluss vorhanden.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {monthClosingData.items.map((entry) => (
              <li key={entry.id} style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: 6, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <strong>
                    {entry.member.firstName} {entry.member.lastName}
                  </strong>
                  <p style={{ margin: "4px 0 0", color: "#6b7280" }}>{entry.member.email}</p>
                  {entry.personalTrainingBooking ? (
                    <p style={{ margin: "4px 0 0" }}>
                      Slot: {formatDateTime(entry.personalTrainingBooking.startTime)} bis {formatDateTime(entry.personalTrainingBooking.endTime)} bei {entry.personalTrainingBooking.trainer.firstName} {entry.personalTrainingBooking.trainer.lastName}
                    </p>
                  ) : (
                    <p style={{ margin: "4px 0 0" }}>Kein verknuepfter PT-Termin vorhanden</p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{Number(entry.amountCents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</strong>
                  <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
                    Erfasst: {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p style={{ margin: "16px 0 0", color: "#9a3412", fontSize: 13 }}>
          Diese Liste ist die Grundlage fuer den Statuswechsel auf BILLED_TO_ACCOUNT nach dem SEPA-Export.
        </p>
      </section>
    </main>
  );
}
