"use client";

import { useEffect, useState } from "react";

interface NoShowRestriction {
  id: string;
  memberId: string;
  startedAt: string;
  expiresAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function RestrictionsPage() {
  const [restrictions, setRestrictions] = useState<NoShowRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRestrictions();
  }, []);

  async function loadRestrictions() {
    try {
      const res = await fetch("/api/restrictions");
      if (!res.ok) throw new Error("Sperren konnten nicht geladen werden");
      const data = await res.json();
      setRestrictions(data.restrictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  }

  async function removeRestriction(restrictionId: string) {
    if (!confirm("Möchtest du diese Sperre wirklich aufheben?")) {
      return;
    }

    try {
      const res = await fetch(`/api/restrictions/${restrictionId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Sperre konnte nicht gelöscht werden");
      await loadRestrictions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    }
  }

  if (loading) {
    return <div className="p-4">Lädt...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">No-Show-Sperren</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {restrictions.length === 0 ? (
        <p className="text-gray-600">Keine aktiven Sperren</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-left">Mitglied</th>
                <th className="border border-gray-300 p-2 text-left">Email</th>
                <th className="border border-gray-300 p-2 text-left">Gesperrt seit</th>
                <th className="border border-gray-300 p-2 text-left">Gültig bis</th>
                <th className="border border-gray-300 p-2 text-center">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {restrictions.map((restriction) => (
                <tr key={restriction.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    {restriction.member.firstName} {restriction.member.lastName}
                  </td>
                  <td className="border border-gray-300 p-2">{restriction.member.email}</td>
                  <td className="border border-gray-300 p-2">
                    {new Date(restriction.startedAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(restriction.expiresAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <button
                      onClick={() => removeRestriction(restriction.id)}
                      className="text-red-600 hover:text-red-800 underline"
                    >
                      Aufheben
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
