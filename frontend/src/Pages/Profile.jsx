import React, { useState } from "react";
import "./Profile.css";

function Profile() {
  const [academic, setAcademic] = useState({
    institution: "",
    qualification: "",
    fieldOfStudy: "",
    currentYear: "",
  });

  const handleChange = (field) => (e) => {
    setAcademic((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="profile-page">

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="scout-logo">S</div>
          <div className="scout-name">Scout</div>

          <nav className="sidebar-nav">
            <button className="nav-item active">Profile</button>
            <button className="nav-item">Eligible jobs</button>
            <button className="nav-item">Watchlist</button>
            <button className="nav-item">Settings</button>
          </nav>
        </div>

        <div className="sidebar-user">
          <div className="user-circle">TM</div>

          <div>
            <div className="user-name">Tumelo M.</div>
            <div className="view-profile">View profile</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="profile-content">

        <h1>Profile</h1>

        <p className="profile-description">
          This information is reused across every application you send.
        </p>

        {/* User information */}
        <section className="profile-card user-card">

          <div className="user-info">
            <div className="large-user-circle">TM</div>

            <div>
              <h3>Tumelo Mahlangu</h3>
              <p>BSc Information Technology</p>
            </div>
          </div>

          <div className="completion">
            <div className="completion-text">
              Profile completion: 70%
            </div>

            <div className="progress-bar">
              <div className="progress"></div>
            </div>
          </div>

        </section>

        {/* Academic information */}
        <section className="profile-card">

          <h2>Academic information</h2>

          <div className="academic-grid">

            <div className="form-group">
              <label htmlFor="institution">
                Institution
              </label>

              <input
                id="institution"
                type="text"
                placeholder="Enter institution name"
                value={academic.institution}
                onChange={handleChange("institution")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="qualification">
                Qualification
              </label>

              <input
                id="qualification"
                type="text"
                placeholder="e.g. BSc in Computer Science"
                value={academic.qualification}
                onChange={handleChange("qualification")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fieldOfStudy">
                Field of study
              </label>

              <input
                id="fieldOfStudy"
                type="text"
                placeholder="Enter field of study"
                value={academic.fieldOfStudy}
                onChange={handleChange("fieldOfStudy")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentYear">
                Current year
              </label>

              <input
                id="currentYear"
                type="text"
                placeholder="e.g. Final year"
                value={academic.currentYear}
                onChange={handleChange("currentYear")}
              />
            </div>

          </div>

        </section>

        {/* Documents */}
        <section className="profile-card">

          <h2>Documents</h2>

          <div className="document-row">
            <span>CV</span>
            <span className="status success">
              Uploaded
            </span>
          </div>

          <div className="document-row">
            <span>Academic transcript</span>
            <span className="status error">
              Upload failed — retry
            </span>
          </div>

          <div className="document-row">
            <span>ID document</span>
            <span className="status warning">
              Not uploaded
            </span>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Profile;