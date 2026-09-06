import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip } from "lucide-react";
import { getCase, createCase, updateCase, uploadFile, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";
import { isValidEmail, isValidPhone } from "../../lib/validators";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</span>
      {children}
    </label>
  );
}

const initialForm = {
  caseName: "",
  lastDate: "",
  nextDate: "",
  email: "",
  clientMobile: "",
  courtName: "",
  courtNo: "",
  remark: "",
};

export default function AdminCaseAdd() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [document, setDocument] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const guardAuth = (err) => {
    if (err instanceof AuthError) {
      navigate("/login", { replace: true });
      return true;
    }
    setError(err.message);
    return false;
  };

  useEffect(() => {
    if (!isEdit) return;
    getCase(id)
      .then((c) => {
        setForm({
          caseName: c.caseName || "",
          lastDate: c.lastDate || "",
          nextDate: c.nextDate || "",
          email: c.email || "",
          clientMobile: c.clientMobile || "",
          courtName: c.courtName || "",
          courtNo: c.courtNo || "",
          remark: c.remark || "",
        });
        setDocument(c.document || null);
      })
      .catch(guardAuth)
      .finally(() => setLoading(false));
  }, [id]);

  const uploadDoc = async (file) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const { url } = await uploadFile(file);
      setDocument(url);
    } catch (err) {
      guardAuth(err);
    } finally {
      setUploadingDoc(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.caseName.trim()) return setError("Name of case is required.");
    if (form.email.trim() && !isValidEmail(form.email)) return setError("Please provide a valid email address.");
    if (form.clientMobile.trim() && !isValidPhone(form.clientMobile)) return setError("Please provide a valid client mobile number.");
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateCase(id, { ...form, document });
      } else {
        await createCase({ ...form, document });
      }
      navigate("/cases");
    } catch (err) {
      guardAuth(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate("/cases")} className="flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6">
        <ArrowLeft size={14} />
        Back to Case Details
      </button>

      <h1 className="font-display font-bold text-2xl mb-6">{isEdit ? "Edit Case" : "Add Case"}</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <Field label="Name of Case">
          <input
            required
            placeholder="Enter your Name"
            value={form.caseName}
            onChange={update("caseName")}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Last Date">
            <input
              type="date"
              value={form.lastDate}
              onChange={update("lastDate")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
          <Field label="Next Date">
            <input
              type="date"
              value={form.nextDate}
              onChange={update("nextDate")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
          <Field label="Client Mobile Number">
            <input
              type="tel"
              value={form.clientMobile}
              onChange={update("clientMobile")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Court Name">
            <input
              value={form.courtName}
              onChange={update("courtName")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
          <Field label="Court No.">
            <input
              value={form.courtNo}
              onChange={update("courtNo")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
          <Field label="Remark">
            <input
              value={form.remark}
              onChange={update("remark")}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            />
          </Field>
        </div>

        <Field label="Upload File">
          <label
            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <Paperclip size={16} className="shrink-0 text-[var(--fg-muted)]" />
            <span className={document ? "" : "text-[var(--fg-muted)]"}>
              {uploadingDoc ? "Uploading…" : document ? "Document attached" : "Choose file"}
            </span>
            <input ref={fileRef} type="file" onChange={(e) => uploadDoc(e.target.files?.[0])} className="hidden" />
          </label>
          {document && (
            <a href={resolveImageUrl(document)} target="_blank" rel="noreferrer" className="text-xs mt-1 hover:text-[var(--accent)] w-fit" style={{ color: "var(--accent)" }}>
              View current document
            </a>
          )}
        </Field>

        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60 mt-2"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          {saving ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
