import { Bookmark, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function JobDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const job = location.state?.job;

  // If the page was opened directly without job data
  if (!job) {
    return (
      <div className="min-h-screen bg-cream px-6 py-10 text-ink md:px-12">
        <button
          type="button"
          onClick={() => navigate("/eligible")}
          className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={17} />
          Back to opportunities
        </button>

        <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="text-xl font-bold">Opportunity not found</h1>

          <p className="mt-2 text-sm text-muted">
            This opportunity could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => navigate("/eligible")}
            className="mt-5 rounded-[10px] bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to opportunities
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(job.closingDate) < new Date();

  const formattedClosingDate = new Date(
    job.closingDate
  ).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleApply = () => {
    if (isExpired || !job.eligible) return;

    navigate("/apply", {
      state: { job },
    });
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-12">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft size={17} />
          Back to opportunities
        </button>

        {/* Header */}
        <section className="mt-7 rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            {/* Company letter */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-bg text-lg font-bold text-ink">
              {job.letter}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold capitalize md:text-3xl">
                {job.title}
              </h1>

              <p className="mt-2 text-sm text-muted">
                {job.company} · {job.location}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-semibold text-lime-ink">
                  {job.type}
                </span>

                <span className="rounded-full bg-gray-bg px-3 py-1 text-xs font-semibold text-muted">
                  {job.fieldOfStudy}
                </span>

                {isExpired && (
                  <span className="rounded-full bg-gray-bg px-3 py-1 text-xs font-semibold text-muted">
                    Closed
                  </span>
                )}
              </div>
            </div>

            {/* Bookmark */}
            <button
              type="button"
              onClick={() => {
                const saved =
                  JSON.parse(localStorage.getItem("bookmarkedJobs")) || [];

                const alreadyBookmarked = saved.some(
                  (item) => item.id === job.id
                );

                const updated = alreadyBookmarked
                  ? saved.filter((item) => item.id !== job.id)
                  : [...saved, job];

                localStorage.setItem(
                  "bookmarkedJobs",
                  JSON.stringify(updated)
                );

                // Refresh page state so bookmark icon updates
                window.location.reload();
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-bg text-muted transition hover:text-ink"
              aria-label="Bookmark opportunity"
            >
              <Bookmark size={18} />
            </button>
          </div>
        </section>

        {/* Closing date */}
        <section className="mt-5 rounded-2xl border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Closing date
          </p>

          <p className="mt-2 text-sm font-bold">
            {formattedClosingDate}
          </p>

          {isExpired && (
            <p className="mt-2 text-sm font-semibold text-muted">
              This opportunity is closed and is no longer accepting
              applications.
            </p>
          )}
        </section>

        {/* Description */}
        <section className="mt-5 rounded-2xl border border-line bg-white p-6 md:p-8">
          <h2 className="text-lg font-bold">About this opportunity</h2>

          <p className="mt-3 text-sm leading-7 text-muted">
            This opportunity is available through {job.company}. The role is
            based in {job.location} and is suitable for students and graduates
            studying in the {job.fieldOfStudy} field.
          </p>

          <p className="mt-4 text-sm leading-7 text-muted">
            Review the opportunity requirements and application information
            carefully before applying.
          </p>
        </section>

        {/* Opportunity information */}
        <section className="mt-5 rounded-2xl border border-line bg-white p-6 md:p-8">
          <h2 className="text-lg font-bold">Opportunity information</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted">
                Company
              </p>
              <p className="mt-1 text-sm font-semibold">
                {job.company}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted">
                Location
              </p>
              <p className="mt-1 text-sm font-semibold">
                {job.location}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted">
                Opportunity type
              </p>
              <p className="mt-1 text-sm font-semibold">
                {job.type}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted">
                Field of study
              </p>
              <p className="mt-1 text-sm font-semibold">
                {job.fieldOfStudy}
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-[10px] border border-line bg-white px-6 py-3 text-sm font-bold text-ink hover:bg-gray-bg"
          >
            Back
          </button>

          <button
            type="button"
            disabled={isExpired || !job.eligible}
            onClick={handleApply}
            className={`rounded-[10px] px-6 py-3 text-sm font-bold ${
              isExpired || !job.eligible
                ? "cursor-not-allowed bg-gray-bg text-muted"
                : "bg-ink text-white hover:opacity-90"
            }`}
          >
            {isExpired ? "Opportunity closed" : "Apply now"}
          </button>
        </div>
      </main>
    </div>
  );
}