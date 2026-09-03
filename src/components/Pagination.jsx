import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, onChange }) {
  if (!total) return null;

  return (
    <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
      <p className="text-xs text-[var(--fg-muted)]">
        {total.toLocaleString()} total &middot; page {page} of {pages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          style={{ borderColor: "var(--line)", color: "var(--fg-muted)" }}
        >
          <ChevronLeft size={14} />
          Prev
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          style={{ borderColor: "var(--line)", color: "var(--fg-muted)" }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
