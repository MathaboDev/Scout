import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function JobCard({
  job,
  bookmarked = false,
  onToggleBookmark,
}) {
  const navigate = useNavigate();

  const isEligible = job.eligible;

  const handleViewDetails = () => {
    navigate(`/jobs/${job.id}`, {
      state: { job },
    });
  };

  return (
    <div
      className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${
        !isEligible ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-bg text-sm font-bold text-ink">
          {job.letter}
        </div>

        <button
          type="button"
          onClick={handleViewDetails}
          className="min-w-0 flex-1 text-left"
        >
          <h2 className="text-[16px] font-bold capitalize text-ink">
            {job.title}
          </h2>

          <p className="mt-1 text-[13px] text-muted">
            {job.company} · {job.location}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onToggleBookmark(job)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark opportunity"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            bookmarked
              ? "bg-lime text-ink"
              : "bg-gray-bg text-muted hover:text-ink"
          }`}
        >
          <Bookmark
            size={16}
            fill={bookmarked ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className="mt-4 text-xs text-muted">{job.posted}</p>

      <div className="mt-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isEligible
              ? "bg-lime/20 text-lime-ink"
              : "bg-gray-bg text-muted"
          }`}
        >
          {job.type}
        </span>
      </div>

      <button
        type="button"
        onClick={handleViewDetails}
        className={`mt-5 w-full rounded-[10px] px-4 py-2.5 text-sm font-bold transition ${
          isEligible
            ? "bg-ink text-white hover:opacity-90"
            : "bg-gray-bg text-muted hover:bg-gray-bg"
        }`}
      >
        View details
      </button>
    </div>
  );
}

