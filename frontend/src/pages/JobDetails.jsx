import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Percent,
  UserCheck,
  XCircle,
} from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../lib/api.js";
import { ELIGIBILITY_TYPES, closingLabel, formatDate, ordinalYear } from "../lib/constants.js";
import { CompanyAvatar, FieldChip, TypeChip, UrgencyLabel } from "../components/ui.jsx";

// Loaded by id from the API, so the page works on refresh, from a
// bookmark, or from an email link (the old version relied on router state).
export default function JobDetails() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getOpportunity(opportunityId)
      .then((data) => !cancelled && setOpp(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  // While a save/unsave request is running the button is disabled, so a
  // quick double-click can't send "remove" before "add" has finished.
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  async function toggleBookmark() {
    if (bookmarkBusy) return;
    const next = !opp.bookmarked;
    setOpp({ ...opp, bookmarked: next });
    setBookmarkBusy(true);
    try {
      if (next) await api.addBookmark(opp.opportunity_id);
      else await api.removeBookmark(opp.opportunity_id);
    } catch (err) {
      setOpp((o) => ({ ...o, bookmarked: !next }));
      setError(err.message);
    } finally {
      setBookmarkBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Opportunity">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-white" />
          <div className="h-64 rounded-xl bg-white" />
        </div>
      </AppShell>
    );
  }

  if (!opp) {
    return (
      <AppShell title="Opportunity not found">
        <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-sm text-muted">{error || "This opportunity could not be loaded."}</p>
          <Link
            to="/eligible"
            className="mt-5 inline-block rounded-md bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white"
          >
            Back to opportunities
          </Link>
        </div>
      </AppShell>
    );
  }

  const blocked = opp.is_closed || !opp.eligible || opp.applied;
  const buttonLabel = opp.applied
    ? "Already applied"
    : opp.is_closed
    ? "Opportunity closed"
    : !opp.eligible
    ? "Not eligible"
    : "Apply now";

  // [icon, label, value] for the requirements grid
  const requirements = [
    [BookOpen, "Field of study", opp.field_of_study],
    [Briefcase, "Opportunity type", opp.opportunity_type],
    [
      UserCheck,
      "Open to",
      ELIGIBILITY_TYPES.find((e) => e.value === opp.eligibility_type)?.label || opp.eligibility_type,
    ],
    [Percent, "Minimum average", opp.minimum_average != null ? `${opp.minimum_average}%` : "No minimum"],
    [CalendarClock, "Year of study", opp.year_level_required ? `${ordinalYear(opp.year_level_required)} or later` : "Any"],
    [Award, "Qualification", opp.required_qualification || "Any"],
    [MapPin, "Province", opp.province || "Nationwide"],
  ];

  return (
    <AppShell>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {error && <div className="mb-4 rounded-[10px] bg-amber-bg px-4 py-3 text-sm text-[#966B1F]">{error}</div>}

      {/* header */}
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompanyAvatar name={opp.company_name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{opp.company_name}</p>
            <h1 className="mt-1 text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]">{opp.title}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TypeChip type={opp.opportunity_type} />
              <FieldChip field={opp.field_of_study} />
              <span className="inline-flex items-center gap-1 px-1 text-xs text-muted">
                <MapPin size={12} /> {opp.province || "Nationwide"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
            <h2 className="text-xl font-medium tracking-tight">About this opportunity</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-muted">{opp.description}</p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-6 md:p-7">
            <h2 className="text-xl font-medium tracking-tight">Requirements</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {requirements.map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 py-1">
                  <Icon size={17} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-0.5 text-sm font-bold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* apply panel: sticks while scrolling on large screens */}
        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-8">
          <div
            className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
              opp.eligible ? "bg-green-bg text-[#3F7A33]" : "bg-gray-bg text-muted"
            }`}
          >
            {opp.eligible ? <CheckCircle2 size={20} className="shrink-0" /> : <XCircle size={20} className="shrink-0" />}
            <p className="text-sm font-bold">
              {opp.eligible ? "You're eligible for this" : "Your profile doesn't meet the requirements"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Closing date</p>
            <p className="mt-1 text-sm font-bold">{formatDate(opp.closing_date, true)}</p>
            <div className="mt-2">
              <UrgencyLabel date={opp.closing_date} label={closingLabel(opp.closing_date)} />
            </div>
            {opp.is_closed && (
              <p className="mt-2 text-sm font-semibold text-muted">This opportunity no longer accepts applications.</p>
            )}
          </div>

          <button
            type="button"
            disabled={blocked}
            onClick={() => navigate(`/apply/${opp.opportunity_id}`)}
            className={`h-12 w-full rounded-md px-6 text-[12.5px] font-medium uppercase tracking-[0.14em] transition-colors ${
              blocked ? "cursor-not-allowed bg-gray-bg text-muted" : "bg-ink text-white hover:bg-ink-soft"
            }`}
          >
            {buttonLabel}
          </button>

          <button
            type="button"
            onClick={toggleBookmark}
            disabled={bookmarkBusy}
            aria-pressed={opp.bookmarked}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-black/15 px-6 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-60"
          >
            {opp.bookmarked ? <BookmarkCheck size={17} fill="currentColor" /> : <Bookmark size={17} />}
            {opp.bookmarked ? "Saved to watchlist" : "Save to watchlist"}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
