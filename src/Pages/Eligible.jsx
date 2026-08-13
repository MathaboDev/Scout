import React, {useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Eligible.css";

function Eligible() {
const navigate = useNavigate();
const [showAll, setShowAll] = useState(false);
const [ bookmarkedJobs, setBookmarkedJobs] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [locationFilter, setLocationFilter] = useState("All locations");
const [jobTypeFilter, setJobTypeFilter] = useState("All types");

const [user, setUser] = useState({
  fullName: "",
});

useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (savedUser) {
    setUser(savedUser);
  }
}, []);


useEffect(() => {
  const savedBookmarks =
    JSON.parse(localStorage.getItem("bookmarkedJobs")) || [];

  setBookmarkedJobs(savedBookmarks);
  }, []);

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

  const jobs = [
    {
      letter: "B",
      title: "Junior product manager",
      company: "BackMailed",
      location: "Johannesburg, hybrid",
      posted: "Posted 5 days ago",
      type: "Full-time",
      eligible: true,
    },
    {
      letter: "A",
      title: "Software developer intern",
      company: "ByteWorks",
      location: "Remote, South Africa",
      posted: "Posted 3 days ago",
      type: "Internship",
      eligible: true,
    },
    {
      letter: "A",
      title: "Data analyst intern",
      company: "Goodwall",
      location: "On-site, South Africa",
      posted: "Posted 5 days ago",
      type: "Internship",
      eligible: true,
    },
    {
      letter: "A",
      title: "Junior sales consultant",
      company: "KaapStadTrails Pty",
      location: "On-site",
      posted: "Posted 1 week ago",
      type: "Part-time",
      eligible: true,
    },
    {
      letter: "M",
      title: "Senior UX designer",
      company: "Meridian Studio",
      location: "Cape Town",
      posted: "Posted 2 days ago",
      type: "Not eligible · requires degree",
      eligible: false,
    },
    {
      letter: "N",
      title: "Graduate finance analyst",
      company: "NovaBank",
      location: "Johannesburg",
      posted: "Posted 4 days ago",
      type: "Not eligible · closed to your field",
      eligible: false,
    },
  ];
//filter jobs
 const filteredJobs = jobs
    .filter((job) => showAll || job.eligible)
    .filter((job) => {
      const search = searchTerm.toLowerCase();

      return (
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search)
      );
    })
    .filter((job) => {
      if (locationFilter === "All locations") {
        return true;
      }

      return job.location
        .toLowerCase()
        .includes(locationFilter.toLowerCase());
    })
    .filter((job) => {
      if (jobTypeFilter === "All types") {
        return true;
      }

      return job.type
        .toLowerCase()
        .includes(jobTypeFilter.toLowerCase());
    });

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("All locations");
    setJobTypeFilter("All types");
  };

  return (
    <div className="eligible-page">

      {/* Sidebar */}
      <aside className="eligible-sidebar">

        <div>
          <div className="scout-logo">S</div>
          <div className="scout-name">Scout</div>

          <nav className="eligible-sidebar-nav">

            <button className="eligible-nav-item" onClick={() => navigate("/profile")}>
               Profile
            </button>

            <button className="eligible-nav-item active" onClick={() => navigate("/eligible")}>
               Eligible jobs
            </button>

            <button className="eligible-nav-item" onClick={() => navigate("/watchlist")}>
               Watchlist
            </button>

            <button className="eligible-nav-item"onClick={() => navigate("/settings")}>
               Settings
            </button>

          </nav>
        </div>

        <div className="eligible-sidebar-user">
          <div className="eligible-user-circle"> 
            {user.fullName
                 ? user.fullName
                       .split(" ")
                      .map((name) => name[0])
                      .join("")
                     .toUpperCase()
              : "YN"}
    </div>

          <div>
            <div className="eligible-user-name">
             {user.fullName || "Your Name"}
            </div>

            <div className="eligible-view-profile" onClick={() => navigate("/profile")}>
              View profile
            </div>
          </div>
        </div>
      </aside>


      {/* Main content */}
      <main className="eligible-content">

        <h1>
          Hi {user.fullName || "there"}
        </h1>

        <p className="eligible-description">
          Opportunities matched to your profile — expired listings
          are hidden automatically.
        </p>


        {/* Opportunity filters */}
        <div className="opportunity-tabs">

          <button
           className={`opportunity-tab ${!showAll ? "active" : ""}`}
          onClick={() => setShowAll(false)}
          >
            Eligible opportunities
          </button>

          <button className={`opportunity-tab ${showAll ? "active" : ""}`}
          onClick={() => setShowAll(true)}
          >
            View all opportunities
          </button>

        </div>
          

        {/* Search and filters */}
        <div className="job-filters">

          {/* Search */}
          <div className="search-box">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

          </div>

          {/* Location */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-select"
          >
            <option>All locations</option>
            <option>Johannesburg</option>
            <option>Cape Town</option>
            <option>Remote</option>
            <option>On-site</option>
          </select>

          {/* Job type */}
          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option>All types</option>
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
          </select>

          {/* Clear */}
          <button
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear
          </button>

        </div>

        {/* Results count */}
        <div className="results-count">
          {filteredJobs.length}{" "}
          {filteredJobs.length === 1 ? "opportunity" : "opportunities"} found
        </div>



        {/* Job cards */}
        <div className="jobs-grid">

{filteredJobs.length > 0 ? (

    filteredJobs.map((job, index) => (

      <div
        className={`job-card ${
          !job.eligible ? "job-card-disabled" : ""
        }`}
        key={index}
      >

        <div className="job-header">

          <div className="company-letter">
            {job.letter}
          </div>

          <div className="job-title-section">

            <h2>{job.title}</h2>

            <p>
              {job.company} · {job.location}
            </p>

          </div>

          <button
            className={`bookmark-button ${
              bookmarkedJobs.some(
                (item) => item.title === job.title
              )
                ? "bookmarked"
                : ""
            }`}
            onClick={() => toggleBookmark(job)}
          >
            {bookmarkedJobs.some(
              (item) => item.title === job.title
            )
              ? "✅"
              : "🔖"}
          </button>

        </div>

        <p className="job-posted">
          {job.posted}
        </p>

        <span
          className={`job-type ${
            !job.eligible ? "not-eligible" : ""
          }`}
        >
          {job.type}
        </span>

        <button
          className={`apply-button ${
            !job.eligible ? "apply-disabled" : ""
          }`}
          disabled={!job.eligible}
          onClick={() =>
            navigate("/apply", { state: { job } })
          }
        >
          Apply
        </button>

      </div>

    ))

  ) : (

    <div className="no-results">

      <div className="no-results-icon">
        🔍
      </div>

      <h2>No opportunities found</h2>

      <p>
        Try changing your search or filters.
      </p>

      <button
        className="clear-filters-button"
        onClick={clearFilters}
      >
        Clear filters
      </button>

    </div>

  )}
       
        </div>

      </main>

    </div>
  );
}

export default Eligible;