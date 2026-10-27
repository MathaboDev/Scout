import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, MapPin, Search, X } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { FluidGradient } from "../components/landing.jsx";
import { CompanyAvatar, FieldChip, SkeletonCard, TypeChip, UrgencyLabel, daysUntil } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { FIELD_OF_STUDY_OPTIONS, OPPORTUNITY_TYPES, closingLabel } from "../lib/constants.js";
import { useAuth } from "../context/AuthContext.jsx";

// FR2: two views only, "Eligible" (default) and "View all".
// Eligibility is decided by the backend from the stored profile; this
// page only displays the `eligible` flag it receives. Search and filters
// only narrow down the list the backend already sent.
export default function Eligible() {
  const { user } = useAuth();
  const [view, setView] = useState("eligible");
  const [results, setResults] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .listOpportunities(view)
      .then((data) => {
        if (cancelled) return;
        setResults(data.results);
        setProfileComplete(data.profile_complete);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [view]);

  // ids with a save/unsave request still running. Extra clicks are ignored
  // until it finishes, so requests can't arrive at the server out of order.
  // (useRef keeps the value between renders without causing a re-render.)
  const bookmarkBusy = useRef(new Set());

  async function toggleBookmark(opp) {
    if (bookmarkBusy.current.has(opp.opportunity_id)) return;
    bookmarkBusy.current.add(opp.opportunity_id);
    const next = !opp.bookmarked;
    // optimistic update, rolled back if the server refuses
    setResults((rows) =>
      rows.map((r) => (r.opportunity_id === opp.opportunity_id ? { ...r, bookmarked: next } : r))
    );
    try {
      if (next) await api.addBookmark(opp.opportunity_id);
      else await api.removeBookmark(opp.opportunity_id);
    } catch (err) {
      setResults((rows) =>
        rows.map((r) => (r.opportunity_id === opp.opportunity_id ? { ...r, bookmarked: !next } : r))
      );
      setError(err.message);
    } finally {
      bookmarkBusy.current.delete(opp.opportunity_id);
    }
  }

  // useMemo: only recompute the filtered list when its inputs change
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter(
      (r) =>
        (!q || r.title.toLowerCase().includes(q) || (r.company_name || "").toLowerCase().includes(q)) &&
        (!typeFilter || r.opportunity_type === typeFilter) &&
        (!fieldFilter || r.field_of_study === fieldFilter)
    );
  }, [results, query, typeFilter, fieldFilter]);

  const filtersActive = Boolean(query || typeFilter || fieldFilter);
  const closingSoon = results.filter((r) => {
    const d = daysUntil(r.closing_date);
    return d !== null && d >= 0 && d <= 7;
  }).length;
  const companies = new Set(results.map((r) => r.company_name)).size;
  const firstName = user?.first_name || "";

  function clearFilters() {
    setQuery("");
    setTypeFilter("");
    setFieldFilter("");
  }

  return (
    <AppShell>
      {/* greeting on a strip of the landing page gradient */}
      <section className="relative overflow-hidden rounded-[24px] px-6 py-9 text-white sm:px-10 sm:py-12">
        <FluidGradient />
        <div className="relative">
      <h1 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]">
        {firstName ? `Hi ${firstName}` : "Scouted jobs"}
      </h1>
      <p className="mt-3 text-[15px] text-white/90">
        {loading
          ? "Finding opportunities for you..."
          : `${results.length} ${view === "eligible" ? "matching" : "open"} ${
              results.length === 1 ? "opportunity" : "opportunities"
            } from ${companies} ${companies === 1 ? "company" : "companies"}${
              closingSoon ? `, ${closingSoon} closing this week` : ""
            }.`}
      </p>
        </div>
      </section>

      {/* FR2 view switch */}
      <div className="mt-6 flex gap-6 border-b border-line" role="tablist">
        {[
          ["eligible", "Eligible for me"],
          ["all", "All opportunities"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={`-mb-px border-b-2 pb-3 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors ${
              view === key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!profileComplete && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F2D7A6] bg-amber-bg px-4 py-3 text-sm text-[#966B1F]">
          <span>Finish your profile so Scout can match you.</span>
          <Link to="/profile" className="font-semibold underline">
            Complete profile
          </Link>
        </div>
      )}

      {error && <div className="mt-6 rounded-lg bg-amber-bg px-4 py-3 text-sm text-[#966B1F]">{error}</div>}

      {/* search + filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search opportunities</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role or company"
            className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-ink"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {OPPORTUNITY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={`rounded-md border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                typeFilter === t ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
          {view === "all" && (
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              aria-label="Field of study"
              className="rounded-md border border-line bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted outline-none hover:text-ink"
            >
              <option value="">All fields</option>
              {FIELD_OF_STUDY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-muted hover:text-ink"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {filtersActive && !loading && (
        <p className="mt-4 text-xs text-muted">
          Showing {shown.length} of {results.length}
        </p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)
        ) : shown.length === 0 ? (
          <EmptyState
            filtersActive={filtersActive}
            view={view}
            onClear={clearFilters}
            onViewAll={() => setView("all")}
          />
        ) : (
          shown.map((opp) => (
            <OpportunityCard
              key={opp.opportunity_id}
              opp={opp}
              showEligibility={view === "all"}
              onToggleBookmark={() => toggleBookmark(opp)}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ filtersActive, view, onClear, onViewAll }) {
  const heading = filtersActive
    ? "Nothing matches those filters"
    : view === "eligible"
    ? "No matches yet"
    : "No open opportunities right now";
  const text = filtersActive
    ? "Try a different search or clear the filters."
    : view === "eligible"
    ? "Nothing open matches your profile at the moment. Check all opportunities, or come back later."
    : "New listings appear here as soon as they're verified.";

  return (
    <div className="col-span-full rounded-2xl border border-line bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-medium tracking-tight">{heading}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>
      {(filtersActive || view === "eligible") && (
        <button
          type="button"
          onClick={filtersActive ? onClear : onViewAll}
          className="mt-5 rounded-md bg-ink px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-ink-soft"
        >
          {filtersActive ? "Clear filters" : "See all opportunities"}
        </button>
      )}
    </div>
  );
}

function OpportunityCard({ opp, showEligibility, onToggleBookmark }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-[#C9C6B8]">
      <div className="flex items-start gap-3">
        <CompanyAvatar name={opp.company_name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium tracking-tight leading-snug">{opp.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">{opp.company_name}</p>
        </div>
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-label={opp.bookmarked ? "Remove bookmark" : "Bookmark"}
          aria-pressed={opp.bookmarked}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
            opp.bookmarked ? "text-ink" : "text-muted hover:bg-gray-bg hover:text-ink"
          }`}
        >
          {opp.bookmarked ? <BookmarkCheck size={18} fill="currentColor" /> : <Bookmark size={18} />}
        </button>
      </div>

      {opp.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{opp.description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <TypeChip type={opp.opportunity_type} />
        <FieldChip field={opp.field_of_study} />
        <span className="inline-flex items-center gap-1 px-1 text-xs text-muted">
          <MapPin size={12} /> {opp.province || "Nationwide"}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
        <UrgencyLabel date={opp.closing_date} label={closingLabel(opp.closing_date)} />
        <div className="flex gap-2 text-xs font-semibold">
          {opp.applied && <span className="text-[#2F5FA0]">Applied</span>}
          {showEligibility &&
            (opp.eligible ? (
              <span className="text-[#3F7A33]">Eligible</span>
            ) : (
              <span className="text-muted">Not eligible</span>
            ))}
        </div>
      </div>

      <Link
        to={`/jobs/${opp.opportunity_id}`}
        className="mt-4 rounded-md border border-ink px-4 py-2 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
      >
        View details
      </Link>
    </article>
  );
}
