import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { getAllTeam, deleteTeamMember, updateTeamMember, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

export default function AdminTeam() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  const load = () => {
    getAllTeam()
      .then(setTeam)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Remove this team member permanently?")) return;
    try {
      await deleteTeamMember(id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  // Reordering re-numbers the whole list (0, 1, 2, ...) rather than swapping
  // raw order values, so it stays correct even if existing records share the
  // same order (e.g. everyone still at the default 0).
  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= team.length || reordering) return;

    const next = [...team];
    [next[index], next[j]] = [next[j], next[index]];
    setTeam(next);
    setReordering(true);
    setError("");

    try {
      await Promise.all(next.map((m, i) => (m.order === i ? null : updateTeamMember(m.id, { order: i }))).filter(Boolean));
      setTeam(next.map((m, i) => ({ ...m, order: i })));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
      load();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Team</h1>
        <Link
          to="/team/new"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Member
        </Link>
      </div>

      {team?.length > 1 && (
        <p className="text-xs text-[var(--fg-muted)] mb-4">
          Use the arrows to reorder — this is the order profiles appear in on the public site.
        </p>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {team === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {team?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No team members yet — add your first one.</p>}

      {team?.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((m, i) => (
            <div key={m.id} className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <div className="relative aspect-[4/3] bg-[var(--bg)]">
                {m.image && <img src={resolveImageUrl(m.image)} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />}
                <span
                  className="absolute top-2 left-2 rounded-full w-7 h-7 flex items-center justify-center font-mono text-xs font-bold"
                  style={{ background: "var(--color-navy)", color: "var(--color-gold)" }}
                >
                  {i + 1}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-display font-bold text-sm">{m.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{m.title}</p>
                <div className="mt-auto pt-3 flex items-center gap-3">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || reordering}
                    className="text-[var(--fg-muted)] hover:text-[var(--accent)] disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === team.length - 1 || reordering}
                    className="text-[var(--fg-muted)] hover:text-[var(--accent)] disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <Link to={`/team/${m.id}/edit`} className="text-[var(--fg-muted)] hover:text-[var(--accent)] ml-auto" aria-label="Edit">
                    <Pencil size={15} />
                  </Link>
                  <button onClick={() => remove(m.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
