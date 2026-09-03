import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getAllTeam, deleteTeamMember, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

export default function AdminTeam() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState("");

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

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {team === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {team?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No team members yet — add your first one.</p>}

      {team?.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((m) => (
            <div key={m.id} className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <div className="relative aspect-[4/3] bg-[var(--bg)]">
                {m.image && <img src={resolveImageUrl(m.image)} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-display font-bold text-sm">{m.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{m.title}</p>
                <div className="mt-auto pt-3 flex items-center gap-3">
                  <Link to={`/team/${m.id}/edit`} className="text-[var(--fg-muted)] hover:text-[var(--accent)]" aria-label="Edit">
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
