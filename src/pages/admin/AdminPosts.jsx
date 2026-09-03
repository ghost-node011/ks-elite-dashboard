import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getAllPosts, deletePost, AuthError } from "../../lib/adminApi";

export default function AdminPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    getAllPosts()
      .then(setPosts)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login", { replace: true });
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Blog Posts</h1>
        <Link
          to="/posts/new"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Post
        </Link>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {posts === null && !error && <p className="text-sm text-[var(--fg-muted)]">Loading…</p>}
      {posts?.length === 0 && <p className="text-sm text-[var(--fg-muted)]">No posts yet — create your first one.</p>}

      {posts?.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--fg-muted)] font-mono text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--line)" }}>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                    <td className="px-4 py-3 font-medium max-w-sm truncate">{p.title}</td>
                    <td className="px-4 py-3 text-[var(--fg-muted)] whitespace-nowrap">{p.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-mono uppercase tracking-wide whitespace-nowrap"
                        style={p.published ? { background: "rgba(34,197,94,0.15)", color: "#16a34a" } : { background: "var(--bg)", color: "var(--fg-muted)" }}
                      >
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--fg-muted)]">
                      {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/posts/${p.id}/edit`} className="text-[var(--fg-muted)] hover:text-[var(--accent)]" aria-label="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => remove(p.id)} className="text-[var(--fg-muted)] hover:text-red-500" aria-label="Delete">
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
