import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Users } from "lucide-react";
import { getContacts, getInternships, AuthError } from "../../lib/adminApi";

function monthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupByMonth(records, limit = 7) {
  const counts = {};
  for (const r of records) {
    const key = monthKey(r.receivedAt);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: monthLabel(key), count }));
}

function groupByPreferredMonth(records, limit = 12) {
  const counts = {};
  for (const r of records) {
    const key = r.month?.trim() || "Unspecified";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => {
      const da = Date.parse(a[0]);
      const db = Date.parse(b[0]);
      if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
      if (!Number.isNaN(da)) return -1;
      if (!Number.isNaN(db)) return 1;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: key, count }));
}

function groupByMatter(contacts) {
  const counts = {};
  for (const c of contacts) {
    const matter = c.matter?.trim() || "Unspecified";
    counts[matter] = (counts[matter] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([matter, count]) => ({ matter, count }));
}

function MonthCard({ label, count, accent }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <p className="font-mono text-[11px] uppercase tracking-wide mb-2" style={{ color: accent ? "var(--accent)" : "var(--fg-muted)" }}>
        {label}
      </p>
      <p className="font-display font-bold text-3xl">{count}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState(null);
  const [internships, setInternships] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getContacts(), getInternships()])
      .then(([c, i]) => {
        setContacts(c);
        setInternships(i);
      })
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  }, []);

  const contactMonths = useMemo(() => (contacts ? groupByMonth(contacts) : []), [contacts]);
  const internshipMonths = useMemo(() => (internships ? groupByPreferredMonth(internships) : []), [internships]);
  const matterBreakdown = useMemo(() => (contacts ? groupByMatter(contacts) : []), [contacts]);
  const maxMatterCount = matterBreakdown[0]?.count || 1;

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (contacts === null || internships === null) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">Analytics</h1>
        <p className="text-sm text-[var(--fg-muted)]">Overview of leads and inquiries over time.</p>
      </div>

      <section>
        <p className="flex items-center gap-2 font-display font-semibold text-sm mb-4">
          <MessageSquare size={15} style={{ color: "var(--accent)" }} />
          Consultation Requests — by Month
        </p>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MonthCard label="Total" count={contacts.length} accent />
          {contactMonths.map((m) => (
            <MonthCard key={m.key} label={m.label} count={m.count} />
          ))}
        </div>
      </section>

      <section>
        <p className="flex items-center gap-2 font-display font-semibold text-sm mb-4">
          <Users size={15} style={{ color: "var(--accent)" }} />
          Internship Applications — by Preferred Month
        </p>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MonthCard label="Total" count={internships.length} accent />
          {internshipMonths.map((m) => (
            <MonthCard key={m.key} label={m.label} count={m.count} />
          ))}
        </div>
      </section>

      <section>
        <p className="font-display font-semibold text-sm mb-4">Consultation Requests — by Matter Type</p>
        {matterBreakdown.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">No consultation requests yet.</p>
        ) : (
          <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            {matterBreakdown.map(({ matter, count }) => (
              <div key={matter} className="flex items-center gap-4">
                <span className="text-sm w-40 shrink-0 truncate" title={matter}>
                  {matter}
                </span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / maxMatterCount) * 100}%`, background: "var(--accent)" }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
