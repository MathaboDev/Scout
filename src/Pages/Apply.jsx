import React from "react";
import { useNavigate } from "react-router-dom";
import "./Apply.css";

function Apply() {
  const navigate = useNavigate();

  return (
    <div className="apply-page">

      {/* Sidebar */}
      <aside className="apply-sidebar">

        <div>
          <div className="scout-logo">S</div>
          <div className="scout-name">Scout</div>

          <nav className="apply-sidebar-nav">

            <button
              className="apply-nav-item"
              onClick={() => navigate("/profile")}
            >
              ♙ Profile
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/eligible")}
            >
              ♧ Eligible jobs
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/watchlist")}
            >
              ♧ Watchlist
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/settings")}
            >
              ⚙ Settings
            </button>

          </nav>
        </div>

        <div className="apply-sidebar-user">

          <div className="apply-user-circle">
            TM
          </div>

          <div>
            <div className="apply-user-name">
              Tumelo M.
            </div>

            <div className="apply-view-profile">
              View profile
            </div>
          </div>

        </div>

      </aside>


      {/* Main content */}
      <main className="apply-content">

        <button
          className="back-button"
          onClick={() => navigate("/eligible")}
        >
          ← Back to eligible jobs
        </button>


        {/* Header */}
        <div className="apply-header">

          <p className="apply-label">
            APPLICATION
          </p>

          <h1>
            Review before you apply
          </h1>

          <p className="apply-description">
            Make sure your information is correct before submitting
            your application.
          </p>

        </div>


        {/* Missing document warning */}
        <div className="missing-document-warning">

          <div className="warning-message">

            <span className="warning-icon">
              ⚠
            </span>

            <span>
              Academic transcript is missing from your profile —
              required for this application.
            </span>

          </div>

          <button
            className="upload-now-button"
            onClick={() => navigate("/profile")}
          >
            Upload now
          </button>

        </div>


        {/* Job information */}
        <section className="apply-card">

          <div className="apply-company-letter">
            B
          </div>

          <div className="apply-job-info">

            <h2>
              Junior product manager
            </h2>

            <p>
              BackMailed · Johannesburg, hybrid
            </p>

            <span className="apply-job-type">
              Full-time
            </span>

          </div>

        </section>


        {/* Profile information */}
        <section className="apply-card">

          <div className="section-heading">

            <div>
              <h2>
                Your profile
              </h2>

              <p>
                This information will be included in your application.
              </p>
            </div>

            <button
              className="edit-button"
              onClick={() => navigate("/profile")}
            >
              Edit profile
            </button>

          </div>


          <div className="profile-review-grid">

            <div className="review-item">
              <span className="review-label">
                Name
              </span>

              <strong>
                Tumelo Mahlangu
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Email
              </span>

              <strong>
                tumelo@gmail.com
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Qualification
              </span>

              <strong>
                BSc Information Technology
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Institution
              </span>

              <strong>
                CPUT
              </strong>
            </div>

          </div>

        </section>


        {/* Documents */}
        <section className="apply-card">

          <div className="section-heading">

            <div>
              <h2>
                Documents
              </h2>

              <p>
                These documents will be sent with your application.
              </p>
            </div>

          </div>


          {/* CV */}
          <div className="document-review">

            <div className="document-icon">
              CV
            </div>

            <div className="document-info">

              <strong>
                CV.pdf
              </strong>

              <span>
                Uploaded
              </span>

            </div>

            <span className="document-check">
              ✓
            </span>

          </div>


          {/* Academic transcript */}
          <div className="document-review">

            <div className="document-icon">
              AT
            </div>

            <div className="document-info">

              <strong>
                Academic transcript.pdf
              </strong>

              <span>
                Missing
              </span>

            </div>

            <span className="document-check">
              !
            </span>

          </div>

        </section>


        {/* Submit buttons */}
        <div className="submit-area">

          <button
            className="edit-application-button"
            onClick={() => navigate("/eligible")}
          >
            Edit application
          </button>


          <button
            className="submit-application"
            onClick={() => alert("Application submitted!")}
          >
            ✓ Confirm and submit
          </button>

        </div>

      </main>

    </div>
  );
}

export default Apply;