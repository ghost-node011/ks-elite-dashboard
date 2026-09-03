// Simple horizontal bar list — used for month trends and long-tail
// categorical breakdowns (matter type) where a pie chart would get too
// crowded with slices.
export default function BarChart({ title, data, labelKey = "label", valueKey = "count", emptyText = "No data yet." }) {
  const max = data.reduce((m, d) => Math.max(m, d[valueKey]), 0) || 1;

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <p className="font-display font-semibold text-sm mb-4">{title}</p>
      {data.length === 0 ? (
        <p className="text-sm text-[var(--fg-muted)]">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((d) => (
            <div key={d[labelKey]} className="flex items-center gap-4">
              <span className="text-sm w-36 shrink-0 truncate" title={d[labelKey]}>
                {d[labelKey]}
              </span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d[valueKey] / max) * 100}%`, background: "var(--accent)" }}
                />
              </div>
              <span className="text-sm font-mono w-10 text-right shrink-0">{d[valueKey]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
