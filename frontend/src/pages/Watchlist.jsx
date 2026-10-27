import { useEffect, useState } from "react";
import { Bookmark, CheckCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar.jsx";

export default function Watchlist() {
  const navigate = useNavigate();

  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const [showAllApplied, setShowAllApplied] = useState(false);

  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [savedApplications, setSavedApplications] = useState([]);

  const [user, setUser] = useState({
    fullName: "",
  });

  /*
   * Load user, bookmarks and applications
   */
  useEffect(() => {
    const savedUser =
      JSON.parse(localStorage.getItem("user")) || {};

    const savedBookmarks =
      JSON.parse(localStorage.getItem("bookmarkedJobs")) || [];

    const savedApplications =
      JSON.parse(localStorage.getItem("applications")) || [];

    setUser(savedUser);
    setBookmarkedJobs(savedBookmarks);
    setSavedApplications(savedApplications);
  }, []);

  /*
   * Remove bookmark
   */
  const removeBookmark = (jobId) => {
    const updatedBookmarks = bookmarkedJobs.filter(
      (job) => job.id !== jobId
    );

    setBookmarkedJobs(updatedBookmarks);

    localStorage.setItem(
      "bookmarkedJobs",
      JSON.stringify(updatedBookmarks)
    );
  };

  /*
   * Check if opportunity is expired
   */
  const isExpired = (job) => {
    if (!job.closingDate) return false;

    return new Date(job.closingDate) < new Date();
  };

  /*
   * Format closing date
   */
  const formatClosingDate = (date) => {
    if (!date) return "Closing date unavailable";

    const closingDate = new Date(date);
    const today = new Date();

    const difference =
      closingDate.getTime() - today.getTime();

    const daysLeft = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return `Closed ${closingDate.toLocaleDateString(
        "en-ZA",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )}`;
    }

    if (daysLeft === 0) {
      return "Closes today";
    }

    if (daysLeft <= 7) {
      return `Closes in ${daysLeft} day${
        daysLeft === 1 ? "" : "s"
      }`;
    }

    return `Closes ${closingDate.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )}`;
  };

  /*
   * Format application date
   */
  const formatApplicationDate = (date) => {
    if (!date) return "Application submitted";

    return `Applied ${new Date(date).toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )}`;
  };

  /*
   * Status styling
   */
  const getStatusStyle = (status) => {
    if (status === "Accepted") {
      return "bg-lime/20 text-lime-ink";
    }

    if (status === "Rejected") {
      return "bg-gray-bg text-muted";
    }

    if (status === "Under review") {
      return "bg-lime/20 text-lime-ink";
    }

    return "bg-gray-bg text-muted";
  };

  return (
    <div className="flex min-h-screen bg-cream text-ink">

      {/* =================================
          SIDEBAR
      ================================= */}

      <Sidebar user={user} />


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="w-full max-w-[1100px] px-6 py-10 md:px-12">

        {/* Header */}

        <h1 className="text-[28px] font-bold">
          Watchlist
        </h1>

        <p className="mt-2 text-sm text-muted">
          Your bookmarked job opportunities in one
          place.
        </p>


        {/* =================================
            APPLIED JOBS
        ================================= */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-[17px] font-bold">
              Applied jobs
            </h2>

            {savedApplications.length > 3 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllApplied(
                    !showAllApplied
                  )
                }
                className="text-xs font-bold text-muted hover:text-ink"
              >
                {showAllApplied
                  ? "Show less"
                  : "View all"}
              </button>
            )}

          </div>


          {savedApplications.length === 0 ? (

            /* Empty applied state */

            <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-sm">

              <CheckCircle
                size={28}
                className="mx-auto text-muted"
              />

              <h3 className="mt-3 text-sm font-bold">
                No applications yet
              </h3>

              <p className="mt-1 text-xs text-muted">
                Applications you submit will appear
                here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/eligible")
                }
                className="mt-4 rounded-[10px] bg-ink px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                Browse opportunities
              </button>

            </div>

          ) : (

            /* Applied jobs */

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {(showAllApplied
                ? savedApplications
                : savedApplications.slice(0, 3)
              ).map((application) => (

                <div
                  key={application.id}
                  className="min-h-[160px] rounded-2xl border border-line bg-white p-[18px] shadow-sm"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-gray-bg text-xs font-bold">
                      {application.company
                        ? application.company[0].toUpperCase()
                        : "S"}
                    </div>

                    <div className="min-w-0">

                      <h3 className="text-[13px] font-bold">
                        {application.jobTitle}
                      </h3>

                      <p className="mt-1 text-[11px] leading-4 text-muted">
                        {application.company} ·{" "}
                        {application.location}
                      </p>

                    </div>

                  </div>


                  <p className="mt-[17px] text-[10px] text-muted">
                    {formatApplicationDate(
                      application.submittedAt
                    )}
                  </p>


                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                      application.status
                    )}`}
                  >
                    {application.status ||
                      "Submitted"}
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =================================
            BOOKMARKED OPPORTUNITIES
        ================================= */}

        <section className="mt-10">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-[17px] font-bold">
              Bookmarked opportunities
            </h2>

            {bookmarkedJobs.length > 3 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllBookmarks(
                    !showAllBookmarks
                  )
                }
                className="text-xs font-bold text-muted hover:text-ink"
              >
                {showAllBookmarks
                  ? "Show less"
                  : "View all"}
              </button>
            )}

          </div>


          {bookmarkedJobs.length === 0 ? (

            /* Empty bookmark state */

            <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-sm">

              <Bookmark
                size={28}
                className="mx-auto text-muted"
              />

              <h3 className="mt-3 text-sm font-bold">
                No bookmarked opportunities
              </h3>

              <p className="mt-1 text-xs text-muted">
                Bookmark opportunities you're
                interested in and they will appear
                here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/eligible")
                }
                className="mt-4 rounded-[10px] bg-ink px-4 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                Browse opportunities
              </button>

            </div>

          ) : (

            /* Bookmarked jobs */

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {(showAllBookmarks
                ? bookmarkedJobs
                : bookmarkedJobs.slice(0, 3)
              ).map((job) => {

                const expired = isExpired(job);

                return (
                  <div
                    key={job.id}
                    className={`rounded-2xl border border-line bg-white p-[18px] shadow-sm ${
                      expired
                        ? "opacity-65"
                        : ""
                    }`}
                  >

                    {/* Job heading */}

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-gray-bg text-xs font-bold">
                        {job.letter ||
                          job.company?.[0] ||
                          "S"}
                      </div>

                      <div className="min-w-0">

                        <h3 className="text-[13px] font-bold">
                          {job.title}
                        </h3>

                        <p className="mt-1 text-[11px] leading-4 text-muted">
                          {job.company} ·{" "}
                          {job.location}
                        </p>

                      </div>

                    </div>


                    {/* Job type */}

                    <span
                      className={`mt-[18px] inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        expired
                          ? "bg-gray-bg text-muted"
                          : "bg-lime/60 text-ink"
                      }`}
                    >
                      {job.type ||
                        "Opportunity"}
                    </span>


                    {/* Closing date */}

                    <p
                      className={`mt-[13px] text-[10px] ${
                        expired
                          ? "text-muted"
                          : "font-bold text-lime-ink"
                      }`}
                    >
                      {formatClosingDate(
                        job.closingDate
                      )}
                    </p>


                    {/* View details */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/jobs/${job.id}`,
                          {
                            state: {
                              job,
                            },
                          }
                        )
                      }
                      className="mt-4 w-full rounded-[10px] bg-ink px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
                    >
                      View details
                    </button>


                    {/* Remove bookmark */}

                    <button
                      type="button"
                      onClick={() =>
                        removeBookmark(job.id)
                      }
                      className="mt-2 flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-muted hover:text-ink"
                    >
                      <Trash2 size={13} />
                      Remove bookmark
                    </button>

                  </div>
                );
              })}

            </div>

          )}

        </section>

      </main>
    </div>
  );
}