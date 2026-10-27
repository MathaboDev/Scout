import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import ProviderShell, { Card, ErrorNote, PageHeader, Toast } from "../components/ProviderShell.jsx";
import { FieldChip, SkeletonCard, StatTile, TypeChip, UrgencyLabel } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { closingLabel, formatDate } from "../lib/constants.js";

const STATE_STYLES = {
  Live: "bg-green-bg text-[#3F7A33]",
  "Pending verification": "bg-amber-bg text-[#966B1F]",
  Closed: "bg-gray-bg text-muted",
};

// Provider dashboard (FR10): only this provider's listings, from the API.
export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState({ company_name: "", results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(location.state?.flash || "");

  useEffect(() => {
    // clear the one-time flash message from history
    if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    api
      .providerListings()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleRemove(listing) {
    if (!window.confirm(`Remove "${listing.title}"? Students will no longer see it.`)) return;
    try {
      await api.removeListing(listing.opportunity_id);
      setData((d) => ({ ...d, results: d.results.filter((l) => l.opportunity_id !== listing.opportunity_id) }));
      setToast("Listing removed.");
    } catch (err) {
      setError(err.message);
    }
  }

  const listings = data.results;
  const live = listings.filter((l) => l.state === "Live").length;
  const applicants = listings.reduce((n, l) => n + l.applicant_count, 0);
  const awaiting = listings.reduce((n, l) => n + l.awaiting_review, 0);

  return (
    <ProviderShell>
      <PageHeader
        title={`Welcome back${data.company_name ? `, ${data.company_name}` : ""}`}
        subtitle="Your listings and the students who applied to them."
        action={
          <Link
            to="/provider/listings/new"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-ink-soft"
          >
            <Plus size={16} /> Post a listing
          </Link>
        }
      />

      <ErrorNote>{error}</ErrorNote>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatTile label="Awaiting review" value={loading ? "–" : awaiting} />
        <StatTile label="Live listings" value={loading ? "–" : live} />
        <StatTile label="Total applicants" value={loading ? "–" : applicants} />
      </div>

      <h2 className="mb-4 text-xl font-medium tracking-tight">Your listings</h2>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="text-center text-sm text-muted">
          You haven't posted any listings yet.{" "}
          <Link to="/provider/listings/new" className="font-bold text-lime-ink hover:underline">
            Post your first one
          </Link>
          .
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {listings.map((l) => (
            <Card
              key={l.opportunity_id}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-medium tracking-tight leading-snug">{l.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <TypeChip type={l.opportunity_type} />
                      <FieldChip field={l.field_of_study} />
                    </div>
                  </div>
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${STATE_STYLES[l.state]}`}>
                    {l.state}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>Posted {formatDate(l.posted_at)}</span>
                  <span>{l.province || "Nationwide"}</span>
                  <UrgencyLabel date={l.closing_date} label={closingLabel(l.closing_date)} />
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                  <Users size={16} className="text-muted" />
                  <span className="text-sm font-bold">
                    {l.applicant_count} applicant{l.applicant_count === 1 ? "" : "s"}
                  </span>
                  {l.awaiting_review > 0 && (
                    <span className="ml-auto text-xs font-semibold text-[#966B1F]">
                      {l.awaiting_review} new
                    </span>
                  )}
                </div>
                {l.state === "Pending verification" && (
                  <p className="mt-3 text-xs text-[#966B1F]">
                    Students will see this once a Scout admin verifies it.
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <Link
                  to={`/provider/listings/${l.opportunity_id}/applicants`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ink py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-ink-soft"
                >
                  <Users size={15} /> View applicants
                </Link>
                <Link
                  to={`/provider/listings/${l.opportunity_id}/edit`}
                  aria-label={`Edit ${l.title}`}
                  className="flex items-center justify-center rounded-xl2 border border-line px-3.5 text-muted hover:text-ink"
                >
                  <Pencil size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(l)}
                  aria-label={`Remove ${l.title}`}
                  className="flex items-center justify-center rounded-xl2 border border-line px-3.5 text-muted hover:text-[#C24A3A]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Toast message={toast} />
    </ProviderShell>
  );
}
