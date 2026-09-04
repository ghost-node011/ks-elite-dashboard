import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill active={!year} onClick={clearFilter}>
              All ({summary.years.reduce((sum, y) => sum + y.count, 0)})
            </Pill>
            {pastYears.map((y) => (
              <Pill key={y.year} active={year === String(y.year) && !month} onClick={() => selectYear(String(y.year))}>
                {y.year} ({y.count})
              </Pill>
            ))}
          </div>

          {currentYearGroup && (
            <div className="flex flex-wrap items-center gap-2">
              <Pill active={year === String(currentYearGroup.year) && !month} onClick={() => selectYear(String(currentYearGroup.year))}>
                All {currentYearGroup.year} ({currentYearGroup.count})
              </Pill>
              {currentYearGroup.months.map((m) => (
                <Pill
                  key={m.key}
                  active={month === m.key.slice(5)}
                  onClick={() => {
                    setYear(String(currentYearGroup.year));
                    setMonth(m.key.slice(5));
                  }}
                >
                  {m.label} ({m.count})
                </Pill>
              ))}
            </div>
          )}
        </div>
      )}

      <LeadsTable key={`${year}-${month}`} type="internship" title={title} fetcher={fetcher} />
    </div>
  );
}
