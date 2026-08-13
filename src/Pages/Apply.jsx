import React, {useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Apply.css";

function Apply() {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job;

  const [user, setUser] = useState({
  fullName: "",
  email: "",
});

const [academic, setAcademic] = useState({
  institution: "",
  qualification: "",
  fieldOfStudy: "",
  currentYear: "",
});

const [documents, setDocuments] = useState({
  cv: null,
  transcript: null,
  idDocument: null,
});

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (savedUser) {
    setUser(savedUser);
  }
}, []);

useEffect(() => {
  const savedAcademic = JSON.parse(
    localStorage.getItem("academicInfo")
  );

  if (savedAcademic) {
    setAcademic(savedAcademic);
  }
}, []);

useEffect(() => {
  const savedDocuments = JSON.parse(
    localStorage.getItem("documents")
  );

  if (savedDocuments) {
    setDocuments(savedDocuments);
  }
}, []);

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
               Profile
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/eligible")}
            >
               Eligible jobs
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/watchlist")}
            >
               Watchlist
            </button>

            <button
              className="apply-nav-item"
              onClick={() => navigate("/settings")}
            >
            Settings
            </button>

          </nav>
        </div>

        <div className="apply-sidebar-user">

          <div className="apply-user-circle">
              {user.fullName
                 ? user.fullName
                   .split(" ")
                    .map((name) => name[0])
                    .join("")
                   .toUpperCase()
                : "YN"}

          </div>

          <div>
            <div className="apply-user-name">
                {user.fullName || "Your Name"}
            </div>

            <div className="apply-view-profile" onClick={() => navigate("/profile")}>
              View profile
            </div>
          </div>

        </div>

      </aside>


      {/* Main content */}
      <main className="apply-content">

        {submitted ? (
  <div className="application-success">
    <div className="success-icon">✓</div>

    <h1>Application submitted!</h1>

    <p>
      Your application for{" "}
      <strong>{job?.title || "this position"}</strong>{" "}
      has been successfully submitted.
    </p>

    <p className="success-reference">
      We'll keep you updated on the status of your application.
    </p>

    <button
      className="back-to-watchlist-button"
      onClick={() => navigate("/watchlist")}
    >
      Back to Watchlist
    </button>
  </div>
) : (
      <>
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
        {!documents.transcript && (
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
        )}

        {/* Job information */}
        <section className="apply-card">

          <div className="apply-company-letter">
           {job?.letter|| "B" }
          </div>

          <div className="apply-job-info">

            <h1>{job?.title || "Job application"}</h1>

              <p>
              {job?.company || "Company"} · {job?.location || "Location"}
              </p>

            <span className="apply-job-type">
              {job?.type || "Full-time"}
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
                {user.fullName || "Your Name"}
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Email
              </span>

              <strong>
              {user.email || "your@email.com"}
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Qualification
              </span>

              <strong>
               {academic.qualification || "Qualification not added"}
              </strong>
            </div>


            <div className="review-item">
              <span className="review-label">
                Institution
              </span>

              <strong>
             {academic.institution ||  "Institution not added"}
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
             {documents.cv || "CV"}
              </strong>

              <span>
               {documents.cv ? "Uploaded" : "Missing"}
              </span>

            </div>

            <span className="document-check">
              {document.cv ? "✓" : "!"}
            </span>

          </div>


          {/* Academic transcript */}
          <div className="document-review">

            <div className="document-icon">
              AT
            </div>

            <div className="document-info">

              <strong>
                {documents.transcript || "Academic transcript"}
              </strong>

              <span>
              {documents.transcript ? "Uploaded" : "Missing"}
              </span>

            </div>

            <span className="document-check">
               {documents.transcript ? "✓" : "!"}
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
            onClick={() => {

               if (!documents.transcript) {
              alert("Please upload your academic transcript before applying.");
                return;
                  }
                    const savedApplications =
                       JSON.parse(localStorage.getItem("appliedJobs")) || [];

                    const alreadyApplied = savedApplications.some(
                        (item) => item.title === job?.title
                   );

                  if (!alreadyApplied && job) {
                    const application ={
                      ...job,
                      date: "Applied today",
                      status: "Submitted",
                      statusClass: "submitted",
                    };

                        localStorage.setItem(
                        "appliedJobs",
                        JSON.stringify([...savedApplications, application])
                 );
              }
                   setSubmitted(true);
}}
          >
            ✓ Confirm and submit
          </button>


        </div>
</>
    )}
    
</main>

    </div>
  );
}

export default Apply;