import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCases, AuthError } from "../../lib/adminApi";

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminComingDates() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllCases()
      .then(setCases)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  }, []);

  const upcoming = useMemo(() => {
    if (!cases) return cases;
    const today = todayIso();
    return cases
      .filter((c) => c.nextDate && c.nextDate >= today)
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  }, [cases]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">Coming Dates</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {cases === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {upcoming?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No upcoming hearing dates.</p>}

      {upcoming?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                  <th className="px-4 py-3">Case Name</th>
                  <th className="px-4 py-3">Last Date</th>
                  <th className="px-4 py-3">Next Date</th>
                  <th className="px-4 py-3">Client Mob. No.</th>
                  <th className="px-4 py-3">Court Name</th>
                  <th className="px-4 py-3">Court No.</th>
                  <th className="px-4 py-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((c) => (
                  <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 font-medium">{c.caseName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.lastDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: "var(--accent)" }}>
                      {formatDate(c.nextDate)}
                    </td>
                    <td className="px-4 py-3">{c.clientMobile || "—"}</td>
                    <td className="px-4 py-3">{c.courtName || "—"}</td>
                    <td className="px-4 py-3">{c.courtNo || "—"}</td>
                    <td className="px-4 py-3 text-[var(--fg-muted)]">{c.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
