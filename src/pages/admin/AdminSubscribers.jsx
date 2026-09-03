import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { getSubscribers, deleteSubscriber, AuthError } from "../../lib/adminApi";
import { downloadCsv } from "../../lib/csv";

export default function AdminSubscribers() {
  const navigate = useNavigate();
  const [subs, setSubs] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    getSubscribers()
      .then(setSubs)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      await deleteSubscriber(id);
      setSubs((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const exportCsv = () => {
    downloadCsv("subscribers.csv", subs, [
      ["Email", "email"],
      ["Subscribed", (s) => new Date(s.receivedAt).toLocaleString()],
    ]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Subscribers</h1>
        {subs?.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--line)" }}
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {subs === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {subs?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No subscribers yet.</p>}

      {subs?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3 text-[var(--fg-muted)] whitespace-nowrap">{new Date(s.receivedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(s.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                      <Trash2 size={15} />
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
