import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Star } from "lucide-react";
import { getTestimonial, createTestimonial, updateTestimonial, uploadImage, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</span>
      {children}
    </label>
  );
}

export default function AdminTestimonialEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    getTestimonial(id)
      .then((t) => {
        setName(t.name);
        setRole(t.role || "");
        setQuote(t.quote);
        setRating(t.rating || 5);
        setImage(t.image || null);
      })
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const guardAuth = (err) => {
    if (err instanceof AuthError) {
      navigate("/login", { replace: true });
      return true;
    }
    setError(err.message);
    return false;
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      setImage(url);
    } catch (err) {
      guardAuth(err);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!name.trim() || !quote.trim()) return setError("Name and quote are required.");
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateTestimonial(id, { name, role, quote, rating, image });
      } else {
        await createTestimonial({ name, role, quote, rating, image });
      }
      navigate("/testimonials");
    } catch (err) {
      guardAuth(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate("/testimonials")} className="flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6">
        <ArrowLeft size={14} />
        Back to Testimonials
      </button>

      <h1 className="font-display font-bold text-2xl mb-6">{isEdit ? "Edit Testimonial" : "New Testimonial"}</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <Field label="Reviewer Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client / company name"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] w-full"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </Field>
        <Field label="About of Reviewer">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role / description (e.g. Non-Banking Financial Institution)"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] w-full"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </Field>
        <Field label="Review">
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Quote"
            rows={4}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] resize-y"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </Field>

        <Field label="Review Rating">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-0.5"
              >
                <Star
                  size={22}
                  style={{ color: "var(--accent)" }}
                  fill={n <= rating ? "var(--accent)" : "none"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Image (optional)">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <ImagePlus size={15} />
              {image ? "Change image" : "Upload image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadLogo(e.target.files?.[0])} />
            {image && <img src={resolveImageUrl(image)} alt="" className="w-14 h-14 rounded-lg object-cover border" style={{ borderColor: "var(--line)" }} />}
          </div>
        </Field>

        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
