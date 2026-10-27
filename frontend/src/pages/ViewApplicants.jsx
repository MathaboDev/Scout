import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProviderShell, { Card, ErrorNote, PageHeader } from "../components/ProviderShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../lib/api.js";
import { formatDate, ordinalYear } from "../lib/constants.js";

// Applicants for ONE of this provider's listings (FR10).
// The backend refuses listings that belong to another provider.
export default function ViewApplicants() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listingApplicants(listingId)
      .then((data) => {
        setListing(data.listing);
        setApplicants(data.results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [listingId]);

  return (
    <ProviderShell>
      <Link
        to="/provider/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <PageHeader
        title={listing ? listing.title : "Applicants"}
        subtitle={listing ? `Closes ${formatDate(listing.closing_date)} · ${applicants.length} applicant${applicants.length === 1 ? "" : "s"}` : ""}
      />

      <ErrorNote>{error}</ErrorNote>

      <Card className="p-0 sm:p-0">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading...</p>
        ) : applicants.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">No one has applied to this listing yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Studies</th>
                  <th className="px-5 py-3 font-semibold">Applied</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.application_id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4">
                      <p className="font-bold">{a.first_name} {a.last_name}</p>
                      <p className="text-xs text-muted">{a.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{a.institution}</p>
                      <p className="text-xs text-muted">
                        {a.field_of_study},{" "}
                        {a.student_type === "Graduate" ? a.qualification : ordinalYear(a.year_level)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted">{formatDate(a.submitted_at)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} outcome={a.outcome_result} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/provider/listings/${listingId}/applicants/${a.application_id}`}
                        className="whitespace-nowrap rounded-md border border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.12em] hover:bg-ink hover:text-white"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ProviderShell>
  );
}
