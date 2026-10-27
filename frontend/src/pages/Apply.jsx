import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle, FileText, UploadCloud } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { StatusTimeline } from "../components/StatusBadge.jsx";
import { api } from "../lib/api.js";
import { formatDate, ordinalYear } from "../lib/constants.js";

// FR3 + FR4 assisted application.
//
//   1 details    pre-filled from the STORED profile (read-only here;
//                edits happen on the profile page so the matching data
//                and the submitted data can never disagree)
//   2 documents  only if a required document is missing; upload here
//   3 review     everything that will be sent; nothing goes out until
//                "Confirm & submit" is clicked
//   4 receipt    reference number + live status
//
// The FR4 email links to /apply/<id>?resume=documents, which lands on
// step 2, or straight on step 3 if the documents are already there.

const STEPS = ["details", "documents", "review", "done"];
const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png";

export default function Apply() {
  const { opportunityId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resuming = searchParams.get("resume") === "documents";

  const [review, setReview] = useState(null);
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(null); // {message, code}
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadReview = useCallback(async () => {
    const data = await api.reviewApplication(Number(opportunityId));
    setReview(data);
    return data;
  }, [opportunityId]);

  useEffect(() => {
    let cancelled = false;
    loadReview()
      .then((data) => {
        if (cancelled) return;
        if (resuming) setStep(data.can_submit ? "review" : "documents");
        else setStep("details");
      })
      .catch((err) => !cancelled && setBlocking({ message: err.message, code: err.code }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadReview, resuming]);

  async function handleUpload(documentType, file) {
    if (!file) return;
    setError("");
    setUploading(documentType);
    try {
      await api.uploadDocument(documentType, file);
      const data = await loadReview();
      if (data.can_submit) setStep("review"); // FR4: resume straight at review
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading("");
    }
  }

  async function handleConfirm() {
    setError("");
    setSubmitting(true);
    try {
      const data = await api.confirmApplication(Number(opportunityId));
      setReceipt(data.application);
      setStep("done");
    } catch (err) {
      if (err.code === "missing_documents") {
        await loadReview();
        setStep("documents");
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- loading / blocked ----------
  if (loading) {
    return (
      <AppShell title="Application">
        <p className="mt-6 text-sm text-muted">Preparing your application...</p>
      </AppShell>
    );
  }

  if (blocking) {
    const action =
      blocking.code === "profile_incomplete"
        ? { to: "/profile", label: "Complete your profile" }
        : blocking.code === "already_applied"
        ? { to: "/watchlist", label: "View my applications" }
        : { to: "/eligible", label: "Back to opportunities" };
    return (
      <AppShell title="Application">
        <div className="mx-auto mt-8 max-w-[640px] rounded-2xl border border-line bg-white p-8 text-center">
          <AlertCircle size={28} className="mx-auto text-muted" />
          <p className="mt-3 text-sm font-semibold">{blocking.message}</p>
          <Link
            to={action.to}
            className="mt-5 inline-block rounded-md bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white"
          >
            {action.label}
          </Link>
        </div>
      </AppShell>
    );
  }

  const { applicant, opportunity, documents, missing_documents: missing, can_submit } = review;
  const stepNumber = STEPS.indexOf(step) + 1;

  // ---------- receipt ----------
  if (step === "done" && receipt) {
    return (
      <AppShell title="Application submitted">
        <div className="mx-auto mt-6 max-w-[720px] rounded-2xl border border-line bg-white p-8 shadow-sm md:p-10">
          <div className="text-center">
            <CheckCircle size={40} className="mx-auto text-lime-ink" />
            <h2 className="mt-4 text-3xl font-medium tracking-tight">You're in</h2>
            <p className="mt-2 text-sm text-muted">
              A copy of this receipt has been sent to {receipt.email}.
            </p>
          </div>

          <div className="mt-8 rounded-xl bg-gray-bg p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reference number</p>
            <p className="mt-1 text-xl font-medium tracking-tight">{receipt.reference_number}</p>
          </div>

          <dl className="mt-5 divide-y divide-line border-t border-line text-sm">
            {[
              ["Name", receipt.student_name],
              ["Opportunity", receipt.opportunity_title],
              ["Provider", receipt.company_name],
              ["Submitted", formatDate(receipt.submitted_at, true)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 rounded-2xl border border-line p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
            <StatusTimeline status={receipt.status} outcome={receipt.outcome_result} />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/eligible"
              className="flex-1 rounded-md border border-black/15 px-5 py-3 text-center text-[12px] font-medium uppercase tracking-[0.12em] hover:bg-gray-bg"
            >
              Browse more opportunities
            </Link>
            <Link
              to="/watchlist"
              className="flex-1 rounded-md bg-ink px-5 py-3 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:opacity-90"
            >
              Track my applications
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={opportunity.title} subtitle={`${opportunity.company_name} · Application`}>
      <div className="mx-auto mt-4 w-full max-w-[880px]">
        <button
          type="button"
          onClick={() => navigate(`/jobs/${opportunity.opportunity_id}`)}
          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={17} /> Back to opportunity
        </button>

        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i < stepNumber ? "bg-ink" : "bg-gray-bg"}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Step {stepNumber} of 4</p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-md bg-amber-bg px-4 py-3 text-sm text-[#966B1F]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* ---------- STEP 1: pre-filled details ---------- */}
        {step === "details" && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-medium tracking-tight">Your details</h2>
            <p className="mt-1 text-sm text-muted">
              Filled in from your Scout profile. Need to change something?{" "}
              <Link to="/profile" className="font-bold text-lime-ink hover:underline">
                Edit your profile
              </Link>
              .
            </p>
            <ApplicantGrid applicant={applicant} />
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(can_submit ? "review" : "documents")}
                className="rounded-md bg-ink px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {/* ---------- STEP 2: missing documents (FR4) ---------- */}
        {step === "documents" && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-medium tracking-tight">Required documents</h2>
            {missing.length > 0 ? (
              <div className="mt-4 rounded-xl border border-line bg-amber-bg p-4 text-sm text-[#966B1F]">
                <p className="font-bold">Upload these to continue: {missing.map((m) => m.label).join(", ")}</p>
                <p className="mt-1 text-xs">
                  We've also emailed you a link back to this step. Uploads are saved to your profile, so you
                  won't need them again for other applications.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">All required documents are on file.</p>
            )}

            <div className="mt-5 space-y-3">
              {missing.map((doc) => (
                <div
                  key={doc.document_type}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"
                >
                  <div className="flex items-center gap-2.5 text-sm font-semibold">
                    <FileText size={16} className="text-muted" /> {doc.label}
                  </div>
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-white">
                    <UploadCloud size={14} />
                    {uploading === doc.document_type ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept={DOC_ACCEPT}
                      className="hidden"
                      disabled={Boolean(uploading)}
                      onChange={(e) => handleUpload(doc.document_type, e.target.files?.[0])}
                    />
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">PDF, JPG or PNG, up to 5 MB.</p>

            <div className="mt-7 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="rounded-md border border-black/15 px-5 py-3 text-[12px] font-medium uppercase tracking-[0.12em] hover:bg-gray-bg"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!can_submit}
                onClick={() => setStep("review")}
                className={`rounded-md px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] ${
                  can_submit ? "bg-ink text-white hover:opacity-90" : "cursor-not-allowed bg-gray-bg text-muted"
                }`}
              >
                Continue to review
              </button>
            </div>
          </section>
        )}

        {/* ---------- STEP 3: review & confirm (FR3) ---------- */}
        {step === "review" && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-medium tracking-tight">Review your application</h2>
            <p className="mt-1 text-sm text-muted">
              This is exactly what {opportunity.company_name} will receive. Nothing is sent until you confirm.
            </p>

            <div className="mt-6 rounded-xl bg-gray-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Applying for</p>
              <p className="mt-1 font-bold">{opportunity.title}</p>
              <p className="text-sm text-muted">
                {opportunity.company_name} · closes {formatDate(opportunity.closing_date)}
              </p>
            </div>

            <h3 className="mt-6 text-sm font-bold">Applicant information</h3>
            <ApplicantGrid applicant={applicant} />

            <h3 className="mt-7 text-sm font-bold">Attached documents</h3>
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li key={d.document_id} className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-lime-ink" />
                  <span className="font-semibold">{d.file_name}</span>
                  <span className="text-xs text-muted">({d.document_type.replace(/_/g, " ")})</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="rounded-md border border-black/15 px-5 py-3 text-[12px] font-medium uppercase tracking-[0.12em] hover:bg-gray-bg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || !can_submit}
                className="rounded-md bg-ink px-6 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Confirm & submit"}
              </button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function ApplicantGrid({ applicant }) {
  const isGraduate = applicant.student_type === "Graduate";
  const rows = [
    ["Full name", `${applicant.first_name} ${applicant.last_name}`],
    ["Email", applicant.email],
    ["Institution", applicant.institution],
    ["Field of study", applicant.field_of_study],
    isGraduate
      ? ["Qualification", `${applicant.qualification} (${applicant.graduate_type})`]
      : ["Year of study", ordinalYear(applicant.year_level)],
    ["Academic average", `${applicant.academic_average}%`],
    ["Province", applicant.province],
  ];
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-1 text-sm font-semibold">{value || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}
