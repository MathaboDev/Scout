import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Watchlist.css";

function Watchlist() {
  const navigate = useNavigate();

const [showAllBookmarks, setShowAllBookmarks] = useState(false);
const [showAllApplied, setShowAllApplied] = useState(false); 
const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
const [savedApplications, setSavedApplications] = useState([]);

const removeBookmark = (jobTitle) => {
  const updatedBookmarks = bookmarkedJobs.filter(
    (job) => job.title !== jobTitle
  );

  setBookmarkedJobs(updatedBookmarks);

  localStorage.setItem(
    "bookmarkedJobs",
    JSON.stringify(updatedBookmarks)
  );
};

const [user, setUser] = useState({
  fullName: "",
});

    useEffect(() => {
  const savedBookmarks =
    JSON.parse(localStorage.getItem("bookmarkedJobs")) || [];

  const combinedJobs = [
    ...defaultBookmarkedJobs,
    ...savedBookmarks.filter(
      (savedJob) =>
        !defaultBookmarkedJobs.some(
          (defaultJob) => defaultJob.title === savedJob.title
        )
    ),
  ];

  setBookmarkedJobs(combinedJobs);
}, []);

useEffect(() => {
    const saved =
    JSON.parse(localStorage.getItem("appliedJobs")) || [];
    setSavedApplications(saved);
}, []);

useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (savedUser) {
    setUser(savedUser);
  }
}, []);

  const appliedJobs = [
    {
      letter: "B",
      title: "Junior product engineer",
      company: "BackMailed",
      location: "Johannesburg",
      date: "Applied 10 May 2026 · Ref #SC-10234",
      status: "Under review",
      statusClass: "under-review",
    },
    {
      letter: "abc",
      title: "Data analyst",
      company: "ABC Tech",
      location: "Cape Town",
      date: "Applied 08 May 2026 · Ref #SC-10198",
      status: "Outcome received",
      statusClass: "outcome",
    },
    {
      letter: "N",
      title: "Marketing intern",
      company: "NetWave",
      location: "Cape Town",
      date: "Applied 02 May 2026 · Ref #SC-10142",
      status: "Submitted",
      statusClass: "submitted",
    },
  ];

const defaultBookmarkedJobs = [
  {
    letter: "A",
    title: "Junior software developer",
    company: "ByteWorks",
    location: "Hybrid",
    type: "Full-time",
    closing: "Closes in 6 days — reminder sent",
    urgent: true,
  },
  {
    letter: "D",
    title: "Design intern",
    company: "Creative Labs",
    location: "Durban",
    type: "Internship",
    closing: "Closes 30 May",
    urgent: false,
  },
  {
    letter: "O",
    title: "UX researcher intern",
    company: "Insight Co.",
    location: "Remote",
    type: "Internship",
    closing: "Closes 30 May",
    urgent: false,
  },
];



  return (
    <div className="watchlist-page">

      {/* Sidebar */}
      <aside className="watchlist-sidebar">

        <div>
          <div className="scout-logo">S</div>
          <div className="scout-name">Scout</div>

          <nav className="watchlist-sidebar-nav">

            <button
              className="watchlist-nav-item"
              onClick={() => navigate("/profile")}
            >
               Profile
            </button>

            <button
              className="watchlist-nav-item"
              onClick={() => navigate("/eligible")}
            >
               Eligible jobs
            </button>

            <button
              className="watchlist-nav-item active"
              onClick={() => navigate("/watchlist")}
            >
               Watchlist
            </button>

            <button
              className="watchlist-nav-item"
              onClick={() => navigate("/settings")}
            >
               Settings
            </button>

          </nav>
        </div>

        {/* User */}
        <div className="watchlist-sidebar-user">

          <div className="watchlist-user-circle">
                {user.fullName
                    ? user.fullName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                       .toUpperCase()
                    : "YN"}
          </div>

          <div>
            <div className="watchlist-user-name">
               {user.fullName || "Your Name"}
            </div>

            <div className="watchlist-view-profile" onClick={() => navigate("/profile")}>
              View profile
            </div>
          </div>

        </div>

      </aside>


      {/* Main content */}
      <main className="watchlist-content">

        <h1>Watchlist</h1>

        <p className="watchlist-description">
          Your bookmarked job opportunities in one place.
        </p>


        {/* Applied jobs */}
        <section>

          <div className="watchlist-section-heading">
            <h2>Applied jobs</h2>

            <button className="view-all-button"
           onClick={() => setShowAllApplied(!showAllApplied)}
            >
             {showAllApplied ? "Show less" : "View all"}
            </button>
          </div>


          <div className="applied-jobs-grid">

            {(showAllApplied
            ? savedApplications
            : savedApplications.slice(0, 3)
                ).map((job, index) => (

              <div className="applied-job-card" key={index}>

                <div className="job-card-top">

                  <div className="watchlist-company-letter">
                    {job.letter}
                  </div>

                  <div>
                    <h3>{job.title}</h3>

                    <p>
                      {job.company} · {job.location}
                    </p>
                  </div>

                </div>

                <p className="application-date">
                  {job.date}
                </p>

                <span
                  className={`application-status ${job.statusClass}`}
                >
                  {job.status}
                </span>

              </div>

            ))}

          </div>

        </section>


        {/* Bookmarked opportunities */}
        <section className="bookmarked-section">

          <div className="watchlist-section-heading">
            <h2>Bookmarked opportunities</h2>

            <button className="view-all-button" 
            onClick={() => setShowAllBookmarks(!showAllBookmarks)}>
               {showAllBookmarks ? "Show less" : "View all"}
            </button>
          </div>


          <div className="bookmarked-jobs-grid">

             {(showAllBookmarks
            ? bookmarkedJobs
            : bookmarkedJobs.slice(0, 3)
              ).map((job, index) => (

              <div className="bookmarked-job-card" key={index}>

                <div className="job-card-top">

                  <div className="watchlist-company-letter">
                    {job.letter}
                  </div>

                  <div>
                    <h3>{job.title}</h3>

                    <p>
                      {job.company} · {job.location}
                    </p>
                  </div>

                </div>

                <span className="job-type-badge">
                  {job.type}
                </span>

                <p
                  className={
                    job.urgent
                      ? "closing-date urgent"
                      : "closing-date"
                  }
                >
                  {job.closing}
                </p>


              <button
                     className="watchlist-apply-button"
                 onClick={() => navigate("/apply", { state: { job }})}
                  >
                  Apply
                  </button>

                <button
                      className="watchlist-remove-button"
                onClick={() => removeBookmark(job.title)}
                    >
                  Remove bookmark
                  </button>
              </div>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Watchlist;

