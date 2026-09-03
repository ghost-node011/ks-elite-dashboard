import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Sparkles, Trash2 } from "lucide-react";
import { updateLeadStatus, deleteLead, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 50;

const STATUS_OPTIONS = ["new", "contacted", "closed"];
const STATUS_COLORS = { new: "#c9a24b", contacted: "#2563eb", closed: "#6b7280" };
const VERDICT_COLORS = {
  "Strong Fit": { background: "rgba(34,197,94,0.15)", color: "#16a34a" },
  "Possible Fit": { background: "rgba(201,162,75,0.15)", color: "#b8863b" },
  "Not a Fit": { background: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

// Shared table for the two lead types (contact / internship) — each type gets
// its own sidebar section and route, but the fetch/status/delete/export/render
// logic is identical apart from a handful of column differences below.
export default function LeadsTable({ type, title, fetcher }) {
  const navigate = useNavigate();
  const isInternship = type === "internship";

  const [leads, setLeads] = useState(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = () => {
    setLeads(null);
    setError("");
    fetcher(page, PAGE_SIZE)
      .then(({ items, total, page: p, pages }) => {
        setLeads(items);
        setMeta({ total, page: p, pages });
      })
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, [type, page]);
  useEffect(() => setPage(1), [type]);

  const setStatus = async (id, status) => {
    try {
      await updateLeadStatus(type, id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this lead permanently?")) return;
    try {
      await deleteLead(type, id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const visibleLeads = useMemo(() => {
    if (!leads) return leads;
    if (!isInternship || !recommendedOnly) return leads;
    return leads
      .filter((l) => l.aiVerdict === "Strong Fit")
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
  }, [leads, isInternship, recommendedOnly]);

  const recommendedCount = isInternship ? (leads?.filter((l) => l.aiVerdict === "Strong Fit").length ?? 0) : 0;

  // Export always covers every record, not just the page currently on
  // screen — it pages through the API at a larger page size and concatenates.
  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const all = [];
      let p = 1;
      let totalPages = 1;
      do {
        const res = await fetcher(p, 200);
        all.push(...res.items);
        totalPages = res.pages;
        p++;
      } while (p <= totalPages);

      const rows = isInternship && recommendedOnly ? all.filter((l) => l.aiVerdict === "Strong Fit") : all;

      if (!isInternship) {
        downloadCsv("consultation-requests.csv", rows, [
          ["Received", (l) => new Date(l.receivedAt).toLocaleString()],
          ["Name", "name"],
          ["Phone", "phone"],
          ["Matter", "matter"],
          ["Message", "message"],
          ["Status", "status"],
        ]);
      } else {
        downloadCsv("internship-applications.csv", rows, [
          ["Received", (l) => new Date(l.receivedAt).toLocaleString()],
          ["Name", (l) => `${l.firstName} ${l.surname}`],
          ["Email", "email"],
          ["Contact", "contact"],
          ["College", "college"],
          ["Mode of Internship", "mode"],
          ["Preferred Month", "month"],
          ["AI Verdict", "aiVerdict"],
          ["AI Score", "aiScore"],
          ["Status", "status"],
        ]);
      }
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">{title}</h1>
        {meta.total > 0 && (
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ borderColor: "var(--line)" }}
          >
            <Download size={14} />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        )}
      </div>

      {isInternship && leads?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setRecommendedOnly((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border"
            style={
              recommendedOnly
                ? { background: "#16a34a", borderColor: "#16a34a", color: "#fff" }
                : { borderColor: "var(--line)", color: "var(--fg-muted)" }
            }
          >
            <Sparkles size={13} />
            AI Recommended ({recommendedCount})
          </button>
          {recommendedOnly && <span className="text-xs text-[var(--fg-muted)]">Filters this page only — page through to see more.</span>}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {leads === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {leads?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No {isInternship ? "internship applications" : "consultation requests"} yet.</p>}
      {leads?.length > 0 && visibleLeads.length === 0 && (
        <p className="text-sm text-[var(--fg-muted)]">No candidates the AI flagged as a strong fit yet.</p>
      )}

      {visibleLeads?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">{isInternship ? "College" : "Matter"}</th>
                  <th className="px-4 py-3">Details</th>
                  {isInternship && <th className="px-4 py-3">Resume</th>}
                  {isInternship && <th className="px-4 py-3">AI Fit</th>}
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 align-top" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--fg-muted)]">
                      {new Date(l.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {isInternship ? `${l.firstName} ${l.surname}` : l.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isInternship ? (
                        <div className="flex flex-col">
                          <span>{l.email}</span>
                          <span className="text-[var(--fg-muted)]">{l.contact}</span>
                        </div>
                      ) : (
                        l.phone
                      )}
                    </td>
                    <td className="px-4 py-3">{isInternship ? l.college : l.matter || "—"}</td>
                    <td className="px-4 py-3 max-w-xs text-[var(--fg-muted)]">
                      {isInternship ? `Mode of Internship: ${l.mode} · Preferred Month: ${l.month}` : l.message}
                    </td>
                    {isInternship && (
                      <td className="px-4 py-3">
                        {l.resumeUrl ? (
                          <a
                            href={resolveImageUrl(l.resumeUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-[var(--accent)] w-fit"
                          >
                            <FileText size={12} />
                            Resume
                          </a>
                        ) : (
                          <span className="text-[var(--fg-muted)]">—</span>
                        )}
                      </td>
                    )}
                    {isInternship && (
                      <td className="px-4 py-3 max-w-[220px]">
                        {l.aiVerdict ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className="rounded-full px-2.5 py-1 text-xs font-mono uppercase tracking-wide w-fit"
                              style={VERDICT_COLORS[l.aiVerdict] || VERDICT_COLORS["Possible Fit"]}
                            >
                              {l.aiVerdict} · {l.aiScore}
                            </span>
                            {l.aiSummary && <span className="text-xs text-[var(--fg-muted)] leading-snug">{l.aiSummary}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--fg-muted)]">{l.resumeUrl ? "Not scored" : "No resume"}</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <select
                        value={l.status || "new"}
                        onChange={(e) => setStatus(l.id, e.target.value)}
                        className="rounded-full border px-2.5 py-1 text-xs font-mono uppercase tracking-wide"
                        style={{ borderColor: "var(--line)", background: "var(--bg)", color: STATUS_COLORS[l.status || "new"] }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(l.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={meta.page} pages={meta.pages} total={meta.total} onChange={setPage} />
    </div>
  );
}
