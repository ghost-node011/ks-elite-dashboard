import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  FileSearch,
  FolderPlus,
  GraduationCap,
  Inbox,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Sparkles,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { clearToken, getMe, getGreeting, AuthError } from "../../lib/adminApi";
import { AdminUserProvider } from "../../lib/AdminUserContext";

const GREETING_CACHE_KEY = "ksd_greeting";

const ALL_NAV = [
  { to: "/consultations", label: "Consultation Requests", icon: Inbox, section: "leads_contact" },
  { to: "/internships", label: "Internship Applications", icon: GraduationCap, section: "leads_internship" },
  { to: "/cases/new", label: "Add Case", icon: FolderPlus, section: "cases" },
  { to: "/cases", label: "Case Details", icon: FileSearch, section: "cases" },
  { to: "/cases-coming-dates", label: "Coming Dates", icon: CalendarClock, section: "cases" },
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
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
      });
  }, []);

  // One AI-written greeting per login session — cached so it doesn't
  // regenerate (and re-hit the LLM) on every route change within the layout.
  useEffect(() => {
    if (!user) return;
    const cached = sessionStorage.getItem(GREETING_CACHE_KEY);
    if (cached === "dismissed") return;
    if (cached) return setGreeting(cached);
    getGreeting()
      .then(({ greeting: g }) => {
        if (!g) return;
        setGreeting(g);
        sessionStorage.setItem(GREETING_CACHE_KEY, g);
      })
      .catch(() => {});
  }, [user]);

  const dismissGreeting = () => {
    setGreeting(null);
    sessionStorage.setItem(GREETING_CACHE_KEY, "dismissed");
  };

  const logout = () => {
    clearToken();
    sessionStorage.removeItem(GREETING_CACHE_KEY);
    navigate("/login", { replace: true });
  };

  const nav = user ? visibleNav(user.permissions) : [];

  return (
    <div className="min-h-screen md:flex" style={{ background: "var(--bg-alt)", color: "var(--fg)" }}>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20"
        style={{ borderColor: "var(--line)", background: "var(--card)" }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/images/logo.png" alt="" width={30} height={30} className="object-contain shrink-0" />
          <div>
            <p className="font-display font-bold text-sm leading-tight">K.S. Elite</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Dashboard</p>
          </div>
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
            <NavLink key={to} to={to} end className={navLinkClass} style={navLinkStyle} onClick={() => setMobileOpen(false)}>
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
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <img src="/images/logo.png" alt="" width={34} height={34} className="object-contain shrink-0" />
          <div>
            <p className="font-display font-bold text-sm leading-tight">K.S. Elite</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Dashboard</p>
          </div>
        </div>

        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={navLinkClass} style={navLinkStyle}>
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
        {greeting && (
          <div
            className="flex items-start gap-3 rounded-2xl border px-5 py-4 mb-6"
            style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--accent) 8%, var(--card))" }}
          >
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <p className="text-sm flex-1">{greeting}</p>
            <button
              onClick={dismissGreeting}
              aria-label="Dismiss"
              className="shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <AdminUserProvider value={user}>
          <Outlet />
        </AdminUserProvider>
      </main>
    </div>
  );
}
