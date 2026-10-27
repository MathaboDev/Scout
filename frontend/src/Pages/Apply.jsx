import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar"; 
import { getListingById, seedData } from "../api/dataService.js"; 

export default function Apply() {
  const navigate = useNavigate();
  const location = useLocation();
  const { opportunityId } = useParams(); // Grabs ID from URL if coming from email
  const [searchParams] = useSearchParams(); // Grabs the ?step=2 from URL
  
  // State for job (loads from state if clicked normally, or fetches if from email)
  const [job, setJob] = useState(location.state?.job || null);
  const [isLoading, setIsLoading] = useState(!location.state?.job);

  // If user opens from email link, fetch the job by ID
  useEffect(() => {
    if (!job && opportunityId) {
      seedData(); // Ensure data exists
      const foundJob = getListingById(opportunityId);
      setJob(foundJob || null);
      setIsLoading(false);
    }
  }, [job, opportunityId]);

  /*
   * Get the student's profile from localStorage.
   */
  const savedUser = JSON.parse(localStorage.getItem("user")) || {};

  /*
   * Application steps:
   * 1 = Application form
   * 2 = Missing documents
   * 3 = Review application
   * 4 = Application submitted + status
   */
  
  // Determine starting step (if email link has ?step=2, start at 2)
  const urlStep = searchParams.get("step");
  const [step, setStep] = useState(urlStep === "2" ? 2 : 1);

  const [formData, setFormData] = useState({
    fullName: savedUser.fullName || savedUser.full_name || "",
    email: savedUser.email || "",
    phone: savedUser.phone || "",
    institution: savedUser.institution || "CPUT",
    fieldOfStudy: savedUser.fieldOfStudy || "",
    yearOfStudy: savedUser.yearOfStudy || "",
  });

  const [documents, setDocuments] = useState({
    cv: null,
    id: null,
  });

  const [applicationId, setApplicationId] = useState("");

  
  const PageLayout = ({ children }) => (
    <div className="flex h-screen w-full bg-cream overflow-hidden font-sans">
      <Sidebar active="eligible" />
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-10">
        {children}
      </main>
    </div>
  );

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex h-full items-center justify-center text-muted">
          Loading application...
        </div>
      </PageLayout>
    );
  }

  // --- NOT FOUND STATE ---
  if (!job) {
    return (
      <PageLayout>
        <button
          type="button"
          onClick={() => navigate("/eligible")}
          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink mb-8"
        >
          <ArrowLeft size={17} /> Back to opportunities
        </button>

        <div className="mx-auto mt-10 max-w-[700px] rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-ink">Opportunity not found</h1>
          <p className="mt-2 text-sm text-muted">
            We couldn't load the opportunity you are trying to apply for.
          </p>
          <button
            type="button"
            onClick={() => navigate("/eligible")}
            className="mt-5 rounded-[10px] bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Back to opportunities
          </button>
        </div>
      </PageLayout>
    );
  }

  /*
   * Check whether the opportunity is closed.
   */
  const isExpired = new Date(job.closingDate) < new Date();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentUpload = (documentName, file) => {
    if (!file) return;
    setDocuments((prev) => ({ ...prev, [documentName]: file }));
  };

  /*
   * FR4 — Missing Documents Detection
   */
  const missingDocuments = [];
  if (!documents.cv) missingDocuments.push("CV");
  if (!documents.id) missingDocuments.push("ID document");

  const hasMissingDocuments = missingDocuments.length > 0;

  const handleContinue = () => {
    if (hasMissingDocuments) {
      setStep(2);
      return;
    }
    setStep(3);
  };

  const handleDocumentsContinue = () => {
    if (hasMissingDocuments) return;
    setStep(3);
  };

  /*
   * Submit the application.
   */
  const handleSubmit = () => {
    const generatedId = `SC-${Date.now().toString().slice(-6)}`;

    const application = {
      id: generatedId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      applicant: formData,
      documents: {
        cv: documents.cv?.name || null,
        id: documents.id?.name || null,
      },
    };

    const existingApplications = JSON.parse(localStorage.getItem("applications")) || [];

    localStorage.setItem(
      "applications",
      JSON.stringify([...existingApplications, application])
    );

    setApplicationId(generatedId);
    setStep(4);
  };

  const getApplicationStatus = () => {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const currentApplication = applications.find((app) => app.id === applicationId);
    return currentApplication?.status || "Submitted";
  };

  /*
   * STEP 4 — RECEIPT + APPLICATION STATUS
   */
  if (step === 4) {
    const currentStatus = getApplicationStatus();

    return (
      <PageLayout>
        <div className="mx-auto max-w-[760px] mt-6">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm md:p-10">
            {/* Success */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime/20">
                <CheckCircle size={34} className="text-lime-ink" />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-ink">
                Application submitted
              </h1>

              <p className="mt-2 max-w-[500px] text-sm leading-6 text-muted">
                Your application for{" "}
                <span className="font-semibold text-ink">{job.title}</span> at{" "}
                <span className="font-semibold text-ink">{job.company}</span> has been submitted successfully.
              </p>
            </div>

            {/* Application reference */}
            <div className="mt-8 rounded-xl bg-gray-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Application reference
              </p>
              <p className="mt-2 text-lg font-bold text-ink">{applicationId}</p>
            </div>

            {/* Application details */}
            <div className="mt-5 border-t border-line pt-5">
              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-muted">Opportunity</span>
                <span className="text-right text-sm font-semibold text-ink">{job.title}</span>
              </div>

              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-muted">Company</span>
                <span className="text-right text-sm font-semibold text-ink">{job.company}</span>
              </div>

              <div className="flex justify-between gap-4 py-2">
                <span className="text-sm text-muted">Submitted</span>
                <span className="text-right text-sm font-semibold text-ink">
                  {new Date().toLocaleDateString("en-ZA")}
                </span>
              </div>
            </div>

            {/* APPLICATION STATUS */}
            <div className="mt-7 rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Application status
                  </p>
                  <p className="mt-1 text-sm text-muted">Track the progress of your application.</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    currentStatus === "Accepted"
                      ? "bg-lime/20 text-lime-ink"
                      : currentStatus === "Rejected"
                      ? "bg-gray-bg text-muted"
                      : "bg-gray-bg text-ink"
                  }`}
                >
                  {currentStatus}
                </span>
              </div>

              {/* Status timeline */}
              <div className="mt-6 space-y-5">
                {/* Submitted */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime/20">
                    <CheckCircle size={16} className="text-lime-ink" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Application submitted</p>
                    <p className="mt-1 text-xs text-muted">Your application has been received.</p>
                  </div>
                </div>

                {/* Under review */}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      currentStatus !== "Submitted" ? "bg-lime/20" : "bg-gray-bg"
                    }`}
                  >
                    {currentStatus !== "Submitted" ? (
                      <CheckCircle size={16} className="text-lime-ink" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Under review</p>
                    <p className="mt-1 text-xs text-muted">The provider will review your application.</p>
                  </div>
                </div>

                {/* Final decision */}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      currentStatus === "Accepted" || currentStatus === "Rejected" ? "bg-lime/20" : "bg-gray-bg"
                    }`}
                  >
                    {currentStatus === "Accepted" || currentStatus === "Rejected" ? (
                      <CheckCircle size={16} className="text-lime-ink" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Final decision</p>
                    <p className="mt-1 text-xs text-muted">You will be notified when a decision is made.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/eligible")}
                className="flex-1 rounded-[10px] border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-gray-bg transition"
              >
                Back to opportunities
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  navigate("/apply", { replace: true }); // Clear URL params
                }}
                className="flex-1 rounded-[10px] bg-ink px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition"
              >
                Apply to another opportunity
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  /*
   * MAIN APPLICATION UI (Steps 1, 2, 3)
   */
  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-[900px]">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink transition"
        >
          <ArrowLeft size={17} /> Back
        </button>

        {/* Header */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Application
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{job.title}</h1>
          <p className="mt-1 text-sm text-muted">{job.company} · {job.location}</p>

          {isExpired && (
            <div className="mt-4 rounded-xl border border-line bg-gray-bg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="text-sm font-bold text-ink">This opportunity is closed</p>
                  <p className="mt-1 text-xs text-muted">
                    The closing date for this opportunity has passed, so new applications are no longer accepted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-7 flex items-center gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${
                item <= step ? "bg-ink" : "bg-gray-bg"
              }`}
            />
          ))}
        </div>

        <p className="mt-2 text-xs text-muted">Step {step} of 4</p>

        {/* STEP 1 — FORM */}
        {step === 1 && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-ink">Your application</h2>
            <p className="mt-1 text-sm text-muted">
              We've pre-filled this form using information from your profile. Check that everything is correct.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">Full name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Phone number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Field of study</label>
                <input
                  type="text"
                  name="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">Year of study</label>
                <input
                  type="text"
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-[10px] border-[1.5px] border-line bg-cream px-3.5 py-3 text-sm text-ink outline-none focus:border-ink transition"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={handleContinue}
                disabled={isExpired}
                className={`rounded-[10px] px-6 py-3 text-sm font-bold transition ${
                  isExpired
                    ? "cursor-not-allowed bg-gray-bg text-muted"
                    : "bg-ink text-white hover:bg-ink-soft"
                }`}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 — MISSING DOCUMENTS / FR4 */}
        {step === 2 && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-ink">Required documents</h2>
            <p className="mt-1 text-sm text-muted">
              We checked your application and found that some required documents are missing.
            </p>

            {hasMissingDocuments && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-gray-bg p-4">
                <AlertCircle size={21} className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="text-sm font-bold text-ink">Required documents missing</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Please upload the following documents before you can continue with your application:
                  </p>
                  <ul className="mt-2 list-disc pl-4 text-xs font-semibold text-ink">
                    {missingDocuments.map((document) => (
                      <li key={document}>{document}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* CV */}
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">CV / Resume</p>
                    <p className="mt-1 text-xs text-muted">Required</p>
                  </div>
                  <label className="cursor-pointer rounded-[10px] bg-gray-bg px-4 py-2 text-xs font-bold text-ink hover:bg-line transition">
                    {documents.cv ? "Replace" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleDocumentUpload("cv", e.target.files[0])}
                    />
                  </label>
                </div>

                {documents.cv ? (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-lime-ink">
                    <CheckCircle size={15} /> {documents.cv.name}
                  </p>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted">
                    <AlertCircle size={14} /> Document not uploaded
                  </p>
                )}
              </div>

              {/* ID */}
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">ID document</p>
                    <p className="mt-1 text-xs text-muted">Required</p>
                  </div>
                  <label className="cursor-pointer rounded-[10px] bg-gray-bg px-4 py-2 text-xs font-bold text-ink hover:bg-line transition">
                    {documents.id ? "Replace" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload("id", e.target.files[0])}
                    />
                  </label>
                </div>

                {documents.id ? (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-lime-ink">
                    <CheckCircle size={15} /> {documents.id.name}
                  </p>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted">
                    <AlertCircle size={14} /> Document not uploaded
                  </p>
                )}
              </div>
            </div>

            {hasMissingDocuments && (
              <div className="mt-5 rounded-xl border border-line bg-gray-bg p-4">
                <p className="text-xs font-bold text-ink">You still need to upload:</p>
                <p className="mt-1 text-xs text-muted">{missingDocuments.join(", ")}</p>
              </div>
            )}

            <div className="mt-7 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-[10px] border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-gray-bg transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={hasMissingDocuments}
                onClick={handleDocumentsContinue}
                className={`rounded-[10px] px-6 py-3 text-sm font-bold transition ${
                  hasMissingDocuments
                    ? "cursor-not-allowed bg-gray-bg text-muted"
                    : "bg-ink text-white hover:bg-ink-soft"
                }`}
              >
                Continue to review
              </button>
            </div>
          </section>
        )}

        {/* STEP 3 — REVIEW */}
        {step === 3 && (
          <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-ink">Review your application</h2>
            <p className="mt-1 text-sm text-muted">
              Please check your information before submitting. Nothing will be submitted until you confirm below.
            </p>

            <div className="mt-6 rounded-xl bg-gray-bg p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Applying for</p>
              <p className="mt-2 text-base font-bold text-ink">{job.title}</p>
              <p className="mt-1 text-sm text-muted">{job.company} · {job.location}</p>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-bold text-ink">Applicant information</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">Full name</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.fullName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Email</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Phone</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Institution</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.institution || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Field of study</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.fieldOfStudy || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Year of study</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formData.yearOfStudy || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <h3 className="text-sm font-bold text-ink">Documents</h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-lime-ink" />
                  <span className="text-ink">CV / Resume</span>
                  <span className="text-xs text-muted">({documents.cv?.name || "Not uploaded"})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-lime-ink" />
                  <span className="text-ink">ID document</span>
                  <span className="text-xs text-muted">({documents.id?.name || "Not uploaded"})</span>
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-xl border border-line bg-gray-bg p-4">
              <p className="text-sm font-semibold text-ink">
                By submitting this application, you confirm that the information provided is correct.
              </p>
            </div>

            <div className="mt-7 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-[10px] border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-gray-bg transition"
              >
                Edit application
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-[10px] bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink-soft transition"
              >
                Confirm & submit
              </button>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}