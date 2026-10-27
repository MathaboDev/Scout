import { useEffect, useState } from "react";
import JobCard from "../components/JobCard.jsx";
import AppShell from "../components/AppShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Eligible() {
  const { user } = useAuth();

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.full_name ||
    user?.fullName ||
    "";

  const [showAll, setShowAll] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [fieldFilter, setFieldFilter] = useState("All fields");
  const [jobTypeFilter, setJobTypeFilter] = useState("All types");

  // Load saved bookmarks when the page opens.
  useEffect(() => {
    const savedBookmarks =
      JSON.parse(localStorage.getItem("bookmarkedJobs")) || [];

    setBookmarkedJobs(savedBookmarks);
  }, []);

  // Add or remove a job from the watchlist.
  const toggleBookmark = (job) => {
    setBookmarkedJobs((prev) => {
      const alreadyBookmarked = prev.some(
        (item) => item.title === job.title
      );

      const updatedBookmarks = alreadyBookmarked
        ? prev.filter((item) => item.title !== job.title)
        : [...prev, job];

      localStorage.setItem(
        "bookmarkedJobs",
        JSON.stringify(updatedBookmarks)
      );

      return updatedBookmarks;
    });
  };

  // Temporary opportunity data.
  // This can later be replaced with data from the backend.
  const jobs = [
    {
      id: 1,
      letter: "B",
      title: "Junior product manager",
      company: "BackMailed",
      location: "Johannesburg, hybrid",
      posted: "Posted 5 days ago",
      type: "Full-time",
      fieldOfStudy: "Business",
      closingDate: "2026-10-25",
      eligible: true,
    },
    {
      id: 2,
      letter: "B",
      title: "Software developer intern",
      company: "ByteWorks",
      location: "Remote, South Africa",
      posted: "Posted 3 days ago",
      type: "Internship",
      fieldOfStudy: "ICT",
      closingDate: "2026-11-21",
      eligible: true,
    },
    {
      id: 3,
      letter: "G",
      title: "Data analyst intern",
      company: "Goodwall",
      location: "On-site, South Africa",
      posted: "Posted 5 days ago",
      type: "Internship",
      fieldOfStudy: "Data Science",
      closingDate: "2026-11-05",
      eligible: true,
    },
    {
      id: 4,
      letter: "K",
      title: "Junior sales consultant",
      company: "KaapStadTrails Pty",
      location: "On-site",
      posted: "Posted 1 week ago",
      type: "Part-time",
      fieldOfStudy: "Business",
      closingDate: "2026-11-12",
      eligible: true,
    },
    {
      id: 5,
      letter: "M",
      title: "Senior UX designer",
      company: "Meridian Studio",
      location: "Cape Town",
      posted: "Posted 2 days ago",
      type: "Full-time",
      fieldOfStudy: "Design",
      closingDate: "2026-10-18",
      eligible: false,
    },
    {
      id: 6,
      letter: "N",
      title: "Graduate finance analyst",
      company: "NovaBank",
      location: "Johannesburg",
      posted: "Posted 4 days ago",
      type: "Full-time",
      fieldOfStudy: "Finance",
      closingDate: "2026-09-21",
      eligible: false,
    },
  ];

  // Check whether an opportunity has passed its closing date.
  const isExpired = (job) => {
    return new Date(job.closingDate) < new Date();
  };

  // Format closing dates for display.
  const formatClosingDate = (date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter opportunities using the selected options.
  const filteredJobs = jobs
    // Eligible view only shows opportunities the student qualifies for.
    .filter((job) => showAll || job.eligible)

    // Hide expired opportunities unless View All is selected.
    .filter((job) => showAll || !isExpired(job))

    // Search by job title or company.
    .filter((job) => {
      const search = searchTerm.toLowerCase().trim();

      if (!search) return true;

      return (
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search)
      );
    })

    // Location filter.
    .filter((job) => {
      if (locationFilter === "All locations") return true;

      return job.location
        .toLowerCase()
        .includes(locationFilter.toLowerCase());
    })

    // Field of study filter.
    .filter((job) => {
      if (fieldFilter === "All fields") return true;

      return job.fieldOfStudy === fieldFilter;
    })

    // Opportunity type filter.
    .filter((job) => {
      if (jobTypeFilter === "All types") return true;

      return job.type === jobTypeFilter;
    });

  // Reset all filters.
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("All locations");
    setFieldFilter("All fields");
    setJobTypeFilter("All types");
  };

  return (
    <AppShell
      title={`Hi ${fullName || "there"}`}
      subtitle="Opportunities matched to your profile. Expired listings are hidden automatically."
    >
      {/* Opportunity views */}
      <div className="mt-7 flex gap-6 border-b border-line">
        <button
          type="button"
          className={`pb-3 text-sm font-bold ${
            !showAll
              ? "border-b-2 border-ink text-ink"
              : "text-muted hover:text-ink"
          }`}
          onClick={() => setShowAll(false)}
        >
          Eligible opportunities
        </button>

        <button
          type="button"
          className={`pb-3 text-sm font-bold ${
            showAll
              ? "border-b-2 border-ink text-ink"
              : "text-muted hover:text-ink"
          }`}
          onClick={() => setShowAll(true)}
        >
          View all opportunities
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex min-w-[240px] flex-1 items-center rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-3">
          <input
            type="text"
            placeholder="Search jobs or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-[#A6A59D]"
          />
        </div>

        {/* Location */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-line bg-white px-3 py-3 text-sm text-ink outline-none"
        >
          <option>All locations</option>
          <option>Johannesburg</option>
          <option>Cape Town</option>
          <option>Remote</option>
          <option>On-site</option>
        </select>

        {/* Field of study */}
        <select
          value={fieldFilter}
          onChange={(e) => setFieldFilter(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-line bg-white px-3 py-3 text-sm text-ink outline-none"
        >
          <option>All fields</option>
          <option>ICT</option>
          <option>Data Science</option>
          <option>Business</option>
          <option>Finance</option>
          <option>Design</option>
        </select>

        {/* Opportunity type */}
        <select
          value={jobTypeFilter}
          onChange={(e) => setJobTypeFilter(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-line bg-white px-3 py-3 text-sm text-ink outline-none"
        >
          <option>All types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Internship</option>
        </select>

        {/* Clear filters */}
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-[10px] px-3 py-2 text-sm font-bold text-muted hover:text-ink"
        >
          Clear
        </button>
      </div>

      {/* Results count */}
      <p className="mt-5 text-xs font-semibold text-muted">
        {filteredJobs.length}{" "}
        {filteredJobs.length === 1 ? "opportunity" : "opportunities"} found
      </p>

      {/* Opportunity cards */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const expired = isExpired(job);

            return (
              <div key={job.id}>
                <JobCard
                  job={job}
                  bookmarked={bookmarkedJobs.some(
                    (item) => item.title === job.title
                  )}
                  onToggleBookmark={toggleBookmark}
                />

                {/* Expired listing warning */}
                {expired && (
                  <div className="mt-2 rounded-[10px] border border-line bg-gray-bg px-3 py-2 text-xs font-semibold text-muted">
                    This opportunity closed on{" "}
                    {formatClosingDate(job.closingDate)} and is no longer
                    accepting applications.
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-line bg-white px-6 py-12 text-center">
            <div className="text-2xl">⌕</div>

            <h2 className="mt-3 text-lg font-bold">
              No opportunities found
            </h2>

            <p className="mt-1 text-sm text-muted">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-[10px] bg-ink px-4 py-2.5 text-sm font-bold text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}