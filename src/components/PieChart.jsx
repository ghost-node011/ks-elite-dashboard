const PALETTE = ["#c9a24b", "#0b1220", "#2563eb", "#16a34a", "#b8863b", "#6b7280", "#9333ea", "#dc2626"];

// Pure-CSS donut chart via conic-gradient — no charting library needed for a
// handful of slices. `data` is [{ label, count }], already sorted desc.
export default function PieChart({ title, data, limit = 6 }) {
  const top = data.slice(0, limit);
  const rest = data.slice(limit).reduce((sum, d) => sum + d.count, 0);
  const slices = rest > 0 ? [...top, { label: "Other", count: rest }] : top;
  const total = slices.reduce((sum, s) => sum + s.count, 0);

  let acc = 0;
  const stops = slices.map((s, i) => {
    const start = (acc / total) * 100;
    acc += s.count;
    const end = (acc / total) * 100;
    return `${PALETTE[i % PALETTE.length]} ${start}% ${end}%`;
  });

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <p className="font-display font-semibold text-sm mb-4">{title}</p>
      {total === 0 ? (
        <p className="text-sm text-[var(--fg-muted)]">No data yet.</p>
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <div
            className="w-32 h-32 rounded-full shrink-0"
            style={{ background: `conic-gradient(${stops.join(", ")})`, mask: "radial-gradient(farthest-side, transparent 58%, #000 59%)", WebkitMask: "radial-gradient(farthest-side, transparent 58%, #000 59%)" }}
          />
          <div className="flex flex-col gap-1.5 min-w-0">
            {slices.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate max-w-[140px]" title={s.label}>{s.label}</span>
                <span className="text-[var(--fg-muted)] font-mono shrink-0">
                  {s.count} ({Math.round((s.count / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
