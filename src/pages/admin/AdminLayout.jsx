import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Inbox, LogOut, Mail, Menu, MessageSquareQuote, Newspaper, ShieldCheck, Users, X } from "lucide-react";
import { clearToken, getMe, AuthError } from "../../lib/adminApi";
import { AdminUserProvider } from "../../lib/AdminUserContext";

const ALL_NAV = [
  { to: "/leads", label: "Leads", icon: Inbox, anyOf: ["leads_contact", "leads_internship"] },
  { to: "/posts", label: "Blog Posts", icon: Newspaper, section: "posts" },
  { to: "/team", label: "Team", icon: Users, section: "team" },
  { to: "/testimonials", label: "Testimonials", icon: MessageSquareQuote, section: "testimonials" },
  { to: "/subscribers", label: "Subscribers", icon: Mail, section: "subscribers" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
  { to: "/users", label: "User Master", icon: ShieldCheck, superOnly: true },
];

function visibleNav(permissions) {
  const isSuper = permissions.includes("*");
  return ALL_NAV.filter((item) => {
    if (item.superOnly) return isSuper;
    if (isSuper) return true;
    if (item.anyOf) return item.anyOf.some((s) => permissions.includes(s));
    return permissions.includes(item.section);
  });
}

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "" : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
  }`;

const navLinkStyle = ({ isActive }) => (isActive ? { background: "var(--accent)", color: "var(--color-navy)" } : undefined);

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
      });
  }, []);

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const nav = user ? visibleNav(user.permissions) : [];

  return (
    <div className="min-h-screen md:flex" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div>
          <p className="font-display font-bold text-sm">K.S. Elite</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Dashboard</p>
        </div>
        <button onClick={() => setMobileOpen((o) => !o)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden border-b px-4 py-3 flex flex-col gap-1 sticky top-[57px] z-20"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass} style={navLinkStyle} onClick={() => setMobileOpen(false)}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-56 md:shrink-0 border-r px-4 py-6 flex-col gap-1"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div className="px-2 mb-6">
          <p className="font-display font-bold text-sm">K.S. Elite</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Dashboard</p>
        </div>

        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass} style={navLinkStyle}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-2">
          {user && (
            <p className="px-3 text-xs text-[var(--fg-muted)] truncate" title={user.email}>
              Signed in as {user.label || user.email}
            </p>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto overflow-x-hidden">
        <AdminUserProvider value={user}>
          <Outlet />
        </AdminUserProvider>
      </main>
    </div>
  );
}
