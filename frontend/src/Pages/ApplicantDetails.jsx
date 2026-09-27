import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import StatusBadge from "../components/StatusBadge";
import {
  getApplicantById,
  getListingById,
  updateApplicantStatus,
} from "../api/dataService.js";

const STATUS_OPTIONS = ["Submitted", "Under review", "Interview", "Accepted", "Rejected"];

export default function ApplicantDetails() {
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [listing, setListing] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const found = getApplicantById(id);
    setApplicant(found);
    setSelectedStatus(found ? found.status : "");
    if (found) setListing(getListingById(found.listingId));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpdateStatus = () => {
    const updated = updateApplicantStatus(applicant.id, selectedStatus);
    setApplicant(updated);
    setToast(`Status updated to "${selectedStatus}"`);
  };

  if (!applicant) {
    return (
      <div className="sp-app">
        <Sidebar />
        <div className="sp-main">
          <Link className="sp-back-link" to="/dashboard">
            <i className="ti ti-arrow-left"></i> Back to dashboard
          </Link>
          <div className="sp-empty-state">Applicant not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-app">
      <Sidebar />

      <div className="sp-main">
        <Link className="sp-back-link" to={`/view-applicants/${applicant.listingId}`}>
          <i className="ti ti-arrow-left"></i> Back to applicants
        </Link>

        <div className="sp-main-head">
          <div>
            <h1>{applicant.studentName}</h1>
            <p>
              Applied for {listing ? listing.title : "a listing"} · {applicant.appliedDate}
            </p>
          </div>
          <StatusBadge status={applicant.status} />
        </div>

        <div className="sp-card">
          <h3>Applicant details</h3>
          <div className="sp-kv">
            <div>
              <div className="sp-k">Full name</div>
              <div className="sp-v">{applicant.studentName}</div>
            </div>
            <div>
              <div className="sp-k">Email</div>
              <div className="sp-v">{applicant.studentEmail}</div>
            </div>
            <div>
              <div className="sp-k">Institution</div>
              <div className="sp-v">{applicant.institution}</div>
            </div>
            <div>
              <div className="sp-k">Field of study</div>
              <div className="sp-v">{applicant.fieldOfStudy}</div>
            </div>
            <div>
              <div className="sp-k">Current year</div>
              <div className="sp-v">{applicant.year}</div>
            </div>
            <div>
              <div className="sp-k">Applied on</div>
              <div className="sp-v">{applicant.appliedDate}</div>
            </div>
          </div>
        </div>

        <div className="sp-card">
          <h3>Documents</h3>
          <div className="sp-doc-row">
            <div className="sp-dname">
              <i className="ti ti-file-text"></i>CV / résumé
            </div>
            <div className={applicant.documents.cv ? "sp-status-ok" : "sp-status-warn"}>
              {applicant.documents.cv ? "Attached ✓" : "Not attached"}
            </div>
          </div>
          <div className="sp-doc-row">
            <div className="sp-dname">
              <i className="ti ti-file-text"></i>Academic transcript
            </div>
            <div className={applicant.documents.transcript ? "sp-status-ok" : "sp-status-warn"}>
              {applicant.documents.transcript ? "Attached ✓" : "Not attached"}
            </div>
          </div>
          <div className="sp-doc-row">
            <div className="sp-dname">
              <i className="ti ti-file-text"></i>ID document
            </div>
            <div className={applicant.documents.idDoc ? "sp-status-ok" : "sp-status-warn"}>
              {applicant.documents.idDoc ? "Attached ✓" : "Not attached"}
            </div>
          </div>
        </div>

        <div className="sp-card">
          <h3>Update status</h3>
          <p style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 16 }}>
            This updates instantly on the student's tracking page.
          </p>
          <div className="sp-status-update-bar">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="sp-btn sp-btn-dark" onClick={handleUpdateStatus}>
              <i className="ti ti-check"></i> Update status
            </button>
          </div>
        </div>

        {toast && <div className="sp-toast">{toast}</div>}
      </div>
    </div>
  );
}
