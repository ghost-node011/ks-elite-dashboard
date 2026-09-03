import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Sparkles, Trash2 } from "lucide-react";
import { getContacts, getInternships, updateLeadStatus, deleteLead, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { useAdminUser, hasPermission } from "../../lib/AdminUserContext";

const ALL_TABS = [
  { key: "contact", label: "Consultation Requests", fetcher: getContacts, permission: "leads_contact" },
  { key: "internship", label: "Internship Applications", fetcher: getInternships, permission: "leads_internship" },
];

const STATUS_OPTIONS = ["new", "contacted", "closed"];
const STATUS_COLORS = { new: "#c9a24b", contacted: "#2563eb", closed: "#6b7280" };
const VERDICT_COLORS = {
  "Strong Fit": { background: "rgba(34,197,94,0.15)", color: "#16a34a" },
  "Possible Fit": { background: "rgba(201,162,75,0.15)", color: "#b8863b" },
  "Not a Fit": { background: "rgba(107,114,128,0.15)", color: "#6b7280" },
};

export default function AdminLeads() {
  const navigate = useNavigate();
  const user = useAdminUser();
  const TABS = useMemo(() => ALL_TABS.filter((t) => hasPermission(user, t.permission)), [user]);

  const [tab, setTab] = useState(null);
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  // Default to the first tab this user actually has access to, once known.
  useEffect(() => {
    if (TABS.length && !tab) setTab(TABS[0].key);
  }, [TABS]);

  const load = (key) => {
    setLeads(null);
    setError("");
    const fetcher = TABS.find((t) => t.key === key)?.fetcher;
    if (!fetcher) return;
    fetcher()
      .then(setLeads)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(() => {
    if (tab) load(tab);
  }, [tab]);

  const setStatus = async (id, status) => {
    try {
      await updateLeadStatus(tab, id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this lead permanently?")) return;
    try {
      await deleteLead(tab, id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  const visibleLeads = useMemo(() => {
    if (!leads) return leads;
    if (tab !== "internship" || !recommendedOnly) return leads;
    return leads
      .filter((l) => l.aiVerdict === "Strong Fit")
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
  }, [leads, tab, recommendedOnly]);

  const recommendedCount = tab === "internship" ? (leads?.filter((l) => l.aiVerdict === "Strong Fit").length ?? 0) : 0;

  const exportCsv = () => {
    if (tab === "contact") {
      downloadCsv("consultation-requests.csv", visibleLeads, [
        ["Received", (l) => new Date(l.receivedAt).toLocaleString()],
        ["Name", "name"],
        ["Phone", "phone"],
        ["Matter", "matter"],
        ["Message", "message"],
        ["Status", "status"],
      ]);
    } else {
      downloadCsv("internship-applications.csv", visibleLeads, [
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
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Leads</h1>
        {visibleLeads?.length > 0 && (
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

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setRecommendedOnly(false); }}
            className="rounded-full px-4 py-2 text-sm font-medium border"
            style={
              tab === t.key
                ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--color-navy)" }
                : { borderColor: "var(--line)", color: "var(--fg-muted)" }
            }
          >
            {t.label}
          </button>
        ))}

        {tab === "internship" && leads?.length > 0 && (
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
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {user && TABS.length === 0 && <p className="text-sm text-[var(--fg-muted)]">You don't have access to any leads sections.</p>}
      {leads === null && !error && tab && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {leads?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No {tab === "contact" ? "consultation requests" : "internship applications"} yet.</p>}
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
                  <th className="px-4 py-3">{tab === "contact" ? "Matter" : "College"}</th>
                  <th className="px-4 py-3">Details</th>
                  {tab === "internship" && <th className="px-4 py-3">AI Fit</th>}
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
                      {tab === "contact" ? l.name : `${l.firstName} ${l.surname}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tab === "contact" ? l.phone : (
                        <div className="flex flex-col">
                          <span>{l.email}</span>
                          <span className="text-[var(--fg-muted)]">{l.contact}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{tab === "contact" ? l.matter || "—" : l.college}</td>
                    <td className="px-4 py-3 max-w-xs text-[var(--fg-muted)]">
                      {tab === "contact" ? l.message : (
                        <div className="flex flex-col gap-1.5">
                          <span>Mode of Internship: {l.mode} · Preferred Month: {l.month}</span>
                          {l.resumeUrl && (
                            <a
                              href={resolveImageUrl(l.resumeUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-[var(--accent)] w-fit"
                            >
                              <FileText size={12} />
                              Resume
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    {tab === "internship" && (
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
    </div>
  );
}
