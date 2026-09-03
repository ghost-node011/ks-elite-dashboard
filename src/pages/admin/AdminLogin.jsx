import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { login, getToken } from "../../lib/adminApi";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-alt)" }}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border p-8 flex flex-col gap-4 shadow-sm"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <img src="/images/logo.png" alt="" width={56} height={56} className="object-contain mx-auto mb-1" />

        <div className="flex items-center justify-center gap-2 mb-1" style={{ color: "var(--accent)" }}>
          <Lock size={16} />
          <span className="font-mono text-xs uppercase tracking-[0.25em]">Admin Portal</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-center" style={{ color: "var(--fg)" }}>
          K.S. Elite Attorneys
        </h1>

        <input
          required
          autoFocus
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] mt-3"
          style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }}
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--bg)", color: "var(--fg)" }}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="font-display font-semibold text-sm rounded-full px-7 py-3.5 mt-2 disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
