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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--color-navy)" }}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border p-8 flex flex-col gap-4"
        style={{ borderColor: "rgba(247,244,236,0.14)", background: "#0f1a2e" }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-gold-soft)" }}>
          <Lock size={18} />
          <span className="font-mono text-xs uppercase tracking-[0.25em]">Admin Portal</span>
        </div>
        <h1 className="font-display font-bold text-2xl" style={{ color: "var(--color-ivory)" }}>
          K.S. Elite Attorneys
        </h1>

        <input
          required
          autoFocus
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--color-gold-soft)] mt-3"
          style={{ borderColor: "rgba(247,244,236,0.14)", background: "transparent", color: "var(--color-ivory)" }}
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--color-gold-soft)]"
          style={{ borderColor: "rgba(247,244,236,0.14)", background: "transparent", color: "var(--color-ivory)" }}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="font-display font-semibold text-sm rounded-full px-7 py-3.5 mt-2 disabled:opacity-60"
          style={{ background: "var(--color-gold-soft)", color: "var(--color-navy)" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
