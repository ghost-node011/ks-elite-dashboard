import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import { getInternships, getInternshipSummary, AuthError } from "../../lib/adminApi";
import LeadsTable from "./LeadsTable";

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium border"
      style={
        active
          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--color-navy)" }
          : { borderColor: "var(--line)", color: "var(--fg-muted)" }
      }
    >
      {children}
    </button>
  );
}

function StatCard({ label, count, active, onClick, accent, Icon }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border p-5 transition-shadow hover:shadow-md"
      style={{
        borderColor: active ? accent : "var(--line)",
        background: "var(--card)",
        boxShadow: active ? `0 0 0 1px ${accent}` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: accent }}>
            {label}
          </p>
          <p className="font-display font-bold text-3xl mb-1">{count.toLocaleString()}</p>
          <p className="text-sm text-[var(--fg-muted)]">Registrations</p>
        </div>
        <Icon size={22} className="shrink-0 text-[var(--fg-muted)]" />
      </div>
    </button>
  );
}

export default function AdminInternships() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);

  useEffect(() => {
    getInternshipSummary()
      .then(setSummary)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  }, []);

  const selectYear = (y) => {
    setYear(y);
    setMonth(null);
  };

  const clearFilter = () => {
    setYear(null);
    setMonth(null);
  };

  const fetcher = (page, limit) => getInternships(page, limit, { year: year || "", month: month || "" });

  const currentYearGroup = summary?.years.find((y) => y.year === summary.currentYear);
  const pastYears = summary?.years.filter((y) => y.year !== summary.currentYear) ?? [];

  const title =
    year && month
      ? `Internship Applications — ${currentYearGroup?.months.find((m) => m.key === month)?.label ?? month}`
      : year
        ? `Internship Applications — ${year}`
        : "Internship Applications";

  return (
    <div>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {summary && (
        <div className="flex flex-col gap-4 mb-6">
          {pastYears.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {pastYears.map((y) => (
                <Pill key={y.year} active={year === String(y.year) && !month} onClick={() => selectYear(String(y.year))}>
                  {y.year} ({y.count})
                </Pill>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total"
              count={summary.years.reduce((sum, y) => sum + y.count, 0)}
              active={!year}
              onClick={clearFilter}
              accent="#2563eb"
              Icon={Users}
            />
            {currentYearGroup?.months
              .slice()
              .reverse()
              .map((m) => (
                <StatCard
                  key={m.key}
                  label={m.label}
                  count={m.count}
                  active={year === String(currentYearGroup.year) && month === m.key.slice(5)}
                  onClick={() => {
                    setYear(String(currentYearGroup.year));
                    setMonth(m.key.slice(5));
                  }}
                  accent="#16a34a"
                  Icon={UserPlus}
                />
              ))}
          </div>
        </div>
      )}

      <LeadsTable key={`${year}-${month}`} type="internship" title={title} fetcher={fetcher} />
    </div>
  );
}
