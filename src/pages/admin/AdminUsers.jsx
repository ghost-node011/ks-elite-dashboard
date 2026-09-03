import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getSections, AuthError } from "../../lib/adminApi";

const emptyForm = { email: "", label: "", password: "", permissions: [] };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    Promise.all([getAdminUsers(), getSections()])
      .then(([u, s]) => {
        setUsers(u);
        setSections(s);
      })
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const toggleSection = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
    }));
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({ email: u.email, label: u.label || "", password: "", permissions: u.permissions });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async () => {
    setError("");
    if (!editingId && (!form.email.trim() || !form.password.trim())) {
      return setError("Email and password are required for a new user.");
    }
    setSaving(true);
    try {
      if (editingId) {
        const payload = { label: form.label, permissions: form.permissions };
        if (form.password.trim()) payload.password = form.password;
        await updateAdminUser(editingId, payload);
      } else {
        await createAdminUser(form);
      }
      cancelEdit();
      load();
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this user's access permanently?")) return;
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">User Master</h1>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {/* Create / edit form */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <p className="font-display font-semibold text-sm mb-4">{editingId ? "Edit User" : "New Staff User"}</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email (login)"
            disabled={Boolean(editingId)}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          />
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Display name (e.g. Front Desk)"
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={editingId ? "New password (leave blank to keep)" : "Password (min 8 chars)"}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          />
        </div>

        <p className="text-xs text-[var(--fg-muted)] mb-2">Section access</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSection(s.key)}
              className="rounded-full px-3 py-1.5 text-xs font-medium border"
              style={
                form.permissions.includes(s.key)
                  ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--color-navy)" }
                  : { borderColor: "var(--line)", color: "var(--fg-muted)" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--accent)", color: "var(--color-navy)" }}
          >
            {!editingId && <Plus size={15} strokeWidth={2.5} />}
            {saving ? "Saving…" : editingId ? "Save Changes" : "Create User"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
              Cancel
            </button>
          )}
        </div>
      </div>

      {users === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {users?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No staff users yet — create one above.</p>}

      {users?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 text-[var(--fg-muted)]">{u.label || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {u.permissions.length === 0 && <span className="text-xs text-[var(--fg-muted)]">No access yet</span>}
                        {u.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-full px-2 py-0.5 text-[10px] font-mono uppercase"
                            style={{ background: "var(--bg)", border: "1px solid var(--line)", color: "var(--fg-muted)" }}
                          >
                            {sections.find((s) => s.key === p)?.label || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEdit(u)} className="text-xs font-medium hover:text-[var(--accent)]">
                          Edit
                        </button>
                        <button onClick={() => remove(u.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
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
