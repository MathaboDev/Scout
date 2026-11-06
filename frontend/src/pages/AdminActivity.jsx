import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import AdminShell from "../components/AdminShell.jsx";
import { api } from "../lib/api.js";

const REFRESH_MS = 30000;

const FEED_ICONS = {
  student_signup: UserPlus,
  provider_signup: Building2,
  listing_posted: Briefcase,
  application: FileText,
  outcome: CheckCircle2,
};

// Admin activity monitoring: platform totals, 14-day trends, application
// pipeline, most-applied listings and a live feed of recent events.
export default function AdminActivity() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    return api
      .adminActivity()
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const t = data?.totals || {};

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Platform activity</h1>
          <p className="mt-1.5 text-sm text-muted">
            How students and providers are using Scout. Refreshes every 30 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5 hover:bg-gray-bg disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {data ? `Updated ${timeOfDay(data.generated_at)}` : "Loading"}
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
          <AlertCircle size={15} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!data ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Students" value={t.students} sub={`${t.verified_students} email verified`} />
            <Stat label="Providers" value={t.providers} />
            <Stat label="Live listings" value={t.live_listings} sub={`${t.pending_listings} awaiting verification`} />
            <Stat label="Applications" value={t.applications} sub={`${t.applications_7d} in the last 7 days`} />
            <Stat label="Active users" value={t.active_users_7d} sub="signed in, last 7 days" />
            <Stat label="New sign-ups" value={t.signups_7d} sub="last 7 days" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Sign-ups per day" note="Students and providers, last 14 days">
              <DailyBars days={data.daily} field="signups" unit="sign-up" />
            </Panel>
            <Panel title="Applications per day" note="Submitted applications, last 14 days">
              <DailyBars days={data.daily} field="applications" unit="application" />
            </Panel>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Panel title="Application pipeline" note={`${t.applications} total`}>
              <Pipeline byStatus={data.applications_by_status} outcomes={data.outcomes} />
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[13px] text-muted">
                <Bell size={14} />
                <span>
                  <span className="font-medium text-ink">{t.reminders_sent}</span> of {t.bookmarks} bookmarks
                  have received a closing reminder
                </span>
              </div>
            </Panel>

            <Panel title="Most applied-to listings" className="lg:col-span-2">
              <TopListings rows={data.top_listings} />
            </Panel>
          </div>

          <Panel title="Recent activity" className="mt-5">
            <Feed rows={data.recent_activity} />
          </Panel>
        </>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 anim-fade-up">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-[28px] font-medium leading-none tracking-tight">{value ?? 0}</p>
      {sub && <p className="mt-1.5 text-[11.5px] text-muted">{sub}</p>}
    </div>
  );
}

function Panel({ title, note, className = "", children }) {
  return (
    <section className={`rounded-2xl border border-black/[0.06] bg-white p-5 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium">{title}</h2>
        {note && <p className="text-[12px] text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

// One-series bar chart: one bar per day, hover a column for its value.
// A table version sits underneath for screen readers and exact numbers.
function DailyBars({ days, field, unit }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...days.map((d) => d[field]));
  const total = days.reduce((n, d) => n + d[field], 0);
  const active = hover != null ? days[hover] : null;

  return (
    <div>
      <div className="mb-2 flex h-5 items-baseline justify-between text-[12px] text-muted">
        <span>
          {active ? (
            <>
              <span className="font-medium text-ink">{active[field]}</span> {plural(unit, active[field])} on{" "}
              {dayLabel(active.date, true)}
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{total}</span> {plural(unit, total)} in 14 days
            </>
          )}
        </span>
        <span>max {max}</span>
      </div>

      <div className="relative h-40" onMouseLeave={() => setHover(null)}>
        {/* recessive gridlines at the top and middle */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        <div className="relative flex h-full items-end gap-[2px] border-b border-line" aria-hidden="true">
          {days.map((d, i) => {
            const pct = (d[field] / max) * 100;
            return (
              <div
                key={d.date}
                className="flex h-full flex-1 cursor-default items-end"
                onMouseEnter={() => setHover(i)}
              >
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${
                    hover === i ? "bg-brand" : "bg-ink"
                  }`}
                  style={{ height: d[field] ? `${Math.max(pct, 3)}%` : 0 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden="true">
        <span>{dayLabel(days[0]?.date)}</span>
        <span>{dayLabel(days[Math.floor(days.length / 2)]?.date)}</span>
        <span>Today</span>
      </div>

      <details className="mt-3 text-[12px] text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">{plural(unit, 2)}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className="border-b border-line/60 last:border-0">
                <td className="py-1">{dayLabel(d.date, true)}</td>
                <td className="py-1 text-right text-ink">{d[field]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Pipeline({ byStatus, outcomes }) {
  const rows = [
    ["Submitted", byStatus["Submitted"] || 0],
    ["Under Review", byStatus["Under Review"] || 0],
    ["Outcome Received", byStatus["Outcome Received"] || 0],
  ];
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <div className="space-y-3">
      {rows.map(([label, n]) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span>{label}</span>
            <span className="font-medium">{n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-bg">
            <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-[12px] text-muted">
        Outcomes: <span className="font-medium text-ink">{outcomes.Successful}</span> successful,{" "}
        <span className="font-medium text-ink">{outcomes.Unsuccessful}</span> unsuccessful
      </p>
    </div>
  );
}

function TopListings({ rows }) {
  if (!rows.length) return <p className="text-sm text-muted">No verified listings yet.</p>;
  return (
    <table className="w-full text-left text-[13px]">
      <thead>
        <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-muted">
          <th className="pb-2 font-medium">Listing</th>
          <th className="pb-2 text-right font-medium">Applications</th>
          <th className="pb-2 text-right font-medium">Bookmarks</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.opportunity_id} className="border-b border-line/60 last:border-0">
            <td className="py-2.5">
              <p className="font-medium">{r.title}</p>
              <p className="text-[12px] text-muted">{r.provider_name}</p>
            </td>
            <td className="py-2.5 text-right font-medium">{r.applications}</td>
            <td className="py-2.5 text-right">{r.bookmarks}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Feed({ rows }) {
  if (!rows.length) return <p className="text-sm text-muted">Nothing has happened yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((r, i) => {
        const Icon = FEED_ICONS[r.kind] || FileText;
        return (
          <li key={`${r.kind}-${r.at}-${i}`} className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-bg">
              <Icon size={14} className="text-ink/70" />
            </span>
            <p className="min-w-0 flex-1 truncate text-[13.5px]">
              <span className="font-medium">{r.actor}</span> {r.detail}
            </p>
            <span className="shrink-0 text-[12px] text-muted">{timeAgo(r.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- small formatting helpers ----------

function plural(word, n) {
  return n === 1 ? word : `${word}s`;
}

function dayLabel(iso, long = false) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-ZA", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
}

function timeOfDay(iso) {
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
