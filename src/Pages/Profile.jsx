import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
const navigate = useNavigate();

const [user, setUser] = useState({
  fullName: "",
  email: "",
});


const [documents, setDocuments] = useState({
  cv: null,
  transcript: null,
  idDocument: null,
});

const [saved, setSaved] = useState(false);

useEffect(() => {
  const savedUser = JSON.parse(localStorage.getItem("user"));

  if (savedUser) {
    setUser(savedUser);
  }
}, []);

const [academic, setAcademic] = useState(() => {
  const savedAcademic = localStorage.getItem("academicInfo");

  return savedAcademic
    ? JSON.parse(savedAcademic)
    : {
          institution: "",
          qualification: "",
          fieldOfStudy: "",
          currentYear: "",
    };
});



useEffect(() => {
  const savedDocuments = JSON.parse(
    localStorage.getItem("documents")
  );

  if (savedDocuments) {
    setDocuments(savedDocuments);
  }
}, []);

       useEffect(() => {
              localStorage.setItem("academicInfo", JSON.stringify(academic));
          }, [academic]);



const handleChange = (field) => (e) => {
setAcademic((prev) => ({
...prev,
[field]: e.target.value,
}));
};

const handleDocumentUpload = (documentType) => (e) => {
  const file = e.target.files[0];

  if (file) {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file.name,
    }));
  }
};

const handleDocumentRemove = (documentType) => {
  setDocuments((prev) => ({
    ...prev,
    [documentType]: null,
  }));
};

const handleSaveProfile = () => {
  localStorage.setItem("academicInfo", JSON.stringify(academic));
  localStorage.setItem("documents", JSON.stringify(documents));

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 3000);
};

const completionItems = [
  user.fullName,
  user.email,
  academic.institution,
  academic.qualification,
  academic.fieldOfStudy,
  academic.currentYear,
  documents.cv,
  documents.transcript,
  documents.idDocument,
];

const completionPercentage = Math.round(
  (completionItems.filter(Boolean).length / completionItems.length) * 100
);

return (
<div className="profile-page">

  {/* Sidebar */}
  <aside className="sidebar">
    <div>
      <div className="scout-logo">S</div>
      <div className="scout-name">Scout</div>

      <nav className="sidebar-nav">
        <button className="nav-item active" onClick={() => navigate("/profile")}>
          Profile</button>
        <button className="nav-item" onClick={() => navigate("/eligible")}>
          Eligible jobs</button>
        <button className="nav-item" onClick={() => navigate("/watchlist")}>
          Watchlist</button>
        <button className="nav-item" onClick={() => navigate("/settings")}>
          Settings</button>
      </nav>
    </div>

    <div className="sidebar-user">
      <div className="user-circle">
        {user.fullName
              ? user.fullName
                  .split(" ")
                  .map((name) => name[0])
                   .join("")
                   .toUpperCase()
    : "YN"}
  </div>

      <div>
        <div className="user-name">{user.fullName || "Your Name"}</div>
        <div className="view-profile" onClick={() => navigate("/profile")}>View profile</div>
      </div>
    </div>
  </aside>

 { /* Main content */}
  <main className="profile-content">

    <h1>Profile</h1>

    <p className="profile-description">
      This information is reused across every application you send.
    </p>

    {/* User information */}
    <section className="profile-card user-card">

      <div className="user-info">
        <div className="large-user-circle">
          {user.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : "YN"}</div>

        <div>
          <h3>{user.fullName || "Your Name"}</h3>
          <p>{academic.qualification || "Qualification not added"}</p>
        </div>
      </div>

      <div className="completion">
        <div className="completion-text">
          Profile completion: {completionPercentage}%
        </div>

        <div className="progress-bar">
          <div className="progress" style ={{ width: `${completionPercentage}%`}}></div>
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

  {/* CV */}
  <div className="document-row">
    <div>
      <strong>CV</strong>

      <div className="document-file">
        {documents.cv || "No CV uploaded"}
      </div>
    </div>

    <label className="upload-button">
      {documents.cv ? "Replace" : "Upload"}

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleDocumentUpload("cv")}
        hidden
      />
    </label>
     {documents.cv && (
    <button
      type="button"
      className="remove-button"
      onClick={() => handleDocumentRemove("cv")}
    >
      Remove
    </button>
  )}

  </div>

  {/* Academic transcript */}
  <div className="document-row">
    <div>
      <strong>Academic transcript</strong>

      <div className="document-file">
        {documents.transcript || "No transcript uploaded"}
      </div>
    </div>

    <label className="upload-button">
      {documents.transcript ? "Replace" : "Upload"}

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleDocumentUpload("transcript")}
        hidden
      />
    </label>
 {documents.transcript && (
    <button
      type="button"
      className="remove-button"
      onClick={() => handleDocumentRemove("transcript")}
    >
      Remove
    </button>
  )}

  </div>

  {/* ID document */}
  <div className="document-row">
    <div>
      <strong>ID document</strong>

      <div className="document-file">
        {documents.idDocument || "No ID uploaded"}
      </div>
    </div>

    <label className="upload-button">
      {documents.idDocument ? "Replace" : "Upload"}

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleDocumentUpload("idDocument")}
        hidden
      />
    </label>

     {documents.idDocument && (
    <button
      type="button"
      className="remove-button"
      onClick={() => handleDocumentRemove("idDocument")}
    >
      Remove
    </button>
  )}
  </div>

</section>

<div className="profile-save-area">
  <button
    className="save-profile-button"
    onClick={handleSaveProfile}
  >
    Save profile
  </button>

  {saved && (
    <p className="save-success-message">
      ✓ Profile saved successfully
    </p>
  )}
</div>
  </main>


</div>


);
}

export default Profile;
