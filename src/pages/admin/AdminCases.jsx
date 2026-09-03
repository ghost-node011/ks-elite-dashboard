import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarPlus, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { getAllCases, addCaseDate, deleteCase, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

export default function AdminCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [error, setError] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [dateSearch, setDateSearch] = useState("");
  const [addDateFor, setAddDateFor] = useState(null);
  const [newNextDate, setNewNextDate] = useState("");

  const load = () => {
    getAllCases()
      .then(setCases)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const visible = useMemo(() => {
    if (!cases) return cases;
    return cases.filter((c) => {
      const matchesName = !nameSearch.trim() || c.caseName.toLowerCase().includes(nameSearch.trim().toLowerCase());
      const matchesDate = !dateSearch || c.nextDate === dateSearch;
      return matchesName && matchesDate;
    });
  }, [cases, nameSearch, dateSearch]);

  const clearSearch = () => {
    setNameSearch("");
    setDateSearch("");
  };

  const remove = async (id) => {
    if (!confirm("Delete this case permanently?")) return;
    try {
      await deleteCase(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const openAddDate = (c) => {
    setAddDateFor(c);
    setNewNextDate("");
  };

  const submitAddDate = async () => {
    if (!newNextDate) return;
    try {
      const updated = await addCaseDate(addDateFor.id, newNextDate);
      setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setAddDateFor(null);
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Case Details</h1>
        <Link
          to="/cases/new"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Case
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">Name</span>
          <input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Search by case name"
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">Next Date</span>
          <input
            type="date"
            value={dateSearch}
            onChange={(e) => setDateSearch(e.target.value)}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </label>
      </div>
      {(nameSearch || dateSearch) && (
        <button
          onClick={clearSearch}
          className="mb-6 rounded-full border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--line)", color: "var(--fg-muted)" }}
        >
          Clear Search
        </button>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {cases === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {cases?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No cases yet — add your first one.</p>}
      {cases?.length > 0 && visible.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No cases match your search.</p>}

      {visible?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Case Name</th>
                  <th className="px-4 py-3">Last Date</th>
                  <th className="px-4 py-3">Next Date</th>
                  <th className="px-4 py-3">Court Name</th>
                  <th className="px-4 py-3">Court No.</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3">Doc</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 align-top" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--fg-muted)]">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-medium">{c.caseName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.lastDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.nextDate)}</td>
                    <td className="px-4 py-3">{c.courtName || "—"}</td>
                    <td className="px-4 py-3">{c.courtNo || "—"}</td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="flex flex-col">
                        {c.email && <span className="truncate">{c.email}</span>}
                        {c.clientMobile && <span className="text-[var(--fg-muted)]">{c.clientMobile}</span>}
                        {!c.email && !c.clientMobile && "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] text-[var(--fg-muted)]">{c.remark || "—"}</td>
                    <td className="px-4 py-3">
                      {c.document ? (
                        <a href={resolveImageUrl(c.document)} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]" aria-label="Document">
                          <FileText size={15} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openAddDate(c)} className="text-[var(--fg-muted)] hover:text-[var(--accent)]" aria-label="Add Date">
                          <CalendarPlus size={15} />
                        </button>
                        <Link to={`/cases/${c.id}/edit`} className="text-[var(--fg-muted)] hover:text-[var(--accent)]" aria-label="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => remove(c.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addDateFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(6,10,19,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Add Next Date</h2>
              <button onClick={() => setAddDateFor(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">{addDateFor.caseName}</p>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">New Next Date</span>
              <input
                type="date"
                autoFocus
                value={newNextDate}
                onChange={(e) => setNewNextDate(e.target.value)}
                className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                style={{ borderColor: "var(--line)", background: "var(--bg)" }}
              />
            </label>
            <button
              onClick={submitAddDate}
              disabled={!newNextDate}
              className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--color-navy)" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
