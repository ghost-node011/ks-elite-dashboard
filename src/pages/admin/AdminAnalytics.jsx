import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CalendarClock, GraduationCap, Mail, MessageSquare } from "lucide-react";
import { getAnalytics, AuthError } from "../../lib/adminApi";
import PieChart from "../../components/PieChart";
import BarChart from "../../components/BarChart";

function TotalCard({ icon: Icon, label, count }) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
      >
        <Icon size={18} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</p>
        <p className="font-display font-bold text-2xl">{count.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      });
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  const { totals, contactsByMonth, contactsByMatter, contactsByStatus, internshipsByMonth, internshipsByMode, internshipsByGender, internshipsByStatus } = data;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">Analytics</h1>
        <p className="text-sm text-[var(--fg-muted)]">Overview of leads, cases, and inquiries.</p>
      </div>

      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <TotalCard icon={MessageSquare} label="Consultations" count={totals.contacts} />
        <TotalCard icon={GraduationCap} label="Internship Applications" count={totals.internships} />
        <TotalCard icon={Briefcase} label="Cases" count={totals.cases} />
        <TotalCard icon={CalendarClock} label="Upcoming Hearings" count={totals.upcomingCases} />
        <TotalCard icon={Mail} label="Subscribers" count={totals.subscribers} />
      </div>

      <section>
        <p className="font-display font-semibold text-base mb-4">Consultation Requests</p>
        <div className="grid lg:grid-cols-2 gap-4">
          <BarChart title="By Month" data={contactsByMonth} />
          <PieChart title="By Status" data={contactsByStatus} />
        </div>
        <div className="mt-4">
          <BarChart title="By Matter Type" data={contactsByMatter.slice(0, 15)} />
        </div>
      </section>

      <section>
        <p className="font-display font-semibold text-base mb-4">Internship Applications</p>
        <div className="grid lg:grid-cols-2 gap-4">
          <BarChart title="By Preferred Month" data={internshipsByMonth} />
          <PieChart title="By Status" data={internshipsByStatus} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <PieChart title="By Mode of Internship" data={internshipsByMode} />
          <PieChart title="By Gender" data={internshipsByGender} />
        </div>
      </section>
    </div>
  );
}
