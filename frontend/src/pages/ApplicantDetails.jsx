import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, FileText } from "lucide-react";
import ProviderShell, { Card, ErrorNote, PageHeader, Toast } from "../components/ProviderShell.jsx";
import StatusBadge, { StatusTimeline } from "../components/StatusBadge.jsx";
import { api } from "../lib/api.js";
import { APPLICATION_STATUSES, OUTCOME_RESULTS, formatDate, ordinalYear } from "../lib/constants.js";

// One applicant + the status control (FR10). The status saved here is the
// same column the student's dashboard polls, so they see it within ~15 s.
export default function ApplicantDetails() {
  const { listingId, applicationId } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [missing, setMissing] = useState([]);
  const [nextStatus, setNextStatus] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    api
      .getApplicant(applicationId)
      .then((data) => {
        setApplicant(data.applicant);
        setDocuments(data.documents);
        setMissing(data.missing_documents);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Status only moves forward: Submitted -> Under Review -> Outcome Received.
  const currentIndex = applicant ? APPLICATION_STATUSES.indexOf(applicant.status) : 0;
  const forwardOptions = APPLICATION_STATUSES.slice(currentIndex + 1);
  const finished = applicant?.status === "Outcome Received";

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const data = await api.updateApplicantStatus(applicationId, {
        status: nextStatus,
        outcome_result: nextStatus === "Outcome Received" ? outcome : null,
      });
      setApplicant(data.applicant);
      setNextStatus("");
      setOutcome("");
      setToast("Status updated. The student has been notified.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const backLink = (
    <Link
      to={`/provider/listings/${listingId}/applicants`}
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
    >
      <ArrowLeft size={16} /> Back to applicants
    </Link>
  );

  if (loading || !applicant) {
    return (
      <ProviderShell>
        {backLink}
        {loading ? <p className="text-sm text-muted">Loading...</p> : <ErrorNote>{error || "Applicant not found."}</ErrorNote>}
      </ProviderShell>
    );
  }

  const isGraduate = applicant.student_type === "Graduate";
  const details = [
    ["Full name", `${applicant.first_name} ${applicant.last_name}`],
    ["Email", applicant.email],
    ["Institution", applicant.institution],
    ["Field of study", applicant.field_of_study],
    isGraduate
      ? ["Qualification", `${applicant.qualification} (${applicant.graduate_type})`]
      : ["Year of study", ordinalYear(applicant.year_level)],
    ["Academic average", applicant.academic_average != null ? `${applicant.academic_average}%` : ""],
    ["Province", applicant.province],
    ["Reference", applicant.reference_number],
    ["Applied", formatDate(applicant.submitted_at, true)],
  ];

  const canSave = nextStatus && (nextStatus !== "Outcome Received" || outcome);

  return (
    <ProviderShell>
      {backLink}
      <PageHeader
        title={`${applicant.first_name} ${applicant.last_name}`}
        subtitle={`Applied for ${applicant.opportunity_title}`}
        action={<StatusBadge status={applicant.status} outcome={applicant.outcome_result} />}
      />

      <ErrorNote>{error}</ErrorNote>

      <div className="grid max-w-5xl gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card className="sm:p-8">
            <h2 className="mb-5 border-b border-line pb-4 text-lg font-medium tracking-tight">Applicant details</h2>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold">{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="sm:p-8">
            <h2 className="mb-3 text-lg font-medium tracking-tight">Documents</h2>
            <ul className="divide-y divide-line">
              {documents.map((d) => (
                <li key={d.document_id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <FileText size={16} className="text-muted" /> {d.file_name}
                  </span>
                  <span className="rounded-full bg-green-bg px-3 py-1 text-xs font-bold capitalize text-[#3F7A33]">
                    {d.document_type.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
              {missing.map((m) => (
                <li key={m.document_type} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex items-center gap-2.5 font-semibold text-muted">
                    <AlertTriangle size={16} /> {m.label}
                  </span>
                  <span className="rounded-full bg-amber-bg px-3 py-1 text-xs font-bold text-[#966B1F]">Not attached</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 text-lg font-medium tracking-tight">Progress</h2>
            <StatusTimeline status={applicant.status} outcome={applicant.outcome_result} />
          </Card>

          <Card>
            <h2 className="text-lg font-medium tracking-tight">Update status</h2>
            {finished ? (
              <p className="mt-2 text-sm text-muted">
                Outcome recorded {formatDate(applicant.outcome_received_at, true)}. No further changes.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted">The student sees this on their dashboard and gets notified.</p>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="mt-4 w-full rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-ink"
                >
                  <option value="">Move to...</option>
                  {forwardOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                {nextStatus === "Outcome Received" && (
                  <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Outcome">
                    {OUTCOME_RESULTS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={outcome === r}
                        onClick={() => setOutcome(r)}
                        className={`flex-1 rounded-md border px-3 py-2 text-[12px] font-medium uppercase tracking-[0.12em] ${
                          outcome === r ? "border-ink bg-ink text-white" : "border-line hover:bg-gray-bg"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-6 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-ink-soft disabled:opacity-50"
                >
                  <Check size={15} /> {saving ? "Saving..." : "Save status"}
                </button>
              </>
            )}
          </Card>
        </div>
      </div>

      <Toast message={toast} />
    </ProviderShell>
  );
}
