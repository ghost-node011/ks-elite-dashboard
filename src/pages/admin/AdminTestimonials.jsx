import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { getAllTestimonials, deleteTestimonial, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminTestimonials() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    getAllTestimonials()
      .then(setItems)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Remove this testimonial permanently?")) return;
    try {
      await deleteTestimonial(id);
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Testimonials</h1>
        <Link
          to="/testimonials/new"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Testimonial
        </Link>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {items === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {items?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No testimonials yet — add your first one.</p>}

      {items?.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((t) => (
            <div key={t.id} className="rounded-2xl border p-5 flex items-start justify-between gap-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <div className="flex items-start gap-4 min-w-0">
                {t.image && (
                  <img
                    src={resolveImageUrl(t.image)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border shrink-0"
                    style={{ borderColor: "var(--line)" }}
                  />
                )}
                <div className="min-w-0">
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={12}
                        style={{ color: "var(--accent)" }}
                        fill={s < (t.rating || 5) ? "var(--accent)" : "none"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                  <p className="font-display font-bold text-sm mt-3">{t.name}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{t.role}</p>
                  {t.receivedAt && (
                    <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--fg-muted)] mt-1.5">
                      Added {formatDate(t.receivedAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to={`/testimonials/${t.id}/edit`} className="text-[var(--fg-muted)] hover:text-[var(--accent)]" aria-label="Edit">
                  <Pencil size={15} />
                </Link>
                <button onClick={() => remove(t.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
