import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import "./Eligible.css";

function Eligible() {
const navigate = useNavigate();
const [showAll, setShowAll] = useState(false);

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

  return (
    <div className="eligible-page">

      {/* Sidebar */}
      <aside className="eligible-sidebar">

        <div>
          <div className="scout-logo">S</div>
          <div className="scout-name">Scout</div>

          <nav className="eligible-sidebar-nav">

            <button className="eligible-nav-item" onClick={() => navigate("/profile")}>
              ♙ Profile
            </button>

            <button className="eligible-nav-item active" onClick={() => navigate("/eligible")}>
              ♧ Eligible jobs
            </button>

            <button className="eligible-nav-item" onClick={() => navigate("/watchlist")}>
              ♧ Watchlist
            </button>

            <button className="eligible-nav-item"onClick={() => navigate("/settings")}>
              ⚙ Settings
            </button>

          </nav>
        </div>

        <div className="eligible-sidebar-user">
          <div className="eligible-user-circle">TM</div>

          <div>
            <div className="eligible-user-name">
              Tumelo M.
            </div>

            <div className="eligible-view-profile">
              View profile
            </div>
          </div>
        </div>
      </aside>


      {/* Main content */}
      <main className="eligible-content">

        <h1>
          Hi Tumelo 👋
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


        {/* Job cards */}
        <div className="jobs-grid">

         {jobs
            .filter((job) => showAll || job.eligible)
            .map((job, index) => (

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

                <button className="bookmark-button">
                  ♧
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
                onClick={() => navigate("/apply")}
              >
                Apply
              </button>

            </div>

          ))}

        </div>

      </main>

    </div>
  );
}

export default Eligible;